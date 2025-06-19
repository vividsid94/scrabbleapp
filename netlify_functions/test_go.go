package main

import (
	"encoding/json"
	"fmt"
	"strings"
)

// Simple test function to verify the code structure
func testBasicFunctionality() {
	fmt.Println("Testing Go Scrabble Move Generator...")
	
	// Test board
	board := make([][]string, 15)
	for i := range board {
		board[i] = make([]string, 15)
	}
	
	// Place a word in the center
	board[7][7] = "A"
	board[7][8] = "T"
	
	// Test rack
	rack := []string{"S", "E", "T"}
	
	// Test basic functions
	anchors := findAnchors(board)
	fmt.Printf("Found %d anchors\n", len(anchors))
	
	words := generateWordsFromRack(rack)
	fmt.Printf("Generated %d words from rack: %v\n", len(words), words)
	
	// Test word validation
	testWords := []string{"SET", "TEST", "ABC", "AT"}
	for _, word := range testWords {
		valid := isValidWord(word)
		fmt.Printf("Word '%s' is valid: %t\n", word, valid)
	}
	
	fmt.Println("Basic functionality test completed!")
}

// Test GADDAG loading
func testGADDAGLoading() {
	fmt.Println("Testing GADDAG loading...")
	
	if gaddag == nil {
		fmt.Println("GADDAG is nil - check if gaddag.json exists")
		return
	}
	
	// Test a few words
	testWords := []string{"HELLO", "WORLD", "SCRABBLE", "TEST"}
	for _, word := range testWords {
		valid := isValidWord(word)
		fmt.Printf("GADDAG validation for '%s': %t\n", word, valid)
	}
}

func main() {
	testBasicFunctionality()
	testGADDAGLoading()
} 