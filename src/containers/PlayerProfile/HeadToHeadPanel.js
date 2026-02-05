import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHeadToHead, searchPlayers } from '../../axios/crossTablesApi';
import { useViewerStore } from '../../stores/viewerStore';

/**
 * Head-to-Head panel: search for opponent, show W-L summary + game list.
 */
export default function HeadToHeadPanel({ playerId, colors }) {
  const navigate = useNavigate();
  const { setGameNum } = useViewerStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedOpponent, setSelectedOpponent] = useState(null);
  const [h2hGames, setH2hGames] = useState([]);
  const [loadingH2H, setLoadingH2H] = useState(false);
  const [h2hError, setH2hError] = useState(null);
  const searchTimer = useRef(null);

  const handleSearch = useCallback((value) => {
    setSearchTerm(value);
    setSelectedOpponent(null);
    setH2hGames([]);
    setH2hError(null);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!value.trim()) {
      setSearchResults([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      try {
        setSearching(true);
        const results = await searchPlayers(value);
        // Filter out the current player
        setSearchResults(results.filter(p => String(p.playerid) !== String(playerId)).slice(0, 10));
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, [playerId]);

  const selectOpponent = async (opponent) => {
    setSelectedOpponent(opponent);
    setSearchTerm(opponent.name || opponent.playername || '');
    setSearchResults([]);
    setH2hError(null);

    try {
      setLoadingH2H(true);
      const games = await getHeadToHead([parseInt(playerId), parseInt(opponent.playerid)]);
      setH2hGames(games);
    } catch {
      setH2hError('Failed to load head-to-head data.');
      setH2hGames([]);
    } finally {
      setLoadingH2H(false);
    }
  };

  // Calculate W-L from h2h games
  const getRecord = () => {
    let wins = 0, losses = 0, ties = 0;
    for (const g of h2hGames) {
      const p1id = String(g.player1id || g.playerid1);
      const score1 = Number(g.player1score || g.score1 || 0);
      const score2 = Number(g.player2score || g.score2 || 0);
      const isPlayer1 = p1id === String(playerId);
      const myScore = isPlayer1 ? score1 : score2;
      const theirScore = isPlayer1 ? score2 : score1;
      if (myScore > theirScore) wins++;
      else if (myScore < theirScore) losses++;
      else ties++;
    }
    return { wins, losses, ties };
  };

  return (
    <div>
      {/* Search input */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search for an opponent..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '8px 12px',
            fontSize: 13,
            borderRadius: 6,
            border: `1px solid ${colors.border}`,
            backgroundColor: colors.inputBg,
            color: colors.textPrimary,
            outline: 'none',
            fontFamily: 'inherit',
          }}
          onFocus={(e) => { e.target.style.borderColor = colors.accentBlue; }}
          onBlur={(e) => {
            // Delay to allow click on dropdown
            setTimeout(() => { e.target.style.borderColor = colors.border; }, 200);
          }}
        />

        {/* Dropdown */}
        {searchResults.length > 0 && !selectedOpponent && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 10,
            backgroundColor: colors.cardBg,
            border: `1px solid ${colors.border}`,
            borderRadius: 6,
            marginTop: 4,
            maxHeight: 200,
            overflowY: 'auto',
            boxShadow: `0 4px 16px ${colors.shadow}`,
          }}>
            {searchResults.map((p) => (
              <div
                key={p.playerid}
                onClick={() => selectOpponent(p)}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: 13,
                  color: colors.textPrimary,
                  borderBottom: `1px solid ${colors.border}`,
                  transition: 'background-color 0.1s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.accentBlueBg; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <span style={{ fontWeight: 600 }}>{p.name || p.playername}</span>
                {p.twlrating && (
                  <span style={{ color: colors.textSecondary, marginLeft: 8, fontSize: 12 }}>
                    ({Math.round(Number(p.twlrating))})
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {searching && (
          <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: colors.textSecondary }}>
            Searching...
          </div>
        )}
      </div>

      {/* H2H Results */}
      {loadingH2H && (
        <div style={{ padding: 20, textAlign: 'center', color: colors.textSecondary, fontSize: 13 }}>
          Loading head-to-head data...
        </div>
      )}

      {h2hError && (
        <div style={{ padding: 12, color: colors.errorText, backgroundColor: colors.errorBg, borderRadius: 6, fontSize: 13 }}>
          {h2hError}
        </div>
      )}

      {selectedOpponent && !loadingH2H && h2hGames.length > 0 && (() => {
        const record = getRecord();
        return (
          <div>
            {/* Summary */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 20,
              padding: '16px',
              borderRadius: 8,
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.border}`,
              marginBottom: 16,
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: colors.positive }}>{record.wins}</div>
                <div style={{ fontSize: 11, color: colors.textSecondary }}>Wins</div>
              </div>
              <div style={{ fontSize: 20, color: colors.textMuted }}>-</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: colors.negative }}>{record.losses}</div>
                <div style={{ fontSize: 11, color: colors.textSecondary }}>Losses</div>
              </div>
              {record.ties > 0 && (
                <>
                  <div style={{ fontSize: 20, color: colors.textMuted }}>-</div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: colors.textSecondary }}>{record.ties}</div>
                    <div style={{ fontSize: 11, color: colors.textSecondary }}>Ties</div>
                  </div>
                </>
              )}
            </div>

            {/* Game list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {h2hGames.map((g, i) => {
                const p1id = String(g.player1id || g.playerid1);
                const isP1 = p1id === String(playerId);
                const myScore = Number(isP1 ? (g.player1score || g.score1) : (g.player2score || g.score2)) || 0;
                const theirScore = Number(isP1 ? (g.player2score || g.score2) : (g.player1score || g.score1)) || 0;
                const won = myScore > theirScore;
                const lost = myScore < theirScore;
                return (
                  <div
                    key={g.gameid || i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: 6,
                      backgroundColor: colors.rowBg,
                      border: `1px solid ${colors.border}`,
                      cursor: g.gameid ? 'pointer' : 'default',
                    }}
                    onClick={() => {
                      if (g.gameid) {
                        setGameNum(parseInt(g.gameid));
                        navigate('/viewer');
                      }
                    }}
                  >
                    <div style={{ fontSize: 13, color: colors.textSecondary }}>
                      {g.tourneyname || g.tournament || ''}
                      {g.date && <span style={{ marginLeft: 8, fontSize: 11 }}>{g.date}</span>}
                    </div>
                    <div style={{
                      fontWeight: 700,
                      fontSize: 14,
                      color: won ? colors.positive : lost ? colors.negative : colors.textSecondary,
                    }}>
                      {myScore} - {theirScore}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {selectedOpponent && !loadingH2H && h2hGames.length === 0 && !h2hError && (
        <div style={{ padding: 20, textAlign: 'center', color: colors.textSecondary, fontSize: 13 }}>
          No head-to-head games found against {selectedOpponent.name || selectedOpponent.playername}.
        </div>
      )}

      {!selectedOpponent && !loadingH2H && (
        <div style={{ padding: 20, textAlign: 'center', color: colors.textSecondary, fontSize: 13 }}>
          Search for a player to see head-to-head results.
        </div>
      )}
    </div>
  );
}
