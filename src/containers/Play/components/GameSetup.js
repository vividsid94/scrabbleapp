import React, { useState, useEffect, useContext } from 'react';
import { Slider, Select, MenuItem, FormControl, Switch, Collapse } from '@mui/material';
import { CaretDown, CaretUp, Robot, Smiley, UserCircle } from '@phosphor-icons/react';
import { ThemeContext } from '../../../App';
import { useGameStore } from '../../../stores/gameStore';
import { origPool } from '../../../components/AppContent/References/staticData.js';
import AnimatedMascot from '../../../components/AppContent/AnimatedMascot';
import styles from './GameSetup.module.css';

const PRIMARY_BOTS = [
  { name: 'Theo', desc: 'Clever and quick, Theo prefers bold, aggressive moves.' },
  { name: 'Tess', desc: 'Calm and strategic, Tess loves defense. Outfox her if you can!' },
  { name: 'Tope', desc: 'LLM trained using annotated game commentary! Tope is around 1800 level.' },
];

const MORE_BOTS = [
  { name: 'Novice', desc: 'Makes random moves.', icon: <Smiley size={18} color="#60A5FA" /> },
  { name: 'Beginner', desc: 'Plays simple, easy-to-beat moves.', icon: <UserCircle size={18} color="#8B7355" /> },
  { name: 'Intermediate', desc: 'A bit more challenging, but still beatable.', icon: <Robot size={18} color="#3D5A80" /> },
];

// This is only ever shown as a 20px recap badge (after a bot's already been
// chosen) - it used to load the full mascot PNG (1.6-3.7MB each) just to
// show a 20px thumbnail. A plain icon costs nothing and looks identical at
// this size.
const mascotIcon = (name) => {
  const color = { Theo: '#4CAF50', Tess: '#2563EB', Tope: '#F59E0B' }[name] || '#9CA3AF';
  return <Robot size={20} weight="fill" color={color} />;
};

// Helper functions to build/parse letter-count pools for the Variable Pool editor
const generatePoolFromDistribution = (distribution) => {
  let pool = '';
  for (const [letter, count] of Object.entries(distribution)) {
    pool += letter.repeat(count);
  }
  return pool;
};

const generatePoolFromPreset = (preset) => {
  switch (preset) {
    case 'vowel-heavy':
      return generatePoolFromDistribution({ A: 12, B: 2, C: 2, D: 4, E: 16, F: 2, G: 3, H: 2, I: 12, J: 1, K: 1, L: 4, M: 2, N: 6, O: 12, P: 2, Q: 1, R: 6, S: 4, T: 6, U: 6, V: 2, W: 2, X: 1, Y: 2, Z: 1, '?': 2 });
    case 'consonant-heavy':
      return generatePoolFromDistribution({ A: 6, B: 4, C: 4, D: 6, E: 8, F: 4, G: 5, H: 4, I: 6, J: 2, K: 2, L: 6, M: 4, N: 8, O: 6, P: 4, Q: 2, R: 8, S: 6, T: 8, U: 2, V: 4, W: 4, X: 2, Y: 4, Z: 2, '?': 2 });
    case 'advanced':
      return 'ADVANCED:' + generatePoolFromDistribution({ A: 9, B: 2, C: 2, D: 4, E: 12, F: 2, G: 3, H: 2, I: 9, J: 1, K: 1, L: 4, M: 2, N: 6, O: 8, P: 2, Q: 1, R: 6, S: 4, T: 6, U: 4, V: 2, W: 2, X: 1, Y: 2, Z: 1, '?': 2 });
    default:
      return null; // 'standard' — use origPool
  }
};

const parsePoolToDistribution = (pool) => {
  const distribution = {};
  for (const letter of pool) {
    distribution[letter] = (distribution[letter] || 0) + 1;
  }
  return distribution;
};

// Inline +/- stepper editor for the four bonus square types
const BonusSquareEditor = ({ distribution, onDistributionChange }) => {
  const updateCount = (type, newCount) => {
    onDistributionChange({ ...distribution, [type]: Math.max(0, Math.min(newCount, 225)) });
  };
  const types = [
    { key: 'TWS', color: '#dc2626' },
    { key: 'DWS', color: '#ec4899' },
    { key: 'TLS', color: '#1e40af' },
    { key: 'DLS', color: '#3b82f6' },
  ];
  return (
    <div className={styles.editorGrid}>
      {types.map(type => (
        <div key={type.key} className={styles.editorRow}>
          <span className={styles.editorRowLabel}>{type.key}</span>
          <button type="button" className={styles.editorStepBtn} onClick={() => updateCount(type.key, (distribution[type.key] || 0) - 1)}>−</button>
          <span className={styles.editorCount}>{distribution[type.key] || 0}</span>
          <button type="button" className={styles.editorStepBtn} onClick={() => updateCount(type.key, (distribution[type.key] || 0) + 1)}>+</button>
          <span className={styles.editorSwatch} style={{ background: type.color }} />
        </div>
      ))}
    </div>
  );
};

