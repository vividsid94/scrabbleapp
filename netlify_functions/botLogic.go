package main

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"os"
	"sort"
	"strings"
	"time"
)

// Move represents a possible move
type Move struct {
	Word           string   `json:"word"`
	Score          int      `json:"score"`
	Tiles          []Tile   `json:"tiles"`
	Direction      string   `json:"direction"`
	StartPosition  string   `json:"startPosition"`
	Leave          string   `json:"leave"`
	LeaveValue     float64  `json:"leaveValue"`
	TotalValue     float64  `json:"totalValue"`
	IsExchange     bool     `json:"isExchange"`
	NewTiles       []string `json:"newTiles,omitempty"`
	TilesToExchange []string `json:"tilesToExchange,omitempty"`
}

// Tile represents a tile placement
type Tile struct {
	Row     int    `json:"row"`
	Col     int    `json:"col"`
	Letter  string `json:"letter"`
	IsNew   bool   `json:"isNew"`
	IsBlank bool   `json:"isBlank"`
}

// Request represents the incoming request
type Request struct {
	Board   [][]string `json:"board"`
	Letters []string   `json:"letters"`
	Pool    []string   `json:"pool"`
}

// Response represents the response
type Response struct {
	Moves []Move `json:"moves"`
}

var gaddag *GADDAGNode
var leaveValues map[string]float64

// GADDAGNode represents a node in the GADDAG
type GADDAGNode struct {
	Children   map[string]*GADDAGNode `json:"children"`
	IsTerminal bool                   `json:"isTerminal"`
}

func init() {
	// Load GADDAG from JSON file
	data, err := os.ReadFile("gaddag.json")
	if err != nil {
		fmt.Printf("Error reading GADDAG: %v\n", err)
		return
	}
	
	err = json.Unmarshal(data, &gaddag)
	if err != nil {
		fmt.Printf("Error parsing GADDAG: %v\n", err)
		return
	}
	
	// Load leave values
	leavesData, err := os.ReadFile("leaves.json")
	if err != nil {
		fmt.Printf("Error reading leaves: %v\n", err)
		leaveValues = make(map[string]float64)
	} else {
		err = json.Unmarshal(leavesData, &leaveValues)
		if err != nil {
			fmt.Printf("Error parsing leaves: %v\n", err)
			leaveValues = make(map[string]float64)
		}
	}
	
	fmt.Println("GADDAG and leaves loaded successfully")
}

func handler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Validate input
	if len(req.Board) != 15 || len(req.Letters) > 7 {
		http.Error(w, "Invalid input: board must be 15x15 array and letters must be array of up to 7 letters", http.StatusBadRequest)
		return
	}

	// Normalize board (convert null to empty strings)
	board := normalizeBoard(req.Board)
	
	// Generate moves
	fmt.Println("Generating moves...")
	allMoves := generateMoves(board, req.Letters)
	fmt.Printf("Generated %d possible moves\n", len(allMoves))

	// Calculate leave for regular moves
	for i := range allMoves {
		rackCopy := make([]string, len(req.Letters))
		copy(rackCopy, req.Letters)
		
		// Remove tiles used in the move
		for _, tile := range allMoves[i].Tiles {
			if tile.IsNew {
				if tile.IsBlank {
					// For blank tiles, find the blank in the rack
					for j, rackTile := range rackCopy {
						if rackTile == "*" {
							rackCopy = append(rackCopy[:j], rackCopy[j+1:]...)
							break
						}
					}
				} else {
					// For regular tiles, find and remove the letter
					for j, rackTile := range rackCopy {
						if rackTile == tile.Letter {
							rackCopy = append(rackCopy[:j], rackCopy[j+1:]...)
							break
						}
					}
				}
			}
		}
		
		// Sort remaining tiles to create leave
		for j, tile := range rackCopy {
			if tile == "*" {
				rackCopy[j] = "?"
			}
		}
		sort.Strings(rackCopy)
		allMoves[i].Leave = strings.Join(rackCopy, "")
	}

	// Generate exchange moves
	exchangeMoves := generateExchangeMoves(req.Letters, req.Pool)
	
	// Combine regular moves and exchange moves
	combinedMoves := append(allMoves, exchangeMoves...)

	// Process moves to add leave values
	processedMoves := make([]Move, len(combinedMoves))
	for i, move := range combinedMoves {
		leaveValue := getLeaveValue(move.Leave)
		totalValue := move.Score + leaveValue
		if move.IsExchange {
			totalValue = leaveValue // For exchanges, total value is just the leave value
		}
		
		processedMoves[i] = Move{
			Word:           move.Word,
			Score:          move.Score,
			Tiles:          move.Tiles,
			Direction:      move.Direction,
			StartPosition:  move.StartPosition,
			Leave:          move.Leave,
			LeaveValue:     leaveValue,
			TotalValue:     totalValue,
			IsExchange:     move.IsExchange,
			NewTiles:       move.NewTiles,
			TilesToExchange: move.TilesToExchange,
		}
	}

	// Sort by total value
	sort.Slice(processedMoves, func(i, j int) bool {
		return processedMoves[i].TotalValue > processedMoves[j].TotalValue
	})

	response := Response{Moves: processedMoves}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func normalizeBoard(rawBoard [][]interface{}) [][]string {
	board := make([][]string, 15)
	for i := range board {
		board[i] = make([]string, 15)
		for j := range board[i] {
			if i < len(rawBoard) && j < len(rawBoard[i]) && rawBoard[i][j] != nil {
				if str, ok := rawBoard[i][j].(string); ok {
					board[i][j] = str
				}
			}
		}
	}
	return board
}

