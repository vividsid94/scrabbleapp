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
            <div className={styles.profileImgWrapper}>
              <img
                src="/images/me.jpg"
                alt="Sid Murali"
                className={styles.sidImg}
              />
            </div>
            <div className={styles.profileNameWrapper}>
              <h2 className={styles.name}>Sid Murali</h2>
            </div>
            <div className={styles.profileBioWrapper}>
              <p className={styles.bio}>Creator, developer, and Scrabble enthusiast. Building Tile Turnover™ to make word games more fun for everyone!</p>
            </div>
            <div className={styles.profileButtonWrapper}></div>
          </div>
        </div>
        <div className={styles.rightCol}>
          <div className={styles.profileBox}>
            <div className={styles.profileImgWrapper}>
              <img
                src="/images/theomascot.png"
                alt="Theo Townsend Mascot"
                className={styles.mascotImg}
              />
            </div>
            <div className={styles.profileNameWrapper}>
              <h2 className={styles.name}>Theo Townsend</h2>
            </div>
            <div className={styles.profileBioWrapper}>
              <p className={styles.bio}>Your friendly Scrabble fox! Here to help you outfox the board and have a blast with every tile. Ask me for tips or just enjoy my winning smile!</p>
            </div>
            <div className={styles.profileButtonWrapper}>
              <a href="/mascot-stencil" style={{
                display: 'inline-block',
                marginTop: '0',
                padding: '8px 18px',
                background: '#f59e0b',
                color: '#fff',
                borderRadius: '6px',
                fontWeight: 'bold',
                textDecoration: 'none',
                boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                fontSize: '1em',
                letterSpacing: '1px',
                transition: 'background 0.2s',
              }}>View Mascot Stencil</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 