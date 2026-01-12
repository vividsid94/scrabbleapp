/**
 * Move Coach Analysis
 * 
 * Provides AI-powered move analysis with strategic insights and personalized tips
 */

/**
 * Analyzes a move and provides coaching insights
 * @param {Object} moveData - The move data to analyze
 * @param {Array} topMoves - Array of top moves for comparison
 * @param {Object} gameState - Current game state
 * @returns {Object} Analysis result with insights and tips
 */
export const analyzeMove = (moveData, topMoves = [], gameState = {}) => {
  const {
    score = 0,
    word = '',
    leave = '',
    leaveValue = 0,
    boardControl = 0,
    defensiveValue = 0,
    player1points = 0,
    player2points = 0,
    currentPlayer = 1,
    moveNumber = 0
  } = moveData;

  const analysis = {
    overallRating: 'good', // 'excellent', 'good', 'fair', 'poor'
    score: 0, // 0-100 rating
    insights: [],
    tips: [],
    strengths: [],
    weaknesses: [],
    comparison: null,
    strategicNotes: []
  };

  // Calculate total move value
  const totalValue = score + leaveValue;
  
  // Find best move for comparison
  const bestMove = topMoves.length > 0 ? topMoves[0] : null;
  const bestTotalValue = bestMove ? (bestMove.score + (bestMove.leaveValue || 0)) : totalValue;
  const valueDifference = bestTotalValue - totalValue;

  // Score Analysis (0-40 points)
  let scoreRating = 0;
  if (score >= 50) {
    scoreRating = 40;
    analysis.strengths.push('High-scoring move');
    analysis.insights.push(`Excellent score of ${score} points!`);
  } else if (score >= 30) {
    scoreRating = 30;
    analysis.strengths.push('Solid scoring move');
    analysis.insights.push(`Good score of ${score} points.`);
  } else if (score >= 15) {
    scoreRating = 20;
    analysis.insights.push(`Decent score of ${score} points.`);
  } else {
    scoreRating = 10;
    analysis.weaknesses.push('Low scoring move');
    analysis.insights.push(`Low score of ${score} points. Consider higher-scoring options.`);
  }

  // Leave Value Analysis (0-30 points)
  let leaveRating = 0;
  if (leaveValue >= 5) {
    leaveRating = 30;
    analysis.strengths.push('Excellent leave value');
    analysis.insights.push(`Great leave value of ${leaveValue.toFixed(1)}! You're keeping strong tiles.`);
  } else if (leaveValue >= 2) {
    leaveRating = 20;
    analysis.strengths.push('Good leave value');
    analysis.insights.push(`Decent leave value of ${leaveValue.toFixed(1)}.`);
  } else if (leaveValue >= 0) {
    leaveRating = 10;
    analysis.insights.push(`Neutral leave value of ${leaveValue.toFixed(1)}.`);
  } else {
    leaveRating = 0;
    analysis.weaknesses.push('Poor leave value');
    analysis.insights.push(`Negative leave value of ${leaveValue.toFixed(1)}. You're leaving weak tiles.`);
    analysis.tips.push('Consider playing tiles that leave you with better letter combinations.');
  }

  // Board Control Analysis (0-20 points)
  let controlRating = 0;
  if (boardControl >= 20) {
    controlRating = 20;
    analysis.strengths.push('Strong board control');
    analysis.insights.push(`Excellent board control! You're dominating the board.`);
  } else if (boardControl >= 0) {
    controlRating = 10;
    analysis.insights.push(`Neutral board control.`);
  } else {
    controlRating = 5;
    analysis.weaknesses.push('Giving up board control');
    analysis.insights.push(`Negative board control. You may be opening up opportunities for your opponent.`);
    analysis.tips.push('Try to maintain control of key board positions.');
  }

  // Comparison Analysis (0-10 points)
  let comparisonRating = 10;
  if (bestMove && valueDifference > 0) {
    comparisonRating = Math.max(0, 10 - (valueDifference / 5));
    if (valueDifference > 20) {
      analysis.weaknesses.push('Much better moves available');
      analysis.insights.push(`There are moves worth ${valueDifference.toFixed(1)} more points available.`);
      analysis.tips.push('Check the top moves panel to see better options!');
    } else if (valueDifference > 10) {
      analysis.insights.push(`There are slightly better moves available (${valueDifference.toFixed(1)} points better).`);
    } else {
      analysis.strengths.push('Near-optimal move');
      analysis.insights.push(`This is very close to the best available move!`);
    }
  } else if (!bestMove || valueDifference <= 0) {
    analysis.strengths.push('Optimal move');
    analysis.insights.push(`This appears to be the best move available!`);
  }

  // Calculate overall score
  analysis.score = Math.round(scoreRating + leaveRating + controlRating + comparisonRating);
  
  // Determine overall rating
  if (analysis.score >= 80) {
    analysis.overallRating = 'excellent';
  } else if (analysis.score >= 60) {
    analysis.overallRating = 'good';
  } else if (analysis.score >= 40) {
    analysis.overallRating = 'fair';
  } else {
    analysis.overallRating = 'poor';
  }

  // Strategic Notes
  const pointDifference = Math.abs(player1points - player2points);
  const isWinning = (currentPlayer === 1 && player1points > player2points) || 
                    (currentPlayer === 2 && player2points > player1points);
  
  if (isWinning && pointDifference > 50) {
    analysis.strategicNotes.push('You have a strong lead. Consider defensive plays to maintain your advantage.');
  } else if (!isWinning && pointDifference > 50) {
    analysis.strategicNotes.push('You\'re behind. Look for high-scoring opportunities to catch up.');
  }

  if (moveNumber < 5) {
    analysis.strategicNotes.push('Early game: Focus on building a strong foundation and controlling the board.');
  } else if (moveNumber > 20) {
    analysis.strategicNotes.push('Late game: Maximize points and watch for endgame scenarios.');
  }

  // Additional tips based on weaknesses
  if (analysis.weaknesses.length > 0 && score < 20) {
    analysis.tips.push('Try to use premium squares (double/triple word/letter scores) for higher points.');
  }

  if (leaveValue < 0 && leave.length > 3) {
    analysis.tips.push('Consider playing more tiles to improve your leave value.');
  }

  // Comparison data
  if (bestMove) {
    analysis.comparison = {
      bestMove: bestMove.word,
      bestScore: bestMove.score,
      bestTotalValue: bestTotalValue,
      yourTotalValue: totalValue,
      difference: valueDifference
    };
  }

  return analysis;
};

/**
 * Get a color-coded rating badge
 */
export const getRatingColor = (rating) => {
  switch (rating) {
    case 'excellent':
      return '#10B981'; // Green
    case 'good':
      return '#3B82F6'; // Blue
    case 'fair':
      return '#F59E0B'; // Orange
    case 'poor':
      return '#EF4444'; // Red
    default:
      return '#6B7280'; // Gray
  }
};

/**
 * Get an emoji for the rating
 */
export const getRatingEmoji = (rating) => {
  switch (rating) {
    case 'excellent':
      return '🌟';
    case 'good':
      return '👍';
    case 'fair':
      return '🤔';
    case 'poor':
      return '💡';
    default:
      return '📊';
  }
};