func generateMoves(board [][]string, rack []string) []Move {
	var moves []Move
	moveSet := make(map[string]bool)
	
	// Convert rack to uppercase and handle blanks
	rackArr := make([]string, len(rack))
	for i, tile := range rack {
		if tile == "*" {
			rackArr[i] = "?"
		} else {
			rackArr[i] = strings.ToUpper(tile)
		}
	}

	// Find anchors
	anchors := findAnchors(board)
	
	// Generate moves at each anchor
	for _, anchor := range anchors {
		anchorMoves := generateMovesAtAnchor(board, rackArr, anchor, moveSet)
		moves = append(moves, anchorMoves...)
	}

	return moves
}

func findAnchors(board [][]string) []struct{ row, col int } {
	var anchors []struct{ row, col int }
	
	for row := 0; row < 15; row++ {
		for col := 0; col < 15; col++ {
			if board[row][col] == "" && isAnchor(board, row, col) {
				anchors = append(anchors, struct{ row, col int }{row, col})
			}
		}
	}
	
	return anchors
}

func isAnchor(board [][]string, row, col int) bool {
	// Check if position is adjacent to existing tiles
	for dr := -1; dr <= 1; dr++ {
		for dc := -1; dc <= 1; dc++ {
			if dr == 0 && dc == 0 {
				continue
			}
			nr, nc := row+dr, col+dc
			if nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && board[nr][nc] != "" {
				return true
			}
		}
	}
	return false
}

func generateMovesAtAnchor(board [][]string, rack []string, anchor struct{ row, col int }, moveSet map[string]bool) []Move {
	var moves []Move
	
	// Try horizontal and vertical directions
	for _, direction := range []string{"horizontal", "vertical"} {
		// Get existing word at this position
		existingWord := getExistingWord(board, anchor.row, anchor.col, direction)
		
		// Generate words that can connect to existing tiles
		words := generateConnectingWords(board, rack, anchor.row, anchor.col, direction, existingWord)
		
		for _, word := range words {
			move := createMove(board, word, anchor.row, anchor.col, direction, rack)
			if move != nil {
				moveKey := fmt.Sprintf("%s-%d,%d-%s", move.Word, move.StartRow, move.StartCol, move.Direction)
				if !moveSet[moveKey] {
					moves = append(moves, *move)
					moveSet[moveKey] = true
				}
			}
		}
	}
	
	return moves
}

func getExistingWord(board [][]string, row, col int, direction string) string {
	var word string
	
	if direction == "horizontal" {
		// Find start of word
		startCol := col
		for startCol > 0 && board[row][startCol-1] != "" {
			startCol--
		}
		
		// Build word
		for c := startCol; c < 15 && board[row][c] != ""; c++ {
			word += board[row][c]
		}
	} else {
		// Find start of word
		startRow := row
		for startRow > 0 && board[startRow-1][col] != "" {
			startRow--
		}
		
		// Build word
		for r := startRow; r < 15 && board[r][col] != ""; r++ {
			word += board[r][col]
		}
	}
	
	return word
}

