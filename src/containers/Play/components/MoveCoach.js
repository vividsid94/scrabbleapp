import React, { useState } from 'react';
import { 
  Brain, 
  Lightbulb, 
  TrendUp, 
  TrendDown, 
  X,
  CheckCircle,
  Warning,
  Info
} from '@phosphor-icons/react';
import { 
  Modal, 
  Box, 
  Typography, 
  Chip, 
  LinearProgress,
  Collapse,
  IconButton,
  Tooltip
} from '@mui/material';
import { analyzeMove, getRatingColor, getRatingEmoji } from '../../../functions/play/moveCoachAnalysis';
import styles from './MoveCoach.module.css';

const MoveCoach = ({ open, onClose, moveData, topMoves, gameState }) => {
  const [expandedSection, setExpandedSection] = useState('insights');

  if (!moveData) return null;

  const analysis = analyzeMove(moveData, topMoves, gameState);
  const ratingColor = getRatingColor(analysis.overallRating);
  const ratingEmoji = getRatingEmoji(analysis.overallRating);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="move-coach-modal"
      className={styles.modal}
    >
      <Box className={styles.modalContent}>
        {/* Header */}
        <Box className={styles.header}>
          <Box className={styles.headerLeft}>
            <Brain size={32} weight="fill" color={ratingColor} />
            <Box>
              <Typography variant="h5" className={styles.title}>
                Move Coach Analysis
              </Typography>
              <Typography variant="body2" className={styles.subtitle}>
                {moveData.word || 'Your Move'}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} className={styles.closeButton}>
            <X size={24} />
          </IconButton>
        </Box>

        {/* Overall Rating */}
        <Box className={styles.ratingSection}>
          <Box className={styles.ratingBadge} style={{ backgroundColor: `${ratingColor}15`, borderColor: ratingColor }}>
            <Typography variant="h2" className={styles.ratingEmoji}>
              {ratingEmoji}
            </Typography>
            <Box>
              <Typography variant="h4" className={styles.ratingText} style={{ color: ratingColor }}>
                {analysis.overallRating.toUpperCase()}
              </Typography>
              <Typography variant="body2" className={styles.ratingScore}>
                Score: {analysis.score}/100
              </Typography>
            </Box>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={analysis.score} 
            className={styles.progressBar}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: '#E5E7EB',
              '& .MuiLinearProgress-bar': {
                backgroundColor: ratingColor,
                borderRadius: 4,
              }
            }}
          />
        </Box>

        {/* Quick Stats */}
        <Box className={styles.statsGrid}>
          <Box className={styles.statCard}>
            <Typography variant="caption" className={styles.statLabel}>Move Score</Typography>
            <Typography variant="h6" className={styles.statValue}>
              {moveData.score || 0} pts
            </Typography>
          </Box>
          <Box className={styles.statCard}>
            <Typography variant="caption" className={styles.statLabel}>Leave Value</Typography>
            <Typography variant="h6" className={styles.statValue}>
              {moveData.leaveValue ? moveData.leaveValue.toFixed(1) : '0.0'}
            </Typography>
          </Box>
          <Box className={styles.statCard}>
            <Box className={styles.statCard}>
              <Typography variant="caption" className={styles.statLabel}>Board Control</Typography>
              <Typography variant="h6" className={styles.statValue}>
                {moveData.boardControl ? moveData.boardControl.toFixed(1) : '0.0'}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Insights Section */}
        <Box className={styles.section}>
          <Box 
            className={styles.sectionHeader}
            onClick={() => toggleSection('insights')}
          >
            <Box className={styles.sectionHeaderLeft}>
              <Lightbulb size={20} weight="fill" />
              <Typography variant="h6" className={styles.sectionTitle}>
                Insights
              </Typography>
            </Box>
            <IconButton size="small">
              {expandedSection === 'insights' ? <TrendUp size={20} /> : <TrendDown size={20} />}
            </IconButton>
          </Box>
          <Collapse in={expandedSection === 'insights'}>
            <Box className={styles.sectionContent}>
              {analysis.insights.map((insight, index) => (
                <Box key={index} className={styles.insightItem}>
                  <Info size={16} className={styles.insightIcon} />
                  <Typography variant="body2" className={styles.insightText}>
                    {insight}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Collapse>
        </Box>

        {/* Strengths & Weaknesses */}
        {(analysis.strengths.length > 0 || analysis.weaknesses.length > 0) && (
          <Box className={styles.section}>
            <Box 
              className={styles.sectionHeader}
              onClick={() => toggleSection('strengths')}
            >
              <Box className={styles.sectionHeaderLeft}>
                <CheckCircle size={20} weight="fill" />
                <Typography variant="h6" className={styles.sectionTitle}>
                  Strengths & Weaknesses
                </Typography>
              </Box>
              <IconButton size="small">
                {expandedSection === 'strengths' ? <TrendUp size={20} /> : <TrendDown size={20} />}
              </IconButton>
            </Box>
            <Collapse in={expandedSection === 'strengths'}>
              <Box className={styles.sectionContent}>
                {analysis.strengths.length > 0 && (
                  <Box className={styles.strengthWeaknessList}>
                    {analysis.strengths.map((strength, index) => (
                      <Chip
                        key={index}
                        label={strength}
                        size="small"
                        icon={<CheckCircle size={16} />}
                        className={styles.strengthChip}
                        sx={{
                          backgroundColor: '#10B98115',
                          color: '#10B981',
                          border: '1px solid #10B981',
                          marginRight: 1,
                          marginBottom: 1
                        }}
                      />
                    ))}
                  </Box>
                )}
                {analysis.weaknesses.length > 0 && (
                  <Box className={styles.strengthWeaknessList}>
                    {analysis.weaknesses.map((weakness, index) => (
                      <Chip
                        key={index}
                        label={weakness}
                        size="small"
                        icon={<Warning size={16} />}
                        className={styles.weaknessChip}
                        sx={{
                          backgroundColor: '#EF444415',
                          color: '#EF4444',
                          border: '1px solid #EF4444',
                          marginRight: 1,
                          marginBottom: 1
                        }}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            </Collapse>
          </Box>
        )}

        {/* Tips */}
        {analysis.tips.length > 0 && (
          <Box className={styles.section}>
            <Box 
              className={styles.sectionHeader}
              onClick={() => toggleSection('tips')}
            >
              <Box className={styles.sectionHeaderLeft}>
                <Lightbulb size={20} weight="fill" />
                <Typography variant="h6" className={styles.sectionTitle}>
                  Tips for Improvement
                </Typography>
              </Box>
              <IconButton size="small">
                {expandedSection === 'tips' ? <TrendUp size={20} /> : <TrendDown size={20} />}
              </IconButton>
            </Box>
            <Collapse in={expandedSection === 'tips'}>
              <Box className={styles.sectionContent}>
                {analysis.tips.map((tip, index) => (
                  <Box key={index} className={styles.tipItem}>
                    <Lightbulb size={16} className={styles.tipIcon} />
                    <Typography variant="body2" className={styles.tipText}>
                      {tip}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Collapse>
          </Box>
        )}

        {/* Strategic Notes */}
        {analysis.strategicNotes.length > 0 && (
          <Box className={styles.section}>
            <Box 
              className={styles.sectionHeader}
              onClick={() => toggleSection('strategy')}
            >
              <Box className={styles.sectionHeaderLeft}>
                <Brain size={20} weight="fill" />
                <Typography variant="h6" className={styles.sectionTitle}>
                  Strategic Notes
                </Typography>
              </Box>
              <IconButton size="small">
                {expandedSection === 'strategy' ? <TrendUp size={20} /> : <TrendDown size={20} />}
              </IconButton>
            </Box>
            <Collapse in={expandedSection === 'strategy'}>
              <Box className={styles.sectionContent}>
                {analysis.strategicNotes.map((note, index) => (
                  <Box key={index} className={styles.strategyItem}>
                    <Brain size={16} className={styles.strategyIcon} />
                    <Typography variant="body2" className={styles.strategyText}>
                      {note}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Collapse>
          </Box>
        )}

        {/* Comparison */}
        {analysis.comparison && (
          <Box className={styles.section}>
            <Box 
              className={styles.sectionHeader}
              onClick={() => toggleSection('comparison')}
            >
              <Box className={styles.sectionHeaderLeft}>
                <TrendUp size={20} weight="fill" />
                <Typography variant="h6" className={styles.sectionTitle}>
                  Comparison
                </Typography>
              </Box>
              <IconButton size="small">
                {expandedSection === 'comparison' ? <TrendUp size={20} /> : <TrendDown size={20} />}
              </IconButton>
            </Box>
            <Collapse in={expandedSection === 'comparison'}>
              <Box className={styles.sectionContent}>
                <Box className={styles.comparisonCard}>
                  <Typography variant="body2" className={styles.comparisonText}>
                    <strong>Best Move:</strong> {analysis.comparison.bestMove} ({analysis.comparison.bestScore} pts)
                  </Typography>
                  <Typography variant="body2" className={styles.comparisonText}>
                    <strong>Your Move:</strong> {moveData.word} ({moveData.score} pts)
                  </Typography>
                  {analysis.comparison.difference > 0 && (
                    <Typography variant="body2" className={styles.comparisonDifference}>
                      You could have scored {analysis.comparison.difference.toFixed(1)} more points
                    </Typography>
                  )}
                </Box>
              </Box>
            </Collapse>
          </Box>
        )}

        {/* Footer */}
        <Box className={styles.footer}>
          <Typography variant="caption" className={styles.footerText}>
            💡 Use this analysis to improve your game strategy!
          </Typography>
        </Box>
      </Box>
    </Modal>
  );
};

export default MoveCoach;
