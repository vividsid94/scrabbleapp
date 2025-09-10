import React, { useRef, useState, useEffect } from 'react';
import { useEscapeRoom3DStore } from '../../stores/escapeRoom3DStore';
import './PhysicalPuzzles.css';

// 3D Interactive Door with Physical Lock
export const PhysicalDoor = ({ puzzle, isUnlocked, onUnlock, theme }) => {
  const doorRef = useRef();
  const [isAnimating, setIsAnimating] = useState(false);
  const [lockRotation, setLockRotation] = useState(0);
  const [selectedTiles, setSelectedTiles] = useState([]);
  const [currentWord, setCurrentWord] = useState('');

  // Update lock rotation based on word progress
  useEffect(() => {
    const progress = currentWord.length / puzzle.solution.length;
    setLockRotation(progress * 360);
  }, [currentWord, puzzle.solution.length]);

  const handleTileClick = (tile, index) => {
    if (selectedTiles.includes(index)) {
      setSelectedTiles(selectedTiles.filter(i => i !== index));
      setCurrentWord(selectedTiles.filter(i => i !== index).map(i => puzzle.tiles[i]).join(''));
    } else {
      const newSelected = [...selectedTiles, index];
      setSelectedTiles(newSelected);
      setCurrentWord(newSelected.map(i => puzzle.tiles[i]).join(''));
      
      // Check if word is complete
      if (newSelected.map(i => puzzle.tiles[i]).join('').toUpperCase() === puzzle.solution) {
        setTimeout(() => {
          setIsAnimating(true);
          onUnlock(puzzle.id);
        }, 500);
      }
    }
  };

  return (
    <div className="physical-door-container">
      <div className="door-3d" ref={doorRef}>
        <div className="door-frame">
          <div className="door-panel">
            {/* Physical Lock Mechanism */}
            <div className="lock-mechanism">
              <div 
                className="lock-cylinder" 
                style={{ transform: `rotateY(${lockRotation}deg)` }}
              >
                <div className="lock-keyhole"></div>
              </div>
              <div className="lock-tumblers">
                {puzzle.tiles.map((tile, index) => (
                  <div 
                    key={index}
                    className={`tumbler ${selectedTiles.includes(index) ? 'active' : ''}`}
                    onClick={() => handleTileClick(tile, index)}
                    style={{ 
                      animationDelay: `${index * 0.1}s`,
                      transform: `translateZ(${Math.sin(index) * 10}px)`
                    }}
                  >
                    <div className="tumbler-letter">{tile}</div>
                    <div className="tumbler-glow"></div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Door Handle */}
            <div className="door-handle">
              <div className="handle-knob"></div>
              <div className="handle-plate"></div>
            </div>
          </div>
        </div>
        
        {/* Door Glow Effect */}
        <div className={`door-glow ${isUnlocked ? 'unlocked' : ''}`}></div>
      </div>
      
      {/* Word Display */}
      <div className="door-word-display">
        <div className="current-word">
          {currentWord || 'Select tiles to unlock...'}
        </div>
        <div className="word-progress">
          {currentWord.length}/{puzzle.solution.length}
        </div>
      </div>
    </div>
  );
};

// 3D Interactive Bookshelf with Physical Books
export const PhysicalBookshelf = ({ puzzle, isSolved, onSolve, theme }) => {
  const shelfRef = useRef();
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [currentWord, setCurrentWord] = useState('');
  const [books, setBooks] = useState([]);

  // Initialize books with letters
  React.useEffect(() => {
    const bookLetters = puzzle.tiles.map((tile, index) => ({
      id: index,
      letter: tile,
      position: { x: (index % 5) * 60, y: Math.floor(index / 5) * 80 },
      isSelected: false,
      isPulled: false
    }));
    setBooks(bookLetters);
  }, [puzzle]);

  const handleBookClick = (bookId) => {
    const updatedBooks = books.map(book => 
      book.id === bookId 
        ? { ...book, isSelected: !book.isSelected, isPulled: !book.isPulled }
        : book
    );
    setBooks(updatedBooks);
    
    const selectedBooks = updatedBooks.filter(book => book.isSelected);
    setSelectedBooks(selectedBooks);
    setCurrentWord(selectedBooks.map(book => book.letter).join(''));
    
    // Check if word is complete
    if (selectedBooks.map(book => book.letter).join('').toUpperCase() === puzzle.solution) {
      setTimeout(() => {
        onSolve(puzzle.id);
      }, 500);
    }
  };

  return (
    <div className="physical-bookshelf-container">
      <div className="bookshelf-3d" ref={shelfRef}>
        <div className="shelf-frame">
          <div className="shelf-back"></div>
          <div className="shelf-sides"></div>
          <div className="shelf-shelves">
            {Array.from({ length: 5 }).map((_, shelfIndex) => (
              <div key={shelfIndex} className="shelf-level"></div>
            ))}
          </div>
        </div>
        
        {/* Physical Books */}
        <div className="books-container">
          {books.map((book) => (
            <div
              key={book.id}
              className={`book-3d ${book.isSelected ? 'selected' : ''} ${book.isPulled ? 'pulled' : ''}`}
              style={{
                left: book.position.x,
                top: book.position.y,
                animationDelay: `${book.id * 0.1}s`
              }}
              onClick={() => handleBookClick(book.id)}
            >
              <div className="book-spine">
                <div className="book-title">{book.letter}</div>
              </div>
              <div className="book-pages"></div>
              <div className="book-glow"></div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Word Display */}
      <div className="bookshelf-word-display">
        <div className="current-word">
          {currentWord || 'Pull books to form a word...'}
        </div>
        <div className="word-progress">
          {currentWord.length}/{puzzle.solution.length}
        </div>
      </div>
    </div>
  );
};

// 3D Interactive Crystal Orb with Physical Energy
export const PhysicalCrystalOrb = ({ puzzle, isSolved, onSolve, theme }) => {
  const orbRef = useRef();
  const [energyLevel, setEnergyLevel] = useState(0);
  const [wordChain, setWordChain] = useState([]);
  const [currentWord, setCurrentWord] = useState('');
  const [availableLetters, setAvailableLetters] = useState('ABCDEFGHIJKLMNOPQRSTUVWXYZ');

  // Update energy level and glow
  useEffect(() => {
    if (orbRef.current) {
      const glowIntensity = energyLevel * 0.5;
      orbRef.current.style.boxShadow = `
        0 0 ${20 + glowIntensity * 20}px rgba(0, 255, 255, ${0.3 + glowIntensity}),
        inset 0 0 ${10 + glowIntensity * 10}px rgba(0, 255, 255, ${0.2 + glowIntensity})
      `;
    }
  }, [energyLevel]);

  const handleLetterClick = (letter) => {
    setCurrentWord(currentWord + letter);
  };

  const handleSubmitWord = () => {
    if (currentWord.length >= puzzle.minLength) {
      const newChain = [...wordChain, currentWord];
      setWordChain(newChain);
      setCurrentWord('');
      setEnergyLevel(newChain.length / 5); // Energy based on chain length
      
      // Check if chain is complete
      if (newChain.length >= 3) {
        setTimeout(() => {
          onSolve(puzzle.id, newChain);
        }, 500);
      }
    }
  };

  return (
    <div className="physical-crystal-container">
      <div className="crystal-orb-3d" ref={orbRef}>
        <div className="orb-core">
          <div className="orb-inner-glow"></div>
          <div className="orb-particles">
            {Array.from({ length: 20 }).map((_, i) => (
              <div 
                key={i}
                className="orb-particle"
                style={{
                  animationDelay: `${i * 0.2}s`,
                  transform: `rotateY(${i * 18}deg) translateZ(30px)`
                }}
              />
            ))}
          </div>
        </div>
        <div className="orb-outer-ring"></div>
        <div className="orb-energy-waves">
          {Array.from({ length: 3 }).map((_, i) => (
            <div 
              key={i}
              className="energy-wave"
              style={{ animationDelay: `${i * 0.5}s` }}
            />
          ))}
        </div>
      </div>
      
      {/* Letter Selection Interface */}
      <div className="crystal-interface">
        <div className="letter-grid">
          {availableLetters.split('').map((letter, index) => (
            <button
              key={index}
              className="letter-btn"
              onClick={() => handleLetterClick(letter)}
            >
              {letter}
            </button>
          ))}
        </div>
        
        <div className="word-input">
          <div className="current-word-display">
            {currentWord || 'Type a word...'}
          </div>
          <button 
            onClick={handleSubmitWord}
            disabled={currentWord.length < puzzle.minLength}
            className="submit-word-btn"
          >
            Add Word
          </button>
        </div>
        
        <div className="word-chain-display">
          <h4>Word Chain:</h4>
          <div className="chain-words">
            {wordChain.map((word, index) => (
              <span key={index} className="chain-word">
                {word}
                {index < wordChain.length - 1 && ' → '}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// 3D Interactive Riddle Stone with Physical Inscription
export const PhysicalRiddleStone = ({ puzzle, isSolved, onSolve, theme }) => {
  const stoneRef = useRef();
  const [answer, setAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [inscriptionGlow, setInscriptionGlow] = useState(0.5);

  const handleSubmit = () => {
    if (answer.toUpperCase() === puzzle.solution.toUpperCase()) {
      onSolve(puzzle.id);
    } else {
      setAnswer('');
    }
  };

  return (
    <div className="physical-stone-container">
      <div className="riddle-stone-3d" ref={stoneRef}>
        <div className="stone-surface">
          <div className="stone-texture"></div>
          <div className="stone-inscription">
            <div 
              className="inscription-text"
              style={{ 
                textShadow: `0 0 ${10 + inscriptionGlow * 10}px rgba(255, 217, 61, ${0.5 + inscriptionGlow * 0.5})`
              }}
            >
              {puzzle.description}
            </div>
            {showHint && (
              <div className="hint-text">
                💡 {puzzle.hint}
              </div>
            )}
          </div>
        </div>
        <div className="stone-glow"></div>
        <div className="stone-cracks">
          {Array.from({ length: 8 }).map((_, i) => (
            <div 
              key={i}
              className="crack"
              style={{
                transform: `rotate(${i * 45}deg)`,
                animationDelay: `${i * 0.2}s`
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Answer Input */}
      <div className="stone-interface">
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Enter your answer..."
          className="answer-input"
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
        />
        <div className="stone-controls">
          <button onClick={handleSubmit} disabled={answer.length === 0}>
            Submit Answer
          </button>
          <button onClick={() => setShowHint(!showHint)}>
            {showHint ? 'Hide Hint' : 'Show Hint'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Physical Puzzle Renderer
export const PhysicalPuzzle = ({ puzzle, onSolve, isSolved, theme }) => {
  switch (puzzle.type) {
    case 'word_lock':
      return (
        <PhysicalDoor 
          puzzle={puzzle} 
          isUnlocked={isSolved} 
          onUnlock={onSolve} 
          theme={theme} 
        />
      );
    case 'anagram':
      return (
        <PhysicalBookshelf 
          puzzle={puzzle} 
          isSolved={isSolved} 
          onSolve={onSolve} 
          theme={theme} 
        />
      );
    case 'word_chain':
      return (
        <PhysicalCrystalOrb 
          puzzle={puzzle} 
          isSolved={isSolved} 
          onSolve={onSolve} 
          theme={theme} 
        />
      );
    case 'riddle':
      return (
        <PhysicalRiddleStone 
          puzzle={puzzle} 
          isSolved={isSolved} 
          onSolve={onSolve} 
          theme={theme} 
        />
      );
    default:
      return <div>Unknown puzzle type</div>;
  }
};
