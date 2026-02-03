import React, { useState, useEffect, useRef } from 'react';
import { wordJudgmentWords } from '../data/puzzleBank';
import PuzzleFrame from '../components/PuzzleFrame';
import HintSystem from '../components/HintSystem';

const TIME_PER_WORD = 4; // seconds (reduced from 6)

export default function WordJudgment({ onSolve, theme }) {
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [solved, setSolved] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_WORD);
  const timerRef = useRef(null);

  const current = wordJudgmentWords[index];
  const totalWords = wordJudgmentWords.length;
  const needed = 16; // Need 16/18 (was 10/12)

  // Countdown timer per word
  useEffect(() => {
    if (!current || solved || showResult) return;
    setTimeLeft(TIME_PER_WORD);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          // Time's up — count as wrong
          handleResult(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [index, solved]);

  // Safety check: if current is undefined, don't render
  if (!current) {
    return null;
  }

  const handleResult = (correct) => {
    clearInterval(timerRef.current);
    const newCorrect = correctCount + (correct ? 1 : 0);
    setShowResult(true);

    if (correct) {
      setFeedback('Correct!');
    } else {
      setFeedback(`Wrong! ${current.word} is ${current.valid ? 'VALID' : 'INVALID'}.`);
    }

    setTimeout(() => {
      setShowResult(false);
      if (index < totalWords - 1) {
        setCorrectCount(newCorrect);
        setIndex(i => i + 1);
        setFeedback('');
      } else {
        if (newCorrect >= needed) {
          setSolved(true);
          setFeedback(`Judgment passed! ${newCorrect}/${totalWords} correct.`);
          setTimeout(() => onSolve(120 + (newCorrect - needed) * 15), 600);
        } else {
          setFeedback(`Only ${newCorrect}/${totalWords}. Need ${needed}. Restarting...`);
          setTimeout(() => {
            setIndex(0);
            setCorrectCount(0);
            setFeedback('');
          }, 1500);
        }
      }
    }, 1000);
  };

  const handleJudge = (isValid) => {
    if (solved || showResult) return;
    handleResult(isValid === current.valid);
  };

  const timerPct = (timeLeft / TIME_PER_WORD) * 100;
  const timerUrgent = timeLeft <= 2;

  return (
    <PuzzleFrame title="Word Judgment" solved={solved} theme={theme}>
      <p style={{ color: '#b8a88a', textAlign: 'center', marginBottom: 6, fontSize: 14 }}>
        Valid or invalid? You have {TIME_PER_WORD} seconds per word.
      </p>
      <p style={{ color: '#8a7a6a', textAlign: 'center', marginBottom: 16, fontSize: 13 }}>
        Word {index + 1}/{totalWords} &middot; {correctCount} correct &middot; Need {needed} &middot; {timeLeft}s left
      </p>

      {/* Timer bar */}
      {!solved && !showResult && (
        <div style={{
          width: '80%', height: 6, background: 'rgba(255,255,255,0.1)',
          borderRadius: 3, margin: '0 auto 20px', overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${timerPct}%`,
            background: timerUrgent
              ? 'linear-gradient(90deg, #f87171, #dc2626)'
              : 'linear-gradient(90deg, #c9a84c, #e8d5b7)',
            borderRadius: 3,
            transition: 'width 1s linear, background 0.3s',
          }} />
        </div>
      )}

      <div style={{
        textAlign: 'center',
        marginBottom: 28,
        fontSize: 44,
        fontFamily: "'Georgia', serif",
        fontWeight: 'bold',
        color: '#e8d5b7',
        textShadow: '0 2px 8px rgba(0,0,0,0.5)',
        letterSpacing: 5,
      }}>
        {current?.word}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 20 }}>
        <button
          onClick={() => handleJudge(true)}
          disabled={solved || showResult}
          style={{
            padding: '14px 36px',
            borderRadius: 10,
            border: '2px solid #2d6a4f',
            background: 'rgba(45,106,79,0.2)',
            color: '#52b788',
            fontSize: 18,
            fontFamily: "'Georgia', serif",
            fontWeight: 'bold',
            cursor: solved || showResult ? 'default' : 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { if (!solved && !showResult) e.target.style.background = 'rgba(45,106,79,0.35)'; }}
          onMouseLeave={e => { if (!solved && !showResult) e.target.style.background = 'rgba(45,106,79,0.2)'; }}
        >
          VALID
        </button>
        <button
          onClick={() => handleJudge(false)}
          disabled={solved || showResult}
          style={{
            padding: '14px 36px',
            borderRadius: 10,
            border: '2px solid #9b2335',
            background: 'rgba(155,35,53,0.2)',
            color: '#f87171',
            fontSize: 18,
            fontFamily: "'Georgia', serif",
            fontWeight: 'bold',
            cursor: solved || showResult ? 'default' : 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { if (!solved && !showResult) e.target.style.background = 'rgba(155,35,53,0.35)'; }}
          onMouseLeave={e => { if (!solved && !showResult) e.target.style.background = 'rgba(155,35,53,0.2)'; }}
        >
          INVALID
        </button>
      </div>

      {feedback && (
        <div style={{
          textAlign: 'center', marginTop: 16,
          color: feedback.includes('Correct') || feedback.includes('passed') ? '#52b788' : '#f87171',
          fontFamily: "'Georgia', serif", fontSize: 15,
        }}>
          {feedback}
        </div>
      )}

      <HintSystem hints={[
        'CWMS and CRWTH are valid — Welsh/English words with no standard vowels.',
        'If it looks like pure nonsense consonants (6+ random letters), it\'s likely invalid.',
      ]} />
    </PuzzleFrame>
  );
}
