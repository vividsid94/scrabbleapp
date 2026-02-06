import React, { useState, useEffect, useContext, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidenav from '../../components/AppContent/Sidenav/Sidenav';
import { ThemeContext } from '../../App';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import styles from './Players.module.css';
import { getTopPlayers, searchPlayers } from '../../axios/crossTablesApi';
import { getThemeColors } from '../../utils/themeColors';
import { MagnifyingGlass, Trophy, ChartLineUp, User } from '@phosphor-icons/react';
import RankingsTable from './RankingsTable';
import PlayerCard from './PlayerCard';
import PlayerFilters from './PlayerFilters';

export default function Players() {
  const { lightMode } = useContext(ThemeContext);
  const colors = getThemeColors(lightMode);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('twl'); // 'twl' | 'csw' | 'search'
  const [twlPlayers, setTwlPlayers] = useState([]);
  const [cswPlayers, setCswPlayers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const searchTimer = useRef(null);

  // Load rankings on mount
  useEffect(() => {
    const loadRankings = async () => {
      try {
        setLoading(true);
        setError(null);
        const [twlData, cswData] = await Promise.all([
          getTopPlayers({ lexicon: 'twl', limit: 200 }),
          getTopPlayers({ lexicon: 'csw', limit: 200 }),
        ]);
        setTwlPlayers(twlData);
        setCswPlayers(cswData);
      } catch (err) {
        setError('Failed to load player rankings. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    loadRankings();
  }, []);

  // Debounced search
  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);

    if (!value.trim()) {
      setSearchResults([]);
      // Return to previous tab if search is cleared
      if (activeTab === 'search') setActiveTab('twl');
      return;
    }

    searchTimer.current = setTimeout(async () => {
      try {
        setSearchLoading(true);
        setActiveTab('search');
        const results = await searchPlayers(value);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  }, [activeTab]);

  // Extract unique locations from current dataset
  const locations = useMemo(() => {
    const players = activeTab === 'twl' ? twlPlayers
      : activeTab === 'csw' ? cswPlayers
      : searchResults;

    const locSet = new Set();
    for (const p of players) {
      const loc = p.state || p.location;
      if (loc && typeof loc === 'string' && loc.trim()) {
        locSet.add(loc.trim());
      }
    }
    return [...locSet].sort();
  }, [activeTab, twlPlayers, cswPlayers, searchResults]);

  // Filtered data
  const filteredData = useMemo(() => {
    const players = activeTab === 'twl' ? twlPlayers
      : activeTab === 'csw' ? cswPlayers
      : searchResults;

    if (!selectedLocation) return players;

    return players.filter(p => {
      const loc = p.state || p.location || '';
      return loc.trim().toLowerCase() === selectedLocation.toLowerCase();
    });
  }, [activeTab, twlPlayers, cswPlayers, searchResults, selectedLocation]);

  const tabs = [
    { key: 'twl', label: 'TWL Rankings', icon: Trophy },
    { key: 'csw', label: 'CSW Rankings', icon: ChartLineUp },
  ];

  // If there's active search, add a search tab
  if (activeTab === 'search' || searchTerm.trim()) {
    tabs.push({ key: 'search', label: `Search Results`, icon: MagnifyingGlass });
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidenav />
      <Box className={styles.page} style={{ backgroundColor: colors.pageBg }}>
        {/* Header */}
        <div className={styles.header} style={{
          backgroundColor: colors.headerBg,
          borderBottom: `1px solid ${colors.border}`,
        }}>
          <div className={styles.headerContent}>
            <h1 className={styles.pageTitle} style={{ color: colors.textPrimary }}>
              Players
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
                  placeholder="Search players by name..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className={styles.searchInput}
                  style={{ color: colors.textPrimary }}
                />
                {searchLoading && (
                  <CircularProgress size={16} style={{ flexShrink: 0 }} />
                )}
              </div>
            </div>

            {/* Tabs + Filters */}
            <div className={styles.controlsRow}>
              <div className={styles.tabs}>
                {tabs.map(t => (
                  <button
                    key={t.key}
                    className={`${styles.tab} ${activeTab === t.key ? styles.tabActive : ''}`}
                    onClick={() => {
                      if (t.key !== 'search') {
                        setActiveTab(t.key);
                        setSelectedLocation(null);
                      } else {
                        setActiveTab('search');
                      }
                    }}
                    style={{
                      backgroundColor: activeTab === t.key ? colors.tabActive : colors.tabInactive,
                      color: activeTab === t.key ? colors.tabActiveText : colors.tabText,
                      borderColor: activeTab === t.key ? 'transparent' : colors.border,
                    }}
                  >
                    <t.icon size={16} style={{ marginRight: 6 }} />
                    {t.label}
                  </button>
                ))}
              </div>
              <PlayerFilters
                locations={locations}
                selectedLocation={selectedLocation}
                onLocationChange={setSelectedLocation}
                colors={colors}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className={styles.content}>
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
          ) : activeTab === 'search' ? (
            /* Search Results: card grid */
            searchLoading ? (
              <div className={styles.loadingContainer}>
                <CircularProgress size={32} />
              </div>
            ) : filteredData.length === 0 ? (
              <div className={styles.emptyState} style={{ color: colors.textSecondary }}>
                <User size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
                <p>{searchTerm.trim() ? 'No players found' : 'Type a name to search for players'}</p>
              </div>
            ) : (
              <div className={styles.playerGrid}>
                {filteredData.map((player, i) => (
                  <PlayerCard
                    key={player.playerid || i}
                    player={player}
                    colors={colors}
                  />
                ))}
              </div>
            )
          ) : (
            /* Rankings Table */
            <>
              <div className={styles.rankingsInfo} style={{ color: colors.textSecondary }}>
                {filteredData.length} player{filteredData.length !== 1 ? 's' : ''}
                {selectedLocation && ` in ${selectedLocation}`}
              </div>
              <RankingsTable
                players={filteredData}
                lexicon={activeTab}
                colors={colors}
                pageSize={25}
              />
            </>
          )}
        </div>
      </Box>
    </Box>
  );
}