func generateConnectingWords(board [][]string, rack []string, row, col int, direction string, existingWord string) []string {
	var words []string
	wordSet := make(map[string]bool)
	
	// Generate all possible words from rack
	allWords := generateWordsFromRack(rack)
	
	for _, word := range allWords {
		// Check if this word can connect to existing tiles
		if canConnectWord(board, word, row, col, direction, existingWord) {
			if !wordSet[word] {
				words = append(words, word)
				wordSet[word] = true
			}
		}
	}
	
	return words
}

func canConnectWord(board [][]string, word string, row, col int, direction string, existingWord string) bool {
	// Check if word can be placed and connects properly
	if direction == "horizontal" {
		// Check if word fits
		if col+len(word) > 15 {
			return false
		}
		
		// Check if word connects to existing tiles
		connects := false
		for i := 0; i < len(word); i++ {
			if board[row][col+i] != "" {
				if board[row][col+i] != string(word[i]) {
					return false // Conflict
				}
				connects = true
			}
		}
		
		// Must connect to existing tiles
		return connects
	} else {
		// Check if word fits
		if row+len(word) > 15 {
			return false
		}
		
		// Check if word connects to existing tiles
		connects := false
		for i := 0; i < len(word); i++ {
			if board[row+i][col] != "" {
				if board[row+i][col] != string(word[i]) {
					return false // Conflict
				}
				connects = true
			}
		}
		
		// Must connect to existing tiles
		return connects
	}
}

func generateWordsFromRack(rack []string) []string {
	var words []string
	wordSet := make(map[string]bool)
	
	// Generate all permutations of rack letters
	permutations := generatePermutations(rack)
	
	for _, perm := range permutations {
		// Try all possible word lengths
		for length := 1; length <= len(perm); length++ {
			word := strings.Join(perm[:length], "")
			if isValidWord(word) && !wordSet[word] {
				words = append(words, word)
				wordSet[word] = true
			}
		}
	}
	
	return words
}

func generatePermutations(rack []string) [][]string {
	if len(rack) == 0 {
		return [][]string{{}}
	}
	
	var result [][]string
	for i, tile := range rack {
		// Create rack without current tile
		remaining := make([]string, len(rack)-1)
		copy(remaining[:i], rack[:i])
		copy(remaining[i:], rack[i+1:])
		
		// Get permutations of remaining tiles
		perms := generatePermutations(remaining)
		
		// Add current tile to each permutation
		for _, perm := range perms {
			newPerm := make([]string, len(perm)+1)
			newPerm[0] = tile
			copy(newPerm[1:], perm)
			result = append(result, newPerm)
		}
	}
	
	return result
}

func isValidWord(word string) bool {
	// Use GADDAG to validate word
	if gaddag == nil || len(word) < 2 {
		return false
	}
	
	// Simple GADDAG traversal for word validation
	current := gaddag
	for _, char := range word {
		if current.Children == nil {
			return false
		}
		next, exists := current.Children[string(char)]
		if !exists {
			return false
		}
		current = next
	}
	
	return current != nil && current.IsTerminal
}

func createMove(board [][]string, word string, row, col int, direction string, rack []string) *Move {
	tiles := make([]Tile, 0)
	rackCopy := make([]string, len(rack))
	copy(rackCopy, rack)
	
	// Create tiles for the move
	for i := 0; i < len(word); i++ {
		letter := string(word[i])
		var tileRow, tileCol int
		
		if direction == "horizontal" {
			tileRow, tileCol = row, col+i
		} else {
			tileRow, tileCol = row+i, col
		}
		
		// Check if tile is already on board
		if board[tileRow][tileCol] == "" {
			// Find letter in rack
			found := false
			for j, rackTile := range rackCopy {
				if rackTile == letter || (rackTile == "?" && letter != "") {
					tiles = append(tiles, Tile{
						Row:     tileRow,
						Col:     tileCol,
						Letter:  letter,
						IsNew:   true,
						IsBlank: rackTile == "?",
					})
					rackCopy = append(rackCopy[:j], rackCopy[j+1:]...)
					found = true
					break
				}
			}
			if !found {
				return nil // Can't place this word
			}
		}
	}
	
	if len(tiles) == 0 {
		return nil
	}
	
	// Calculate score
	score := calculateScore(board, tiles)
	
	// Convert direction to match JS format
	directionStr := "right"
	if direction == "vertical" {
		directionStr = "down"
	}
	
	return &Move{
		Word:          word,
		Score:         score,
		Tiles:         tiles,
		Direction:     directionStr,
		StartPosition: fmt.Sprintf("%d%s", row+1, string(rune('A'+col))),
		IsExchange:    false,
	}
}

