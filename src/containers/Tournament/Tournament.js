import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidenav from '../../components/AppContent/Sidenav/Sidenav';
import { ThemeContext } from '../../App';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import styles from './Tournament.module.css';
import {
  getTournament,
  getResults,
  getUpcomingTournamentDetail,
  getTournamentEntrants,
} from '../../axios/crossTablesApi';
import { getThemeColors } from '../../utils/themeColors';
import { ArrowLeft, Trophy, Users } from '@phosphor-icons/react';
import TournamentHeader from './TournamentHeader';
import DivisionTabs from './DivisionTabs';
import ResultsTable from './ResultsTable';
import EntrantsList from './EntrantsList';

export default function Tournament() {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const { lightMode } = useContext(ThemeContext);
  const colors = getThemeColors(lightMode);

  const [tournament, setTournament] = useState(null);
  const [results, setResults] = useState([]);
  const [entrants, setEntrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUpcoming, setIsUpcoming] = useState(false);
  const [activeDivision, setActiveDivision] = useState(null);

  useEffect(() => {
    loadTournamentData();
  }, [tournamentId]);

  const loadTournamentData = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsUpcoming(false);

      // Check if this is an upcoming tournament (prefixed with "upcoming-")
      const isUpcomingId = String(tournamentId).startsWith('upcoming-');

      if (isUpcomingId) {
        const upId = parseInt(String(tournamentId).replace('upcoming-', ''));
        setIsUpcoming(true);
        const detailData = await getUpcomingTournamentDetail(upId);
        // Build a tournament-like object from detail data
        const firstComponent = detailData[0] || {};
        setTournament({
          name: firstComponent.name || firstComponent.tourneyname || 'Upcoming Tournament',
          date: firstComponent.date || firstComponent.startdate,
          location: firstComponent.location,
          ...firstComponent,
        });
        // Load entrants for each component
        const allEntrants = [];
        for (const comp of detailData) {
          if (comp.upcomingcomponentid) {
            try {
              const ents = await getTournamentEntrants(comp.upcomingcomponentid);
              allEntrants.push(...ents);
            } catch { /* skip */ }
          }
        }
        setEntrants(allEntrants);
      } else {
        // Completed tournament
        const id = parseInt(tournamentId);
        const [tournamentData, resultsData] = await Promise.all([
          getTournament(id, true),
          getResults({ tourney: id }).catch(() => []),
        ]);

        setTournament(tournamentData);
        // Prefer results from tournament data, fallback to separate call
        const finalResults = tournamentData.results || resultsData;
        setResults(Array.isArray(finalResults) ? finalResults : []);
      }
    } catch (err) {
      setError('Failed to load tournament data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Extract divisions
  const divisions = useMemo(() => {
    if (results.length === 0) return [];
    const divSet = [...new Set(results.map(r => r.division).filter(Boolean))];
    return divSet.sort();
  }, [results]);

  // Filter by division
  const filteredResults = useMemo(() => {
    if (!activeDivision) return results;
    return results.filter(r => r.division === activeDivision);
  }, [results, activeDivision]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex' }}>
        <Sidenav />
        <Box className={styles.page} style={{ backgroundColor: colors.pageBg, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (error || !tournament) {
    return (
      <Box sx={{ display: 'flex' }}>
        <Sidenav />
        <Box className={styles.page} style={{ backgroundColor: colors.pageBg, padding: 24 }}>
          <div style={{
            padding: 16,
            borderRadius: 8,
            backgroundColor: colors.errorBg,
            color: colors.errorText,
            marginBottom: 16,
          }}>
            {error || 'Tournament not found'}
          </div>
          <button
            onClick={() => navigate('/tournaments')}
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              backgroundColor: colors.cardBg,
              color: colors.textPrimary,
              border: `1px solid ${colors.border}`,
              borderRadius: 6,
              fontFamily: 'inherit',
            }}
          >
            Back to Tournaments
          </button>
        </Box>
      </Box>
    );
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
          <div className={styles.headerInner}>
            <button
              onClick={() => navigate('/tournaments')}
              className={styles.backBtn}
              style={{ color: colors.textSecondary }}
            >
              <ArrowLeft size={18} />
            </button>
            <TournamentHeader tournament={tournament} colors={colors} />
          </div>
        </div>

        {/* Description */}
        {tournament.description && (
          <div className={styles.section} style={{
            backgroundColor: colors.cardBg,
            borderColor: colors.border,
          }}>
            <p style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 1.6, margin: 0 }}>
              {tournament.description}
            </p>
          </div>
        )}

        {/* Upcoming: show entrants */}
        {isUpcoming && (
          <div className={styles.section} style={{
            backgroundColor: colors.cardBg,
            borderColor: colors.border,
          }}>
            <h2 className={styles.sectionTitle} style={{ color: colors.textPrimary }}>
              <Users size={18} weight="fill" style={{ marginRight: 8 }} />
              Registered Entrants
            </h2>
            <EntrantsList entrants={entrants} colors={colors} />
          </div>
        )}

        {/* Completed: show results */}
        {!isUpcoming && filteredResults.length > 0 && (
          <div className={styles.section} style={{
            backgroundColor: colors.cardBg,
            borderColor: colors.border,
          }}>
            <h2 className={styles.sectionTitle} style={{ color: colors.textPrimary }}>
              <Trophy size={18} weight="fill" style={{ marginRight: 8 }} />
              Final Results
            </h2>
            <DivisionTabs
              divisions={divisions}
              activeDivision={activeDivision}
              onDivisionChange={setActiveDivision}
              colors={colors}
            />
            <ResultsTable results={filteredResults} colors={colors} />
          </div>
        )}

        {!isUpcoming && results.length === 0 && (
          <div className={styles.section} style={{
            backgroundColor: colors.cardBg,
            borderColor: colors.border,
          }}>
            <p style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center', padding: 24 }}>
              No results available for this tournament.
            </p>
          </div>
        )}
      </Box>
    </Box>
  );
}
