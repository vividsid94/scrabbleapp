import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameController, Cube } from '@phosphor-icons/react';
import AnimatedMascot from '../../components/AppContent/AnimatedMascot';
import { ThemeContext } from '../../App';
import styles from './Home.module.css';

// Index into AnimatedMascot's theo pose array (theomascot.png, 2, 3, 4) that
// shows him actually holding up the two signs - only theomascot3.png (index
// 2) has his fists positioned for it. The post/bracket props are pure decor
// for that one pose, so they need to disappear for the rest of the
// "photoshoot" rather than float there while he does something else.
const HOLDING_POSE_INDEX = 2;

// Theo is already mid double-thumbs-up in the holding pose - a chunky post
// dropped under each fist reads as "he's holding these up." His lower body
// fades to transparent behind the wide signs instead of just cutting off.
export default function ModeSignChoice() {
  const navigate = useNavigate();
  const { lightMode } = useContext(ThemeContext);
  const [poseIndex, setPoseIndex] = useState(HOLDING_POSE_INDEX);
  const isHoldingPose = poseIndex === HOLDING_POSE_INDEX;

  return (
    <div className={styles.signChoiceContainer}>
      <div className={styles.signTheoWrap}>
        <div className={`${styles.signTheoImage} ${lightMode === 'dark' ? '' : styles.signTheoImageLight}`}>
          <AnimatedMascot
            about="theo"
            enableStencilMode={false}
            initialPoseIndex={HOLDING_POSE_INDEX}
            onPoseIndexChange={setPoseIndex}
          />
        </div>
        {isHoldingPose && (
          <>
            <span className={`${styles.signPost} ${styles.signPostLeft}`} aria-hidden="true" />
            <span className={`${styles.signPost} ${styles.signPostRight}`} aria-hidden="true" />
            <span className={`${styles.signBracket} ${styles.signBracketLeft}`} aria-hidden="true" />
            <span className={`${styles.signBracket} ${styles.signBracketRight}`} aria-hidden="true" />
          </>
        )}
        <div className={styles.signRow}>
          <button
            type="button"
            className={`${styles.signButton} ${styles.signButtonLeft}`}
            onClick={() => navigate('/play')}
          >
            <GameController size={18} weight="fill" />
            <span>Classic</span>
          </button>
          <button
            type="button"
            className={`${styles.signButton} ${styles.signButtonRight}`}
            onClick={() => navigate('/3dplay')}
          >
            <Cube size={18} weight="fill" />
            <span>3D Play</span>
          </button>
        </div>
      </div>
    </div>
  );
}