func calculateScore(board [][]string, tiles []Tile) int {
	// Simple scoring - in real implementation, would include multipliers
	score := 0
	for _, tile := range tiles {
		score += getLetterScore(tile.Letter)
	}
	return score
}

func getLetterScore(letter string) int {
	scores := map[string]int{
		"A": 1, "E": 1, "I": 1, "O": 1, "U": 1, "L": 1, "N": 1, "S": 1, "T": 1, "R": 1,
		"D": 2, "G": 2,
		"B": 3, "C": 3, "M": 3, "P": 3,
		"F": 4, "H": 4, "V": 4, "W": 4, "Y": 4,
		"K": 5,
		"J": 8, "X": 8,
		"Q": 10, "Z": 10,
	}
	return scores[letter]
}

func generateExchangeMoves(letters []string, pool []string) []Move {
	var moves []Move
	
	// Only generate exchange moves if there are at least 7 tiles in the pool
	if len(pool) < 7 {
		return moves
	}
	
	// Generate all possible combinations of 1-7 tiles
	for i := 1; i <= len(letters) && i <= 7; i++ {
		combinations := generateCombinations(letters, i)
		for _, combo := range combinations {
			// Calculate the new rack after exchange
			newRack := make([]string, 0)
			for _, letter := range letters {
				found := false
				for _, comboLetter := range combo {
					if letter == comboLetter {
						found = true
						break
					}
				}
				if !found {
					newRack = append(newRack, letter)
				}
			}
			
			// Draw new tiles from pool
			rand.Seed(time.Now().UnixNano())
			shuffledPool := make([]string, len(pool))
			copy(shuffledPool, pool)
			rand.Shuffle(len(shuffledPool), func(i, j int) {
				shuffledPool[i], shuffledPool[j] = shuffledPool[j], shuffledPool[i]
			})
			
			newTiles := shuffledPool[:len(combo)]
			newRack = append(newRack, newTiles...)
			
			// Sort the new rack for leave calculation
			for j, tile := range newRack {
				if tile == "*" {
					newRack[j] = "?"
				}
			}
			sort.Strings(newRack)
			leave := strings.Join(newRack, "")
			
			moves = append(moves, Move{
				Word:           fmt.Sprintf("Exchange %s", strings.Join(combo, "")),
				Score:          0,
				Tiles:          []Tile{},
				Direction:      "exchange",
				StartPosition:  "Exchange",
				Leave:          leave,
				IsExchange:     true,
				NewTiles:       newTiles,
				TilesToExchange: combo,
			})
		}
	}
	
	return moves
}

func generateCombinations(letters []string, size int) [][]string {
	if size == 0 {
		return [][]string{{}}
	}
	if len(letters) == 0 {
		return [][]string{}
	}
	
	var result [][]string
	
	// Include first letter
	first := letters[0]
	rest := letters[1:]
	
	// Combinations with first letter
	combosWithFirst := generateCombinations(rest, size-1)
	for _, combo := range combosWithFirst {
		newCombo := make([]string, len(combo)+1)
		newCombo[0] = first
		copy(newCombo[1:], combo)
		result = append(result, newCombo)
	}
	
	// Combinations without first letter
	combosWithoutFirst := generateCombinations(rest, size)
	result = append(result, combosWithoutFirst...)
	
	return result
}

func getLeaveValue(leave string) float64 {
	if leaveValues == nil {
		return 0
	}
	value, exists := leaveValues[leave]
	if !exists {
		return 0
	}
	return value
} 