import React, { useState, useEffect, useContext, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Sidenav from '../../components/AppContent/Sidenav/Sidenav';
import { ThemeContext } from '../../App';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import styles from './Tournaments.module.css';
import {
  getUpcomingTournaments,
  getRecentTournaments,
  getMilestones,
  getTopMovers,
  getTopPlayers,
  searchPlayers,
} from '../../axios/crossTablesApi';
import { getThemeColors } from '../../utils/themeColors';
import {
  MagnifyingGlass, Calendar, Trophy, Users, ChartLineUp, User, ArrowClockwise,
} from '@phosphor-icons/react';
import TournamentCard from './TournamentCard';
import TournamentListItem from './TournamentListItem';
import MilestonesPanel from './MilestonesPanel';
import MoversPanel from './MoversPanel';
import TournamentFilters from './TournamentFilters';
import RankingsTable from '../Players/RankingsTable';
import RankingsPodium from '../Players/RankingsPodium';
import PlayerCard from '../Players/PlayerCard';
import PlayerFilters from '../Players/PlayerFilters';

const BRAND = '#D97706';
const BRAND_DARK = '#B45309';

export default function Tournaments() {
  const { lightMode } = useContext(ThemeContext);
  const colors = getThemeColors(lightMode);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialSection = searchParams.get('view') === 'players' ? 'players' : 'tournaments';
  const [section, setSection] = useState(initialSection);

  const [tourneyTab, setTourneyTab] = useState(0);
  const [upcoming, setUpcoming] = useState([]);
  const [recent, setRecent] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [movers, setMovers] = useState([]);
  const [tourneyLoading, setTourneyLoading] = useState(true);
  const [tourneyError, setTourneyError] = useState(null);
  const [tourneySearch, setTourneySearch] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const tourneyTimer = useRef(null);

  const [playerTab, setPlayerTab] = useState('twl');
  const [twlPlayers, setTwlPlayers] = useState([]);
  const [cswPlayers, setCswPlayers] = useState([]);
  const [playerSearchResults, setPlayerSearchResults] = useState([]);
  const [playerSearch, setPlayerSearch] = useState('');
  const [playerLoading, setPlayerLoading] = useState(false);
  const [playerSearchLoading, setPlayerSearchLoading] = useState(false);
  const [playerError, setPlayerError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const playerTimer = useRef(null);
  const [playersLoaded, setPlayersLoaded] = useState(false);

  const cssVars = {
    '--text-primary': colors.textPrimary,
    '--text-secondary': colors.textSecondary,
    '--text-muted': colors.textMuted,
    '--border': colors.border,
    '--border-light': colors.borderLight,
    '--card-bg': colors.cardBg,
    '--badge-bg': colors.badgeBg,
    '--brand': BRAND,
    '--brand-dark': BRAND_DARK,
    '--brand-bg': lightMode === 'dark' ? 'rgba(217, 119, 6, 0.18)' : 'rgba(217, 119, 6, 0.12)',
    '--brand-ring': lightMode === 'dark' ? 'rgba(217, 119, 6, 0.25)' : 'rgba(217, 119, 6, 0.15)',
    '--brand-shadow': 'rgba(217, 119, 6, 0.3)',
    '--hero-glow': lightMode === 'dark' ? 'rgba(217, 119, 6, 0.15)' : 'rgba(217, 119, 6, 0.12)',
    '--hero-glow-2': lightMode === 'dark' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.08)',
    '--switcher-bg': lightMode === 'dark' ? 'rgba(55, 65, 81, 0.6)' : 'rgba(107, 114, 128, 0.1)',
    '--empty-bg': lightMode === 'dark' ? 'rgba(31, 41, 55, 0.5)' : 'rgba(249, 250, 251, 0.9)',
    '--nav-bg': lightMode === 'dark' ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
  };

  const switchSection = useCallback((next) => {
    setSection(next);
    setSearchParams(next === 'players' ? { view: 'players' } : {}, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setSearchParams]);

  useEffect(() => {
    const loadTourneys = async () => {
      try {
        setTourneyLoading(true);
        setTourneyError(null);
        const [upData, recData, mData, movData] = await Promise.all([
          getUpcomingTournaments(),
          getRecentTournaments(),
          getMilestones().catch(() => []),
          getTopMovers().catch(() => []),
        ]);
        setUpcoming(upData);
        setRecent(recData);
        setMilestones(mData);
        setMovers(movData);
      } catch {
        setTourneyError('Failed to load tournaments. Please try again.');
      } finally {
        setTourneyLoading(false);
      }
    };
    loadTourneys();
  }, []);

  const loadPlayerRankings = useCallback(async () => {
    try {
      setPlayerLoading(true);
      setPlayerError(null);
      const [twl, csw] = await Promise.all([
        getTopPlayers({ lexicon: 'twl', limit: 200 }),
        getTopPlayers({ lexicon: 'csw', limit: 200 }),
      ]);
      if (twl.length === 0 && csw.length === 0) {
        setPlayerError('Could not load player rankings. Check your connection and try again.');
      }
      setTwlPlayers(twl);
      setCswPlayers(csw);
      setPlayersLoaded(true);
    } catch {
      setPlayerError('Failed to load player rankings. Please try again.');
    } finally {
      setPlayerLoading(false);
    }
  }, []);

  useEffect(() => {
    if (section !== 'players' || playersLoaded) return;
    loadPlayerRankings();
  }, [section, playersLoaded, loadPlayerRankings]);

  const handleTourneySearch = useCallback((value) => {
    setTourneySearch(value);
    if (tourneyTimer.current) clearTimeout(tourneyTimer.current);
    if (!value.trim()) return;
    tourneyTimer.current = setTimeout(async () => {
      try {
        setTourneyLoading(true);
        const [upRes, recRes] = await Promise.all([
          getUpcomingTournaments(value),
          getRecentTournaments(value),
        ]);
        setUpcoming(upRes);
        setRecent(recRes);
      } catch { /* keep existing */ }
      finally { setTourneyLoading(false); }
    }, 300);
  }, []);

  useEffect(() => {
    if (tourneySearch.trim()) return;
    const reload = async () => {
      try {
        setTourneyLoading(true);
        const [u, r] = await Promise.all([getUpcomingTournaments(), getRecentTournaments()]);
        setUpcoming(u);
        setRecent(r);
      } catch { /* ignore */ }
      finally { setTourneyLoading(false); }
    };
    reload();
  }, [tourneySearch]);

  const handlePlayerSearch = useCallback((value) => {
    setPlayerSearch(value);
    if (playerTimer.current) clearTimeout(playerTimer.current);
    if (!value.trim()) {
      setPlayerSearchResults([]);
      if (playerTab === 'search') setPlayerTab('twl');
      return;
    }
    playerTimer.current = setTimeout(async () => {
      try {
        setPlayerSearchLoading(true);
        setPlayerTab('search');
        const results = await searchPlayers(value);
        setPlayerSearchResults(results);
      } catch { setPlayerSearchResults([]); }
      finally { setPlayerSearchLoading(false); }
    }, 300);
  }, [playerTab]);

  const rawTourneyList = tourneyTab === 0 ? upcoming : recent;
  const sortedTourneys = useMemo(() => {
    const list = [...rawTourneyList];
    list.sort((a, b) => {
      let va, vb;
      if (sortField === 'date') {
        va = new Date(a.date || a.startdate || 0).getTime();
        vb = new Date(b.date || b.startdate || 0).getTime();
      } else if (sortField === 'name') {
        va = (a.name || a.tourneyname || a.mastername || '').toLowerCase();
        vb = (b.name || b.tourneyname || b.mastername || '').toLowerCase();
      } else if (sortField === 'entrants') {
        va = Number(a.entrants || a.numplayers || 0);
        vb = Number(b.entrants || b.numplayers || 0);
      }
      if (va < vb) return sortDirection === 'asc' ? -1 : 1;
      if (va > vb) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [rawTourneyList, sortField, sortDirection]);

  const playerLocations = useMemo(() => {
    const src = playerTab === 'twl' ? twlPlayers : playerTab === 'csw' ? cswPlayers : playerSearchResults;
    const s = new Set();
    for (const p of src) {
      const loc = p.state || p.location;
      if (loc && typeof loc === 'string' && loc.trim()) s.add(loc.trim());
    }
    return [...s].sort();
  }, [playerTab, twlPlayers, cswPlayers, playerSearchResults]);

  const filteredPlayers = useMemo(() => {
    const src = playerTab === 'twl' ? twlPlayers : playerTab === 'csw' ? cswPlayers : playerSearchResults;
    if (!selectedLocation) return src;
    return src.filter(p => (p.state || p.location || '').trim().toLowerCase() === selectedLocation.toLowerCase());
  }, [playerTab, twlPlayers, cswPlayers, playerSearchResults, selectedLocation]);

  const rankField = playerTab === 'csw' ? 'cswrank' : 'twlrank';
  const podiumPlayers = filteredPlayers;
  const listPlayers = useMemo(() => {
    if (playerTab === 'search') return filteredPlayers;
    return [...filteredPlayers]
      .sort((a, b) => (Number(a[rankField] || a.rank) || 9999) - (Number(b[rankField] || b.rank) || 9999))
      .slice(3);
  }, [filteredPlayers, playerTab, rankField]);

  const playerTabs = [
    { key: 'twl', label: 'TWL', icon: Trophy },
    { key: 'csw', label: 'CSW', icon: ChartLineUp },
  ];
  if (playerTab === 'search' || playerSearch.trim()) {
    playerTabs.push({ key: 'search', label: 'Search', icon: MagnifyingGlass });
  }

  const handleCardClick = (t) => {
    if (t.tourneyid) navigate(`/tournament/${t.tourneyid}`);
    else if (t.upcomingid) navigate(`/tournament/upcoming-${t.upcomingid}`);
  };

  const desktopSectionStyle = (active) => ({
    color: active ? '#fff' : colors.textSecondary,
    backgroundColor: active ? BRAND : 'transparent',
  });

  const renderTournamentContent = () => {
    if (tourneyLoading) {
      return (
        <div className={styles.loadingContainer}>
          <CircularProgress size={32} sx={{ color: BRAND }} />
          <span className={styles.loadingText}>Loading tournaments...</span>
        </div>
      );
    }
    if (sortedTourneys.length === 0) {
      return (
        <div className={styles.emptyState}>
          <Trophy size={48} color={colors.textMuted} />
          <p>No tournaments found</p>
        </div>
      );
    }
    return (
      <>
        <div className={styles.tournamentsGrid}>
          {sortedTourneys.map((t, i) => (
            <TournamentCard
              key={t.tourneyid || t.upcomingid || i}
              tournament={t}
              isUpcoming={tourneyTab === 0}
              colors={colors}
              onClick={() => handleCardClick(t)}
            />
          ))}
        </div>
        <div className={styles.tournamentList}>
          {sortedTourneys.map((t, i) => (
            <TournamentListItem
              key={t.tourneyid || t.upcomingid || `m-${i}`}
              tournament={t}
              isUpcoming={tourneyTab === 0}
              colors={colors}
              onClick={() => handleCardClick(t)}
            />
          ))}
        </div>
      </>
    );
  };

  const renderPlayerContent = () => {
    if (playerLoading) {
      return (
        <div className={styles.loadingContainer}>
          <CircularProgress size={32} sx={{ color: BRAND }} />
          <span className={styles.loadingText}>Loading rankings...</span>
        </div>
      );
    }
    if (playerTab === 'search') {
      if (playerSearchLoading) {
        return (
          <div className={styles.loadingContainer}>
            <CircularProgress size={32} sx={{ color: BRAND }} />
            <span className={styles.loadingText}>Searching...</span>
          </div>
        );
      }
      if (filteredPlayers.length === 0) {
        return (
          <div className={styles.emptyState}>
            <User size={48} color={colors.textMuted} />
            <p>{playerSearch.trim() ? 'No players found' : 'Type a name to search'}</p>
          </div>
        );
      }
      return (
        <div className={styles.playerGrid}>
          {filteredPlayers.map((p, i) => (
            <PlayerCard key={p.playerid || i} player={p} colors={colors} />
          ))}
        </div>
      );
    }
    if (filteredPlayers.length === 0 && !playerError) {
      return (
        <div className={styles.emptyState}>
          <Users size={48} color={colors.textMuted} />
          <p>No rankings available</p>
          <button type="button" className={styles.retryBtn} onClick={() => { setPlayersLoaded(false); loadPlayerRankings(); }}>
            <ArrowClockwise size={16} style={{ verticalAlign: -3, marginRight: 6 }} />
            Reload
          </button>
        </div>
      );
    }
    return (
      <div className={styles.rankingsSection}>
        {filteredPlayers.length >= 3 && (
          <RankingsPodium players={podiumPlayers} lexicon={playerTab} colors={colors} />
        )}
        {listPlayers.length > 0 && (
          <>
            <div className={styles.rankingsBar}>
              <p className={styles.sectionLabel} style={{ margin: 0 }}>Full rankings</p>
              <span className={styles.rankingsInfo}>
                {filteredPlayers.length} total
                {selectedLocation && ` · ${selectedLocation}`}
              </span>
            </div>
            <RankingsTable
              players={listPlayers}
              lexicon={playerTab}
              colors={colors}
              pageSize={25}
              startRank={4}
            />
          </>
        )}
        {filteredPlayers.length > 0 && filteredPlayers.length < 3 && (
          <div className={styles.playerGrid}>
            {filteredPlayers.map((p, i) => (
              <PlayerCard
                key={p.playerid || i}
                player={p}
                rank={Number(p[rankField] || p.rank) || i + 1}
                colors={colors}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Box sx={{ display: 'flex', width: '100%', maxWidth: '100%', minWidth: 0, overflow: 'hidden' }}>
      <Sidenav />
      <Box
        component="main"
        className={styles.page}
        style={{ backgroundColor: colors.pageBg, ...cssVars }}
      >
        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.heroIcon}>
              <Trophy size={26} weight="fill" />
            </div>
            <h1 className={styles.pageTitle}>Results & Rankings</h1>
            <p className={styles.pageSubtitle}>
              {section === 'tournaments'
                ? 'Upcoming events, recent results, and rating highlights from cross-tables.com'
                : 'Official TWL & CSW player ratings and search'}
            </p>

            {section === 'tournaments' && !tourneyLoading && (
              <div className={styles.statRow}>
                <span className={styles.statChip}>
                  <Calendar size={15} weight="fill" style={{ color: colors.accentGreen }} />
                  {upcoming.length} upcoming
                </span>
                <span className={styles.statChip}>
                  <Trophy size={15} weight="fill" style={{ color: colors.accentBlue }} />
                  {recent.length} recent
                </span>
              </div>
            )}
            {section === 'players' && playersLoaded && (
              <div className={styles.statRow}>
                <span className={styles.statChip}>
                  <Users size={15} weight="fill" style={{ color: BRAND }} />
                  {twlPlayers.length} TWL rated
                </span>
                <span className={styles.statChip}>
                  <ChartLineUp size={15} weight="fill" style={{ color: colors.accentBlue }} />
                  {cswPlayers.length} CSW rated
                </span>
              </div>
            )}

            {/* Desktop section switcher */}
            <div className={styles.desktopSectionNav}>
              <button
                type="button"
                className={`${styles.desktopSectionBtn} ${section === 'tournaments' ? styles.desktopSectionBtnActive : ''}`}
                style={desktopSectionStyle(section === 'tournaments')}
                onClick={() => switchSection('tournaments')}
              >
                <Trophy size={17} weight={section === 'tournaments' ? 'fill' : 'regular'} />
                Tournaments
              </button>
              <button
                type="button"
                className={`${styles.desktopSectionBtn} ${section === 'players' ? styles.desktopSectionBtnActive : ''}`}
                style={desktopSectionStyle(section === 'players')}
                onClick={() => switchSection('players')}
              >
                <Users size={17} weight={section === 'players' ? 'fill' : 'regular'} />
                Players
              </button>
            </div>
          </div>
        </section>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <MagnifyingGlass size={20} style={{ color: colors.textMuted, flexShrink: 0 }} />
            <input
              type="search"
              enterKeyHint="search"
              placeholder={section === 'tournaments' ? 'Search tournaments...' : 'Search players by name...'}
              value={section === 'tournaments' ? tourneySearch : playerSearch}
              onChange={(e) => (
                section === 'tournaments'
                  ? handleTourneySearch(e.target.value)
                  : handlePlayerSearch(e.target.value)
              )}
              className={styles.searchInput}
            />
            {section === 'players' && playerSearchLoading && (
              <CircularProgress size={18} sx={{ color: BRAND, flexShrink: 0 }} />
            )}
          </div>

          {section === 'tournaments' ? (
            <div className={`${styles.segmentRow} ${styles.segmentRow2}`}>
              <button
                type="button"
                className={`${styles.segmentBtn} ${tourneyTab === 0 ? styles.segmentBtnActive : ''}`}
                onClick={() => setTourneyTab(0)}
              >
                <Calendar size={16} weight={tourneyTab === 0 ? 'fill' : 'regular'} />
                Upcoming
                {!tourneyLoading && (
                  <span className={styles.segmentCount}>{upcoming.length}</span>
                )}
              </button>
              <button
                type="button"
                className={`${styles.segmentBtn} ${tourneyTab === 1 ? styles.segmentBtnActive : ''}`}
                onClick={() => setTourneyTab(1)}
              >
                <Trophy size={16} weight={tourneyTab === 1 ? 'fill' : 'regular'} />
                Recent
                {!tourneyLoading && (
                  <span className={styles.segmentCount}>{recent.length}</span>
                )}
              </button>
            </div>
          ) : (
            <div className={`${styles.segmentRow} ${playerTabs.length === 3 ? styles.segmentRow3 : styles.segmentRow2}`}>
              {playerTabs.map(t => (
                <button
                  key={t.key}
                  type="button"
                  className={`${styles.segmentBtn} ${playerTab === t.key ? styles.segmentBtnActive : ''}`}
                  onClick={() => {
                    if (t.key !== 'search') {
                      setPlayerTab(t.key);
                      setSelectedLocation(null);
                    } else {
                      setPlayerTab('search');
                    }
                  }}
                >
                  <t.icon size={16} weight={playerTab === t.key ? 'fill' : 'regular'} />
                  {t.label}
                </button>
              ))}
            </div>
          )}

          <div className={styles.filtersRow}>
            {section === 'tournaments' && (
              <TournamentFilters
                sortField={sortField}
                sortDirection={sortDirection}
                onSortChange={(f, d) => { setSortField(f); setSortDirection(d); }}
                colors={colors}
              />
            )}
            {section === 'players' && playerTab !== 'search' && (
              <PlayerFilters
                locations={playerLocations}
                selectedLocation={selectedLocation}
                onLocationChange={setSelectedLocation}
                colors={colors}
              />
            )}
          </div>
        </div>

        {/* Content */}
        <main className={styles.content}>
          {tourneyError && section === 'tournaments' && (
            <div className={styles.error} style={{ backgroundColor: colors.errorBg, color: colors.errorText }}>
              {tourneyError}
            </div>
          )}

          {playerError && section === 'players' && (
            <div className={styles.error} style={{ backgroundColor: colors.errorBg, color: colors.errorText }}>
              {playerError}
              <button type="button" className={styles.retryBtn} onClick={() => { setPlayersLoaded(false); loadPlayerRankings(); }}>
                Retry
              </button>
            </div>
          )}

          {section === 'tournaments' && (
            <>
              <MilestonesPanel milestones={milestones} colors={colors} />
              <MoversPanel movers={movers} colors={colors} />
              <p className={styles.sectionLabel}>
                {tourneyTab === 0 ? 'Upcoming tournaments' : 'Recent tournaments'}
              </p>
              {renderTournamentContent()}
            </>
          )}

          {section === 'players' && renderPlayerContent()}
        </main>

        {/* Mobile bottom nav */}
        <nav className={styles.bottomNav} aria-label="Section navigation">
          <div className={styles.bottomNavInner}>
            <button
              type="button"
              className={`${styles.bottomNavBtn} ${section === 'tournaments' ? styles.bottomNavBtnActive : ''}`}
              onClick={() => switchSection('tournaments')}
            >
              <Trophy size={22} weight={section === 'tournaments' ? 'fill' : 'regular'} />
              Tournaments
            </button>
            <button
              type="button"
              className={`${styles.bottomNavBtn} ${section === 'players' ? styles.bottomNavBtnActive : ''}`}
              onClick={() => switchSection('players')}
            >
              <Users size={22} weight={section === 'players' ? 'fill' : 'regular'} />
              Players
            </button>
          </div>
        </nav>
      </Box>
    </Box>
  );
}
