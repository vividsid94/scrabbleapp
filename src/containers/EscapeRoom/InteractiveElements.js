import React, { useState, useEffect } from 'react';
import './InteractiveElements.css';

// Interactive door component
export const InteractiveDoor = ({ 
  puzzle, 
  onUnlock, 
  isUnlocked, 
  theme = 'mystery' 
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [glowIntensity, setGlowIntensity] = useState(0);

  useEffect(() => {
    if (isUnlocked) {
      setIsAnimating(true);
      setGlowIntensity(1);
      setTimeout(() => setIsAnimating(false), 2000);
    }
  }, [isUnlocked]);

  const handleClick = () => {
    if (!isUnlocked) {
      setGlowIntensity(0.5);
      setTimeout(() => setGlowIntensity(0), 500);
    }
  };

  return (
    <div 
      className={`interactive-door ${theme} ${isUnlocked ? 'unlocked' : 'locked'} ${isAnimating ? 'animating' : ''}`}
      onClick={handleClick}
      style={{
        '--glow-intensity': glowIntensity
      }}
    >
      <div className="door-frame">
        <div className="door-panel">
          <div className="door-handle">
            {isUnlocked ? '🔓' : '🔒'}
          </div>
          <div className="door-symbols">
            {puzzle.tiles.map((tile, index) => (
              <div key={index} className="door-tile-slot">
                {tile}
              </div>
            ))}
          </div>
        </div>
        <div className="door-glow" />
      </div>
      <div className="door-label">
        {puzzle.title}
      </div>
    </div>
  );
};

// Interactive bookshelf component
export const InteractiveBookshelf = ({ 
  puzzle, 
  onSolve, 
  isSolved, 
  theme = 'mystery' 
}) => {
  const [selectedTiles, setSelectedTiles] = useState([]);
  const [currentWord, setCurrentWord] = useState('');

  const handleTileClick = (tile) => {
    if (selectedTiles.includes(tile)) {
      setSelectedTiles(selectedTiles.filter(t => t !== tile));
      setCurrentWord(currentWord.replace(tile, ''));
    } else {
      setSelectedTiles([...selectedTiles, tile]);
      setCurrentWord(currentWord + tile);
    }
  };

  const handleSubmit = () => {
    if (currentWord.toUpperCase() === puzzle.solution) {
      onSolve(puzzle.id);
    } else {
      // Wrong answer animation
      setSelectedTiles([]);
      setCurrentWord('');
    }
  };

  return (
    <div className={`interactive-bookshelf ${theme} ${isSolved ? 'solved' : 'unsolved'}`}>
      <div className="bookshelf-frame">
        <div className="bookshelf-shelves">
          {Array.from({ length: 5 }).map((_, shelfIndex) => (
            <div key={shelfIndex} className="shelf">
              {Array.from({ length: 8 }).map((_, bookIndex) => (
                <div key={bookIndex} className="book" />
              ))}
            </div>
          ))}
        </div>
        <div className="bookshelf-clue">
          <div className="clue-text">{puzzle.description}</div>
          <div className="tile-rack">
            {puzzle.tiles.map((tile, index) => (
              <button
                key={index}
                className={`tile ${selectedTiles.includes(tile) ? 'selected' : ''}`}
                onClick={() => handleTileClick(tile)}
              >
                {tile}
              </button>
            ))}
          </div>
          <div className="word-display">
            {currentWord || 'Select tiles...'}
          </div>
          <button 
            onClick={handleSubmit}
            disabled={currentWord.length === 0}
            className="submit-btn"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

// Interactive crystal orb component
export const InteractiveCrystalOrb = ({ 
  puzzle, 
  onSolve, 
  isSolved, 
  theme = 'mystery' 
}) => {
  const [wordChain, setWordChain] = useState([]);
  const [currentWord, setCurrentWord] = useState('');
  const [availableLetters, setAvailableLetters] = useState('ABCDEFGHIJKLMNOPQRSTUVWXYZ');

  const handleLetterClick = (letter) => {
    setCurrentWord(currentWord + letter);
  };

  const handleSubmitWord = () => {
    if (currentWord.length >= puzzle.minLength) {
      setWordChain([...wordChain, currentWord]);
      setCurrentWord('');
    }
  };

  const handleClear = () => {
    setCurrentWord('');
  };

  const handleSolve = () => {
    if (wordChain.length > 0) {
      onSolve(puzzle.id, wordChain);
    }
  };

  return (
    <div className={`interactive-crystal-orb ${theme} ${isSolved ? 'solved' : 'unsolved'}`}>
      <div className="crystal-container">
        <div className="crystal-orb">
          <div className="crystal-glow" />
          <div className="crystal-core">
            {puzzle.startLetter}
          </div>
        </div>
        <div className="crystal-pedestal">
          <div className="pedestal-text">{puzzle.description}</div>
        </div>
      </div>
      
      <div className="word-chain-interface">
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
          <div className="word-controls">
            <button onClick={handleSubmitWord} disabled={currentWord.length < puzzle.minLength}>
              Add Word
            </button>
            <button onClick={handleClear}>Clear</button>
          </div>
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
        
        <button 
          onClick={handleSolve}
          disabled={wordChain.length === 0}
          className="solve-btn"
        >
          Solve Chain
        </button>
      </div>
    </div>
  );
};

// Interactive riddle stone component
export const InteractiveRiddleStone = ({ 
  puzzle, 
  onSolve, 
  isSolved, 
  theme = 'mystery' 
}) => {
  const [answer, setAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);

  const handleSubmit = () => {
    if (answer.toUpperCase() === puzzle.solution.toUpperCase()) {
      onSolve(puzzle.id);
    } else {
      setAnswer('');
    }
  };

  return (
    <div className={`interactive-riddle-stone ${theme} ${isSolved ? 'solved' : 'unsolved'}`}>
      <div className="stone-container">
        <div className="stone-surface">
          <div className="riddle-text">
            <h3>{puzzle.title}</h3>
            <p>{puzzle.description}</p>
            {showHint && (
              <div className="hint-text">
                💡 {puzzle.hint}
              </div>
            )}
          </div>
        </div>
        <div className="stone-glow" />
      </div>
      
      <div className="riddle-interface">
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Enter your answer..."
          className="answer-input"
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
        />
        <div className="riddle-controls">
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

// Interactive pattern device component
export const InteractivePatternDevice = ({ 
  puzzle, 
  onSolve, 
  isSolved, 
  theme = 'scifi' 
}) => {
  const [currentWord, setCurrentWord] = useState('');
  const [isValid, setIsValid] = useState(null);

  const handleWordChange = (word) => {
    setCurrentWord(word);
    // Validate pattern in real-time
    if (word.length > 0) {
      const valid = validatePattern(word, puzzle.pattern);
      setIsValid(valid);
    } else {
      setIsValid(null);
    }
  };

  const validatePattern = (word, pattern) => {
    const w = word.toUpperCase();
    switch (pattern) {
      case 'SAME_START_END':
        return w.length > 1 && w[0] === w[w.length - 1];
      case 'PALINDROME':
        return w === w.split('').reverse().join('');
      case 'DOUBLE_LETTER':
        for (let i = 0; i < w.length - 1; i++) {
          if (w[i] === w[i + 1]) return true;
        }
        return false;
      default:
        return false;
    }
  };

  const handleSubmit = () => {
    if (isValid) {
      onSolve(puzzle.id, currentWord);
    }
  };

  return (
    <div className={`interactive-pattern-device ${theme} ${isSolved ? 'solved' : 'unsolved'}`}>
      <div className="device-container">
        <div className="device-screen">
          <div className="screen-content">
            <h3>{puzzle.title}</h3>
            <p>{puzzle.description}</p>
            <div className="pattern-example">
              Example: {puzzle.example}
            </div>
          </div>
          <div className="screen-glow" />
        </div>
      </div>
      
      <div className="pattern-interface">
        <input
          type="text"
          value={currentWord}
          onChange={(e) => handleWordChange(e.target.value)}
          placeholder="Enter a word..."
          className={`pattern-input ${isValid === true ? 'valid' : isValid === false ? 'invalid' : ''}`}
        />
        <div className="validation-indicator">
          {isValid === true && '✅ Valid pattern!'}
          {isValid === false && '❌ Invalid pattern'}
        </div>
        <button 
          onClick={handleSubmit}
          disabled={!isValid}
          className="submit-pattern-btn"
        >
          Submit Pattern
        </button>
      </div>
    </div>
  );
};

// Main interactive element renderer
export const InteractiveElement = ({ 
  puzzle, 
  onSolve, 
  isSolved, 
  theme 
}) => {
  switch (puzzle.type) {
    case 'word_lock':
      return (
        <InteractiveDoor 
          puzzle={puzzle} 
          onUnlock={onSolve} 
          isUnlocked={isSolved} 
          theme={theme} 
        />
      );
    case 'anagram':
      return (
        <InteractiveBookshelf 
          puzzle={puzzle} 
          onSolve={onSolve} 
          isSolved={isSolved} 
          theme={theme} 
        />
      );
    case 'word_chain':
      return (
        <InteractiveCrystalOrb 
          puzzle={puzzle} 
          onSolve={onSolve} 
          isSolved={isSolved} 
          theme={theme} 
        />
      );
    case 'riddle':
      return (
        <InteractiveRiddleStone 
          puzzle={puzzle} 
          onSolve={onSolve} 
          isSolved={isSolved} 
          theme={theme} 
        />
      );
    case 'pattern':
      return (
        <InteractivePatternDevice 
          puzzle={puzzle} 
          onSolve={onSolve} 
          isSolved={isSolved} 
          theme={theme} 
        />
      );
    default:
      return <div>Unknown puzzle type</div>;
  }
};
