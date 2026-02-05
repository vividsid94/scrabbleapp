import React, { useState, useEffect, useContext, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidenav from '../../components/AppContent/Sidenav/Sidenav';
import { ThemeContext } from '../../App';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import styles from './Tournaments.module.css';
import { getUpcomingTournaments, getRecentTournaments, getMilestones, getTopMovers } from '../../axios/crossTablesApi';
import { getThemeColors } from '../../utils/themeColors';
import { MagnifyingGlass, Calendar, Trophy } from '@phosphor-icons/react';
import TournamentCard from './TournamentCard';
import MilestonesPanel from './MilestonesPanel';
import MoversPanel from './MoversPanel';
import TournamentFilters from './TournamentFilters';

export default function Tournaments() {
  const { lightMode } = useContext(ThemeContext);
  const colors = getThemeColors(lightMode);
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(0); // 0 = upcoming, 1 = recent
  const [upcoming, setUpcoming] = useState([]);
  const [recent, setRecent] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [movers, setMovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');

  const searchTimer = useRef(null);

  // Load all data on mount
  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true);
        setError(null);
        const [upcomingData, recentData, milestonesData, moversData] = await Promise.all([
          getUpcomingTournaments(),
          getRecentTournaments(),
          getMilestones().catch(() => []),
          getTopMovers().catch(() => []),
        ]);
        setUpcoming(upcomingData);
        setRecent(recentData);
        setMilestones(milestonesData);
        setMovers(moversData);
      } catch (err) {
        setError('Failed to load tournaments. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  // Debounced search
  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      if (!value.trim()) return;
      try {
        setLoading(true);
        const [upRes, recRes] = await Promise.all([
          getUpcomingTournaments(value),
          getRecentTournaments(value),
        ]);
        setUpcoming(upRes);
        setRecent(recRes);
      } catch {
        // Keep existing data on search failure
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  // Reset when search cleared
  useEffect(() => {
    if (!searchTerm.trim()) {
      const reload = async () => {
        try {
          setLoading(true);
          const [upData, recData] = await Promise.all([
            getUpcomingTournaments(),
            getRecentTournaments(),
          ]);
          setUpcoming(upData);
          setRecent(recData);
        } catch {
          // Ignore
        } finally {
          setLoading(false);
        }
      };
      reload();
    }
  }, [searchTerm]);

  const rawList = activeTab === 0 ? upcoming : recent;

  // Sort
  const sortedList = useMemo(() => {
    const list = [...rawList];
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
  }, [rawList, sortField, sortDirection]);

  const handleSortChange = (field, dir) => {
    setSortField(field);
    setSortDirection(dir);
  };

  const handleCardClick = (t) => {
    if (t.tourneyid) {
      navigate(`/tournament/${t.tourneyid}`);
    } else if (t.upcomingid) {
      navigate(`/tournament/upcoming-${t.upcomingid}`);
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidenav />
      <Box className={styles.page} style={{ backgroundColor: colors.pageBg }}>
        {/* Header */}
        <Box className={styles.header} style={{
          backgroundColor: colors.headerBg,
          borderBottom: `1px solid ${colors.border}`,
        }}>
          <Box className={styles.headerContent}>
            <h1 className={styles.pageTitle} style={{ color: colors.textPrimary }}>
              Tournaments
            </h1>

            {/* Search */}
            <div className={styles.searchRow}>
              <div className={styles.searchBox} style={{
                backgroundColor: colors.inputBg,
                borderColor: colors.borderLight,
              }}>
                <MagnifyingGlass size={18} style={{ color: colors.textSecondary, flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Search tournaments..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className={styles.searchInput}
                  style={{ color: colors.textPrimary }}
                />
              </div>
            </div>

            {/* Tabs + Sort */}
            <div className={styles.controlsRow}>
              <div className={styles.tabs}>
                <button
                  className={`${styles.tab} ${activeTab === 0 ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab(0)}
                  style={{
                    backgroundColor: activeTab === 0 ? colors.tabActive : colors.tabInactive,
                    color: activeTab === 0 ? colors.tabActiveText : colors.tabText,
                    borderColor: activeTab === 0 ? 'transparent' : colors.border,
                  }}
                >
                  <Calendar size={16} style={{ marginRight: 6 }} />
                  Upcoming
                </button>
                <button
                  className={`${styles.tab} ${activeTab === 1 ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab(1)}
                  style={{
                    backgroundColor: activeTab === 1 ? colors.tabActive : colors.tabInactive,
                    color: activeTab === 1 ? colors.tabActiveText : colors.tabText,
                    borderColor: activeTab === 1 ? 'transparent' : colors.border,
                  }}
                >
                  <Trophy size={16} style={{ marginRight: 6 }} />
                  Recent
                </button>
              </div>
              <TournamentFilters
                sortField={sortField}
                sortDirection={sortDirection}
                onSortChange={handleSortChange}
                colors={colors}
              />
            </div>
          </Box>
        </Box>

        {/* Content */}
        <Box className={styles.content}>
          {/* Milestones & Movers banners */}
          <MilestonesPanel milestones={milestones} colors={colors} />
          <MoversPanel movers={movers} colors={colors} />

          {error && (
            <div className={styles.error} style={{
              backgroundColor: colors.errorBg,
              color: colors.errorText,
            }}>
              {error}
            </div>
          )}

          {loading ? (
            <div className={styles.loadingContainer}>
              <CircularProgress size={32} />
            </div>
          ) : sortedList.length === 0 ? (
            <div className={styles.emptyState} style={{ color: colors.textSecondary }}>
              <Trophy size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
              <p>No tournaments found</p>
            </div>
          ) : (
            <div className={styles.tournamentsGrid}>
              {sortedList.map((t, i) => (
                <TournamentCard
                  key={t.tourneyid || t.upcomingid || i}
                  tournament={t}
                  isUpcoming={activeTab === 0}
                  colors={colors}
                  onClick={() => handleCardClick(t)}
                />
              ))}
            </div>
          )}
        </Box>
      </Box>
    </Box>
  );
}
