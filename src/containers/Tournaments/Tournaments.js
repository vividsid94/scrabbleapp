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
import { MagnifyingGlass, Calendar, Trophy, Users, ChartLineUp, User } from '@phosphor-icons/react';
import TournamentCard from './TournamentCard';
import MilestonesPanel from './MilestonesPanel';
import MoversPanel from './MoversPanel';
import TournamentFilters from './TournamentFilters';
import RankingsTable from '../Players/RankingsTable';
import PlayerCard from '../Players/PlayerCard';
import PlayerFilters from '../Players/PlayerFilters';

export default function Tournaments() {
  const { lightMode } = useContext(ThemeContext);
  const colors = getThemeColors(lightMode);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Top-level section: 'tournaments' or 'players'
  const initialSection = searchParams.get('view') === 'players' ? 'players' : 'tournaments';
  const [section, setSection] = useState(initialSection);

  // ─── Tournament state ───
  const [tourneyTab, setTourneyTab] = useState(0); // 0=upcoming, 1=recent
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

  // ─── Player state ───
  const [playerTab, setPlayerTab] = useState('twl'); // 'twl'|'csw'|'search'
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

  // Load tournament data on mount
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

  // Lazy-load player rankings when switching to Players section
  useEffect(() => {
    if (section !== 'players' || playersLoaded) return;
    const loadPlayers = async () => {
      try {
        setPlayerLoading(true);
        setPlayerError(null);
        const [twl, csw] = await Promise.all([
          getTopPlayers({ lexicon: 'twl', limit: 200 }),
          getTopPlayers({ lexicon: 'csw', limit: 200 }),
        ]);
        setTwlPlayers(twl);
        setCswPlayers(csw);
        setPlayersLoaded(true);
      } catch {
        setPlayerError('Failed to load player rankings. Please try again.');
      } finally {
        setPlayerLoading(false);
      }
    };
    loadPlayers();
  }, [section, playersLoaded]);

  // ─── Tournament search (debounced) ───
  const handleTourneySearch = useCallback((value) => {
    setTourneySearch(value);
    if (tourneyTimer.current) clearTimeout(tourneyTimer.current);
    if (!value.trim()) return; // reset handled below
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

  // Reset tournaments when search cleared
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

  // ─── Player search (debounced) ───
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

  // ─── Sorted tournament list ───
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

  // ─── Player location filter ───
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

  // ─── Player sub-tabs ───
  const playerTabs = [
    { key: 'twl', label: 'TWL Rankings', icon: Trophy },
    { key: 'csw', label: 'CSW Rankings', icon: ChartLineUp },
  ];
  if (playerTab === 'search' || playerSearch.trim()) {
    playerTabs.push({ key: 'search', label: 'Search Results', icon: MagnifyingGlass });
  }

  const handleCardClick = (t) => {
    if (t.tourneyid) navigate(`/tournament/${t.tourneyid}`);
    else if (t.upcomingid) navigate(`/tournament/upcoming-${t.upcomingid}`);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidenav />
      <Box className={styles.page} style={{ backgroundColor: colors.pageBg }}>
        {/* ── Header ── */}
        <div className={styles.header} style={{
          backgroundColor: colors.headerBg,
          borderBottom: `1px solid ${colors.border}`,
        }}>
          <div className={styles.headerContent}>
            {/* Section switcher */}
            <div className={styles.sectionSwitcher}>
              <button
                className={`${styles.sectionBtn} ${section === 'tournaments' ? styles.sectionBtnActive : ''}`}
                onClick={() => setSection('tournaments')}
                style={{
                  color: section === 'tournaments' ? colors.tabActiveText : colors.textSecondary,
                  backgroundColor: section === 'tournaments' ? colors.tabActive : 'transparent',
                  borderColor: section === 'tournaments' ? 'transparent' : colors.border,
                }}
              >
                <Trophy size={17} style={{ marginRight: 7 }} />
                Tournaments
              </button>
              <button
                className={`${styles.sectionBtn} ${section === 'players' ? styles.sectionBtnActive : ''}`}
                onClick={() => setSection('players')}
                style={{
                  color: section === 'players' ? colors.tabActiveText : colors.textSecondary,
                  backgroundColor: section === 'players' ? colors.tabActive : 'transparent',
                  borderColor: section === 'players' ? 'transparent' : colors.border,
                }}
              >
                <Users size={17} style={{ marginRight: 7 }} />
                Players
              </button>
            </div>

            {/* ── Tournaments sub-header ── */}
            {section === 'tournaments' && (
              <>
                <div className={styles.searchRow}>
                  <div className={styles.searchBox} style={{ backgroundColor: colors.inputBg, borderColor: colors.borderLight }}>
                    <MagnifyingGlass size={18} style={{ color: colors.textSecondary, flexShrink: 0 }} />
                    <input
                      type="text"
                      placeholder="Search tournaments..."
                      value={tourneySearch}
                      onChange={(e) => handleTourneySearch(e.target.value)}
                      className={styles.searchInput}
                      style={{ color: colors.textPrimary }}
                    />
                  </div>
                </div>
                <div className={styles.controlsRow}>
                  <div className={styles.tabs}>
                    <button
                      className={`${styles.tab} ${tourneyTab === 0 ? styles.tabActive : ''}`}
                      onClick={() => setTourneyTab(0)}
                      style={{
                        backgroundColor: tourneyTab === 0 ? colors.tabActive : colors.tabInactive,
                        color: tourneyTab === 0 ? colors.tabActiveText : colors.tabText,
                        borderColor: tourneyTab === 0 ? 'transparent' : colors.border,
                      }}
                    >
                      <Calendar size={16} style={{ marginRight: 6 }} />
                      Upcoming
                    </button>
                    <button
                      className={`${styles.tab} ${tourneyTab === 1 ? styles.tabActive : ''}`}
                      onClick={() => setTourneyTab(1)}
                      style={{
                        backgroundColor: tourneyTab === 1 ? colors.tabActive : colors.tabInactive,
                        color: tourneyTab === 1 ? colors.tabActiveText : colors.tabText,
                        borderColor: tourneyTab === 1 ? 'transparent' : colors.border,
                      }}
                    >
                      <Trophy size={16} style={{ marginRight: 6 }} />
                      Recent
                    </button>
                  </div>
                  <TournamentFilters
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSortChange={(f, d) => { setSortField(f); setSortDirection(d); }}
                    colors={colors}
                  />
                </div>
              </>
            )}

            {/* ── Players sub-header ── */}
            {section === 'players' && (
              <>
                <div className={styles.searchRow}>
                  <div className={styles.searchBox} style={{ backgroundColor: colors.inputBg, borderColor: colors.borderLight }}>
                    <MagnifyingGlass size={18} style={{ color: colors.textSecondary, flexShrink: 0 }} />
                    <input
                      type="text"
                      placeholder="Search players by name..."
                      value={playerSearch}
                      onChange={(e) => handlePlayerSearch(e.target.value)}
                      className={styles.searchInput}
                      style={{ color: colors.textPrimary }}
                    />
                    {playerSearchLoading && <CircularProgress size={16} style={{ flexShrink: 0 }} />}
                  </div>
                </div>
                <div className={styles.controlsRow}>
                  <div className={styles.tabs}>
                    {playerTabs.map(t => (
                      <button
                        key={t.key}
                        className={`${styles.tab} ${playerTab === t.key ? styles.tabActive : ''}`}
                        onClick={() => { if (t.key !== 'search') { setPlayerTab(t.key); setSelectedLocation(null); } else { setPlayerTab('search'); } }}
                        style={{
                          backgroundColor: playerTab === t.key ? colors.tabActive : colors.tabInactive,
                          color: playerTab === t.key ? colors.tabActiveText : colors.tabText,
                          borderColor: playerTab === t.key ? 'transparent' : colors.border,
                        }}
                      >
                        <t.icon size={16} style={{ marginRight: 6 }} />
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <PlayerFilters
                    locations={playerLocations}
                    selectedLocation={selectedLocation}
                    onLocationChange={setSelectedLocation}
                    colors={colors}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Content ── */}
        <div className={styles.content}>
          {/* ── TOURNAMENTS CONTENT ── */}
          {section === 'tournaments' && (
            <>
              <MilestonesPanel milestones={milestones} colors={colors} />
              <MoversPanel movers={movers} colors={colors} />

              {tourneyError && (
                <div className={styles.error} style={{ backgroundColor: colors.errorBg, color: colors.errorText }}>
                  {tourneyError}
                </div>
              )}

              {tourneyLoading ? (
                <div className={styles.loadingContainer}><CircularProgress size={32} /></div>
              ) : sortedTourneys.length === 0 ? (
                <div className={styles.emptyState} style={{ color: colors.textSecondary }}>
                  <Trophy size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
                  <p>No tournaments found</p>
                </div>
              ) : (
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
              )}
            </>
          )}

          {/* ── PLAYERS CONTENT ── */}
          {section === 'players' && (
            <>
              {playerError && (
                <div className={styles.error} style={{ backgroundColor: colors.errorBg, color: colors.errorText }}>
                  {playerError}
                </div>
              )}

              {playerLoading ? (
                <div className={styles.loadingContainer}><CircularProgress size={32} /></div>
              ) : playerTab === 'search' ? (
                playerSearchLoading ? (
                  <div className={styles.loadingContainer}><CircularProgress size={32} /></div>
                ) : filteredPlayers.length === 0 ? (
                  <div className={styles.emptyState} style={{ color: colors.textSecondary }}>
                    <User size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
                    <p>{playerSearch.trim() ? 'No players found' : 'Type a name to search for players'}</p>
                  </div>
                ) : (
                  <div className={styles.playerGrid}>
                    {filteredPlayers.map((p, i) => (
                      <PlayerCard key={p.playerid || i} player={p} colors={colors} />
                    ))}
                  </div>
                )
              ) : (
                <>
                  <div className={styles.rankingsInfo} style={{ color: colors.textSecondary }}>
                    {filteredPlayers.length} player{filteredPlayers.length !== 1 ? 's' : ''}
                    {selectedLocation && ` in ${selectedLocation}`}
                  </div>
                  <RankingsTable
                    players={filteredPlayers}
                    lexicon={playerTab}
                    colors={colors}
                    pageSize={25}
                  />
                </>
              )}
            </>
          )}
        </div>
      </Box>
    </Box>
  );
}
