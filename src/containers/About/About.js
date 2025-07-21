import React from "react";
import styles from "./About.module.css";
import Sidenav from "../../components/AppContent/Sidenav/Sidenav";
// import Footer from "../../components/AppContent/Footer/Footer";

export default function About() {
  return (
    <div className={styles.aboutPageWrapper}>
      <Sidenav />
      <div className={styles.aboutPage}>
        <div className={styles.leftCol}>
          <div className={styles.profileBox}>
            <img
              src="/images/me.jpg"
              alt="Sid Murali"
              className={styles.sidImg}
            />
            <h2 className={styles.name}>Sid Murali</h2>
            <p className={styles.bio}>Creator, developer, and Scrabble enthusiast. Building Tile Turnover™ to make word games more fun for everyone!</p>
          </div>
        </div>
        <div className={styles.rightCol}>
          <div className={styles.profileBox}>
            <img
              src="/images/theomascot.png"
              alt="Theo Townsend Mascot"
              className={styles.mascotImg}
            />
            <h2 className={styles.name}>Theo Townsend</h2>
            <p className={styles.bio}>Your friendly Scrabble fox! Here to help you outfox the board and have a blast with every tile. Ask me for tips or just enjoy my winning smile!</p>
          </div>
        </div>
      </div>
    </div>
  );
} 