// Inline +/- stepper editor for the 27-letter pool distribution
const VariablePoolEditor = ({ currentPool, onPoolChange }) => {
  const getPoolString = () => {
    if (!currentPool) return origPool;
    if (currentPool.startsWith('ADVANCED:')) return currentPool.substring(9);
    return currentPool;
  };
  const [distribution, setDistribution] = useState(() => parsePoolToDistribution(getPoolString()));

  useEffect(() => {
    setDistribution(parsePoolToDistribution(getPoolString()));
  }, [currentPool]);

  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '?'];

  const updateCount = (letter, newCount) => {
    const updated = { ...distribution };
    if (newCount <= 0) delete updated[letter];
    else updated[letter] = Math.min(newCount, 20);
    setDistribution(updated);
    onPoolChange('ADVANCED:' + generatePoolFromDistribution(updated));
  };

  return (
    <div className={styles.editorLetterGrid}>
      {letters.map(letter => (
        <div key={letter} className={styles.editorLetterCell}>
          <span className={styles.editorLetterLabel}>{letter === '?' ? 'BL' : letter}</span>
          <div className={styles.editorRow}>
            <button type="button" className={styles.editorStepBtn} onClick={() => updateCount(letter, (distribution[letter] || 0) - 1)}>−</button>
            <span className={styles.editorCount}>{distribution[letter] || 0}</span>
            <button type="button" className={styles.editorStepBtn} onClick={() => updateCount(letter, (distribution[letter] || 0) + 1)}>+</button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default function GameSetup({ onSelectBot, onStartGame }) {
  const { lightMode } = useContext(ThemeContext);
  const {
    selectedBot,
    isDictionaryLoading,
    gameTime,
    setGameTime,
    randomizeBonusSquares,
    setRandomizeBonusSquares,
    customBonusSquareDistribution,
    setCustomBonusSquareDistribution,
    twoTurnsPerPlayer,
    setTwoTurnsPerPlayer,
    variablePool,
    setVariablePool,
    customPool,
    setCustomPool,
    theoYellEnabled,
    setTheoYellEnabled,
    theoYellCriteria,
    setTheoYellCriteria,
    theoYellScoreThreshold,
    setTheoYellScoreThreshold,
  } = useGameStore();

  const [step, setStep] = useState('opponent');
  const [moreOpponentsOpen, setMoreOpponentsOpen] = useState(false);
  const [customRank, setCustomRank] = useState('');
  const [defenseWeight, setDefenseWeight] = useState(1.0);
  const [selectedDictionary, setSelectedDictionary] = useState('NWL');
  const [poolPreset, setPoolPreset] = useState('standard');
  const [bonusSquarePreset, setBonusSquarePreset] = useState('default');
  const [showVariants, setShowVariants] = useState(false);
  const [theoYellSettingsExpanded, setTheoYellSettingsExpanded] = useState(false);

  // Keep the preset dropdown in sync with the underlying distribution/pool,
  // including when it's cleared elsewhere (e.g. the toggle above is switched off).
  useEffect(() => {
    if (!randomizeBonusSquares || !customBonusSquareDistribution) {
      setBonusSquarePreset('default');
      return;
    }
    const dist = customBonusSquareDistribution;
    if (dist.TWS === 12 && dist.DWS === 20 && dist.TLS === 8 && dist.DLS === 20) setBonusSquarePreset('word-heavy');
    else if (dist.TWS === 4 && dist.DWS === 8 && dist.TLS === 20 && dist.DLS === 28) setBonusSquarePreset('letter-heavy');
    else if (dist.TWS === 20 && dist.DWS === 0 && dist.TLS === 0 && dist.DLS === 0) setBonusSquarePreset('extreme');
    else setBonusSquarePreset('advanced');
  }, [randomizeBonusSquares, customBonusSquareDistribution]);

  useEffect(() => {
    if (!variablePool || !customPool) {
      setPoolPreset('standard');
    } else if (customPool.startsWith('ADVANCED:')) {
      setPoolPreset('advanced');
    }
  }, [variablePool, customPool]);

  const disabled = isDictionaryLoading;
  const isCustomRankValid = /^\d+$/.test(customRank) && parseInt(customRank) > 0;

  const chooseBot = (bot) => {
    onSelectBot(bot);
    setStep('settings');
  };

  const chooseCustomBot = () => {
    if (!isCustomRankValid) return;
    chooseBot({ name: 'Custom', desc: `Plays the ${customRank}th best move by points + leave.`, customRank: parseInt(customRank) });
  };

  const chooseDefenseBot = () => {
    chooseBot({ name: 'Defense Bot', desc: `Uses defense analysis with ${defenseWeight.toFixed(1)}x defense weight.`, defenseWeight });
  };

  return (
    <div className={styles.setup} data-theme={lightMode}>
      {step === 'opponent' ? (
        <div className={styles.panel} key="opponent">
          <div className={styles.header}>
            <h2 className={styles.heading}>Choose your opponent</h2>
          </div>

          <div className={styles.primaryGrid}>
            {PRIMARY_BOTS.map(bot => (
              <button
                key={bot.name}
                type="button"
                className={styles.botCard}
                disabled={disabled}
                onClick={() => chooseBot(bot)}
              >
                <div className={styles.botCardArt}>
                  <AnimatedMascot about={bot.name.toLowerCase()} />
                </div>
                <div className={styles.botCardName}>{bot.name}</div>
                <div className={styles.botCardDesc}>{bot.desc}</div>
              </button>
            ))}
          </div>

          <button
            type="button"
            className={styles.moreToggle}
            onClick={() => setMoreOpponentsOpen(v => !v)}
          >
            More opponents
            {moreOpponentsOpen ? <CaretUp size={14} weight="bold" /> : <CaretDown size={14} weight="bold" />}
          </button>

          <Collapse in={moreOpponentsOpen}>
            <div className={styles.moreList}>
              {MORE_BOTS.map(bot => (
                <div
                  key={bot.name}
                  className={`${styles.botRow} ${selectedBot?.name === bot.name ? styles.botRowSelected : ''}`}
                  onClick={() => !disabled && chooseBot(bot)}
                >
                  <span className={styles.botRowIcon}>{bot.icon}</span>
                  <div className={styles.botRowBody}>
                    <div className={styles.botRowName}>{bot.name}</div>
                    <div className={styles.botRowDesc}>{bot.desc}</div>
                  </div>
                  <button
                    type="button"
                    className={`${styles.choosePill} ${selectedBot?.name === bot.name ? '' : styles.choosePillInactive}`}
                    onClick={(e) => { e.stopPropagation(); if (!disabled) chooseBot(bot); }}
                  >
                    {selectedBot?.name === bot.name ? 'Selected' : 'Choose'}
                  </button>
                </div>
              ))}

              {/* Custom bot row */}
              <div
                className={`${styles.botRow} ${selectedBot?.name === 'Custom' ? styles.botRowSelected : ''}`}
                onClick={() => !disabled && chooseCustomBot()}
              >
                <span className={styles.botRowIcon}><Robot size={18} color="#9CA3AF" /></span>
                <div className={styles.botRowBody}>
                  <div className={styles.botRowName}>Custom</div>
                  <div className={styles.botRowDesc}>
                    Play{' '}
                    <input
                      type="text"
                      value={customRank}
                      placeholder="X"
                      className={styles.botRowInput}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => { if (/^\d*$/.test(e.target.value)) setCustomRank(e.target.value); }}
                    />
                    th by points + leave
                  </div>
                </div>
                <button
                  type="button"
                  className={`${styles.choosePill} ${selectedBot?.name === 'Custom' ? '' : styles.choosePillInactive}`}
                  disabled={!isCustomRankValid}
                  onClick={(e) => { e.stopPropagation(); chooseCustomBot(); }}
                >
                  {selectedBot?.name === 'Custom' ? 'Selected' : 'Choose'}
                </button>
              </div>

              {/* Defense bot row */}
              <div
                className={`${styles.botRow} ${selectedBot?.name === 'Defense Bot' ? styles.botRowSelected : ''}`}
                onClick={() => !disabled && chooseDefenseBot()}
              >
                <span className={styles.botRowIcon}><Robot size={18} color="#9CA3AF" /></span>
                <div className={styles.botRowBody}>
                  <div className={styles.botRowName}>Custom Defense — {defenseWeight.toFixed(1)}x</div>
                  <Slider
                    value={defenseWeight}
                    onChange={(e, value) => setDefenseWeight(value)}
                    onClick={(e) => e.stopPropagation()}
                    min={0.0}
                    max={5.0}
                    step={0.1}
                    size="small"
                    sx={{ color: 'var(--blue)', width: '90%' }}
                  />
                </div>
                <button
                  type="button"
                  className={`${styles.choosePill} ${selectedBot?.name === 'Defense Bot' ? '' : styles.choosePillInactive}`}
                  onClick={(e) => { e.stopPropagation(); chooseDefenseBot(); }}
                >
                  {selectedBot?.name === 'Defense Bot' ? 'Selected' : 'Choose'}
                </button>
              </div>
            </div>
          </Collapse>

          <button
            type="button"
            className={styles.multiplayerCard}
            disabled={disabled}
            onClick={() => { window.location.href = '/multiplayer'; }}
          >
            <span className={styles.multiplayerIcon}>👥</span>
            <div className={styles.multiplayerBody}>
              <div className={styles.multiplayerTitle}>Multiplayer (Beta)</div>
              <div className={styles.multiplayerDesc}>Play with friends in real-time</div>
              <div className={styles.multiplayerTag}>No sign-up required</div>
            </div>
          </button>
        </div>
      ) : (
        <div className={styles.panel} key="settings">
          <div className={styles.settingsCard}>
            <div className={styles.opponentRecap}>
              <span className={styles.opponentRecapIcon}>{mascotIcon(selectedBot?.name)}</span>
              <span className={styles.opponentRecapName}>{selectedBot?.name}</span>
              <button type="button" className={styles.changeLink} onClick={() => setStep('opponent')}>
                Change opponent
              </button>
            </div>

            {/* Time */}
            <div>
              <div className={styles.sectionLabel}>Time</div>
              <div className={styles.timeValue}>{gameTime} {gameTime === 1 ? 'minute' : 'minutes'}</div>
              <Slider
                value={gameTime}
                onChange={(e, value) => setGameTime(value)}
                min={1}
                max={30}
                step={1}
                sx={{ color: 'var(--amber)' }}
              />
              <div className={styles.presetRow}>
                {[5, 10, 15, 30].map(time => (
                  <button
                    key={time}
                    type="button"
                    className={`${styles.presetPill} ${gameTime === time ? styles.presetPillActive : ''}`}
                    onClick={() => setGameTime(time)}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            {/* Dictionary */}
            <div>
              <div className={styles.sectionLabel}>Dictionary</div>
              <FormControl fullWidth size="small">
                <Select value={selectedDictionary} onChange={(e) => setSelectedDictionary(e.target.value)}>
                  <MenuItem value="NWL">NWL</MenuItem>
                </Select>
              </FormControl>
            </div>

            {/* Variants */}
            <div>
              <div className={styles.disclosureHeader} onClick={() => setShowVariants(v => !v)}>
                <div>
                  <div className={styles.disclosureTitle}>Variants (optional)</div>
                  {!showVariants && (randomizeBonusSquares || twoTurnsPerPlayer || variablePool) && (
                    <div className={styles.disclosureHint}>Custom settings enabled</div>
                  )}
                </div>
                {showVariants ? <CaretUp size={16} weight="bold" /> : <CaretDown size={16} weight="bold" />}
              </div>

              <Collapse in={showVariants}>
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div className={styles.toggleRow}>
                    <span className={styles.toggleLabel}>Randomize bonus squares</span>
                    <Switch checked={randomizeBonusSquares} onChange={(e) => setRandomizeBonusSquares(e.target.checked)} size="small" />
                  </div>
                  <Collapse in={randomizeBonusSquares}>
                    <div className={styles.subPanel}>
                      <div className={styles.sectionLabel}>Distribution</div>
                      <Select
                        value={bonusSquarePreset}
                        size="small"
                        fullWidth
                        onChange={(e) => {
                          const preset = e.target.value;
                          setBonusSquarePreset(preset);
                          if (preset === 'default') setCustomBonusSquareDistribution(null);
                          else if (preset === 'word-heavy') setCustomBonusSquareDistribution({ TWS: 12, DWS: 20, TLS: 8, DLS: 20 });
                          else if (preset === 'letter-heavy') setCustomBonusSquareDistribution({ TWS: 4, DWS: 8, TLS: 20, DLS: 28 });
                          else if (preset === 'extreme') setCustomBonusSquareDistribution({ TWS: 20, DWS: 0, TLS: 0, DLS: 0 });
                          else if (preset === 'advanced') setCustomBonusSquareDistribution({ TWS: 8, DWS: 16, TLS: 12, DLS: 24 });
                        }}
                        sx={{ marginBottom: 1 }}
                      >
                        <MenuItem value="default">Default (8 TWS, 16 DWS, 12 TLS, 24 DLS)</MenuItem>
                        <MenuItem value="word-heavy">Word-Heavy</MenuItem>
                        <MenuItem value="letter-heavy">Letter-Heavy</MenuItem>
                        <MenuItem value="extreme">Extreme (All TWS)</MenuItem>
                        <MenuItem value="advanced">Advanced (Custom)</MenuItem>
                      </Select>
                      {bonusSquarePreset === 'advanced' && (
                        <BonusSquareEditor distribution={customBonusSquareDistribution || {}} onDistributionChange={setCustomBonusSquareDistribution} />
                      )}
                    </div>
                  </Collapse>

                  <div className={styles.toggleRow}>
                    <span className={styles.toggleLabel}>2 turns per player</span>
                    <Switch checked={twoTurnsPerPlayer} onChange={(e) => setTwoTurnsPerPlayer(e.target.checked)} size="small" />
                  </div>

                  <div className={styles.toggleRow}>
                    <span className={styles.toggleLabel}>Variable pool</span>
                    <Switch checked={variablePool} onChange={(e) => setVariablePool(e.target.checked)} size="small" />
                  </div>
                  <Collapse in={variablePool}>
                    <div className={styles.subPanel}>
                      <div className={styles.sectionLabel}>Preset</div>
                      <Select
                        value={poolPreset}
                        size="small"
                        fullWidth
                        onChange={(e) => {
                          const preset = e.target.value;
                          setPoolPreset(preset);
                          if (preset === 'standard') setCustomPool(null);
                          else if (preset === 'advanced') setCustomPool('ADVANCED:' + origPool);
                          else setCustomPool(generatePoolFromPreset(preset));
                        }}
                        sx={{ marginBottom: 1 }}
                      >
                        <MenuItem value="standard">Standard</MenuItem>
                        <MenuItem value="vowel-heavy">Vowel-Heavy</MenuItem>
                        <MenuItem value="consonant-heavy">Consonant-Heavy</MenuItem>
                        <MenuItem value="advanced">Advanced (Custom)</MenuItem>
                      </Select>
                      {poolPreset === 'advanced' && (
                        <VariablePoolEditor currentPool={customPool} onPoolChange={setCustomPool} />
                      )}
                    </div>
                  </Collapse>
                </div>
              </Collapse>
            </div>

            {/* Analysis mode */}
            <div>
              <div className={styles.sectionLabel}>Analysis Mode</div>
              <div className={styles.toggleRow}>
                <span className={styles.toggleLabel}>
                  <Robot size={16} weight="fill" color="#4CAF50" />
                  Have Theo Yell at You
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {theoYellEnabled && (
                    <button type="button" className={styles.changeLink} onClick={() => setTheoYellSettingsExpanded(v => !v)}>
                      {theoYellSettingsExpanded ? 'Hide' : 'Settings'}
                    </button>
                  )}
                  <Switch
                    checked={theoYellEnabled}
                    onChange={(e) => setTheoYellEnabled(e.target.checked)}
                    size="small"
                  />
                </div>
              </div>
              <Collapse in={theoYellEnabled && theoYellSettingsExpanded}>
                <div className={styles.subPanel}>
                  <div className={styles.sectionLabel}>Trigger When</div>
                  <div
                    className={`${styles.radioRow} ${theoYellCriteria === 'bingo' ? styles.radioRowActive : ''}`}
                    onClick={() => setTheoYellCriteria('bingo')}
                  >
                    <span className={`${styles.radioDot} ${theoYellCriteria === 'bingo' ? styles.radioDotActive : ''}`} />
                    <span className={styles.radioLabel}>When I miss a bingo</span>
                  </div>
                  <div
                    className={`${styles.radioRow} ${theoYellCriteria === 'score' ? styles.radioRowActive : ''}`}
                    onClick={() => setTheoYellCriteria('score')}
                  >
                    <span className={`${styles.radioDot} ${theoYellCriteria === 'score' ? styles.radioDotActive : ''}`} />
                    <span className={styles.radioLabel}>Move scores under</span>
                    {theoYellCriteria === 'score' && (
                      <>
                        <input
                          type="number"
                          className={styles.thresholdInput}
                          value={theoYellScoreThreshold}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => setTheoYellScoreThreshold(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                        />
                        <span className={styles.radioLabel} style={{ flex: 'none' }}>points</span>
                      </>
                    )}
                  </div>
                </div>
              </Collapse>
              {/* Move Coach toggle removed — non-functional; wire back up when the feature ships */}
            </div>

            <div className={styles.footer}>
              <button type="button" className={`${styles.footerButton} ${styles.footerButtonSecondary}`} onClick={() => setStep('opponent')}>
                Back
              </button>
              <button type="button" className={`${styles.footerButton} ${styles.footerButtonPrimary}`} onClick={onStartGame}>
                Start Game
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
