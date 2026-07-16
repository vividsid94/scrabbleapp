import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GameController, Cube } from '@phosphor-icons/react';
import styles from './Home.module.css';

// Theo is already mid double-thumbs-up in the art - a chunky post dropped
// under each fist reads as "he's holding these up." His lower body fades to
// transparent behind the wide signs instead of just cutting off.
export default function ModeSignChoice() {
  const navigate = useNavigate();

  return (
    <div className={styles.signChoiceContainer}>
      <div className={styles.signTheoWrap}>
        <img
          src="/images/theomascot3.png"
          alt="Theo the fox holding up two signs"
          className={styles.signTheoImage}
          draggable={false}
        />
        <span className={`${styles.signPost} ${styles.signPostLeft}`} aria-hidden="true" />
        <span className={`${styles.signPost} ${styles.signPostRight}`} aria-hidden="true" />
        <span className={`${styles.signBracket} ${styles.signBracketLeft}`} aria-hidden="true" />
        <span className={`${styles.signBracket} ${styles.signBracketRight}`} aria-hidden="true" />
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
