import React from 'react';
import styles from '../Snakes.module.css';

export default function ComingSoonMode() {
  return (
    <div className={styles.card} style={{ alignItems: 'center', textAlign: 'center' }}>
      <div className={styles.transitionTitle}>Mode 2</div>
      <div className={styles.subheading} style={{ marginTop: 0 }}>Coming soon.</div>
    </div>
  );
}
