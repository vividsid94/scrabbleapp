import axios from 'axios';

const BASE_URL = 'https://cross-tables.com/rest';

/**
 * Cross-Tables.com REST API Client
 * Documentation: https://cross-tables.com/rest/
 */

// ==================== TOURNAMENT INFORMATION ====================

/**
 * Get list of upcoming tournaments
 * @param {string} search - Optional search parameter (space-delimited parts)
 * @returns {Promise<Array>} Array of upcoming tournaments
 */
export const getUpcomingTournaments = async (search = null) => {
  try {
    let url = `${BASE_URL}/upcoming.php`;
    if (search) {
      url += `?search=${encodeURIComponent(search)}`;
    }
    const response = await axios.get(url);
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data?.upcoming && Array.isArray(data.upcoming)) return data.upcoming;
    if (data?.tournaments && Array.isArray(data.tournaments)) return data.tournaments;
    return [];
  } catch (error) {
    console.error('Error fetching upcoming tournaments:', error);
    throw error;
  }
};

/**
 * Get detailed information about a single tournament
 * @param {number} upcomingId - The upcomingid from upcoming.php
 * @returns {Promise<Array>} Array of tournament components
 */
export const getUpcomingTournamentDetail = async (upcomingId) => {
  try {
    const response = await axios.get(`${BASE_URL}/upcomingdetail.php?upcoming=${upcomingId}`);
    return response.data.upcomingdetail || [];
  } catch (error) {
    console.error('Error fetching tournament detail:', error);
    throw error;
  }
};

/**
 * Get list of entrants for a tournament component
 * @param {number} upcomingComponentId - The upcomingcomponentid from upcomingdetail.php
 * @returns {Promise<Array>} Array of divisions with their entrants
 */
export const getTournamentEntrants = async (upcomingComponentId) => {
  try {
    const response = await axios.get(`${BASE_URL}/entrants.php?entrantslist=${upcomingComponentId}`);
    return response.data.entrants || [];
  } catch (error) {
    console.error('Error fetching tournament entrants:', error);
    throw error;
  }
};

// ==================== PLAYER PERFORMANCE ====================

/**
 * Get players who have achieved significant milestones recently
 * @returns {Promise<Array>} Array of milestone achievements
 */
export const getMilestones = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/milestones.php`);
    return response.data.milestones || [];
  } catch (error) {
    console.error('Error fetching milestones:', error);
    throw error;
  }
};

/**
 * Get players who have gained the most ratings points in the past 12 months
 * @returns {Promise<Array>} Array of top movers
 */
export const getTopMovers = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/movers.php`);
    return response.data.movers || [];
  } catch (error) {
    console.error('Error fetching top movers:', error);
    throw error;
  }
};

// ==================== PLAYER INFORMATION ====================

/**
 * Get list of players (up to 200 results, sorted by rating)
 * @param {Object} options - Search options
 * @param {string} options.search - Space-delimited search terms
 * @param {string} options.playerlist - Comma-delimited list of player IDs
 * @param {string} options.lexicon - 'csw' for CSW ratings, otherwise TWL
 * @returns {Promise<Array>} Array of players
 */
export const getPlayers = async (options = {}) => {
  try {
    const params = new URLSearchParams();
    if (options.search) {
      params.append('search', options.search);
    }
    if (options.playerlist) {
      params.append('playerlist', options.playerlist);
    }
    if (options.lexicon) {
      params.append('lexicon', options.lexicon);
    }
    
    const url = `${BASE_URL}/players.php${params.toString() ? '?' + params.toString() : ''}`;
    const response = await axios.get(url);
    return response.data.players || [];
  } catch (error) {
    console.error('Error fetching players:', error);
    throw error;
  }
};

/**
 * Get detailed information about a single player
 * @param {Object} options - Query options
 * @param {number} options.player - Player ID (required if naspa not provided)
 * @param {string} options.naspa - NASPA ID (required if player not provided)
 * @param {boolean} options.partialresults - Include only 4 tourney results
 * @param {boolean} options.results - Include all lifetime tourney results
 * @param {boolean} options.upcoming - Include upcoming tourney components
 * @param {boolean} options.allowwgpo - Include upcoming WGPO tourney components
 * @returns {Promise<Object>} Player information
 */
export const getPlayer = async (options) => {
  try {
    if (!options.player && !options.naspa) {
      throw new Error('Either player ID or NASPA ID is required');
    }
    
    const params = new URLSearchParams();
    if (options.player) {
      params.append('player', options.player);
    }
    if (options.naspa) {
      params.append('naspa', options.naspa);
    }
    if (options.partialresults) {
      params.append('partialresults', '1');
    }
    if (options.results) {
      params.append('results', '1');
    }
    if (options.upcoming) {
      params.append('upcoming', '1');
    }
    if (options.allowwgpo) {
      params.append('allowwgpo', '1');
    }
    
    const response = await axios.get(`${BASE_URL}/player.php?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching player:', error);
    throw error;
  }
};

// ==================== TOURNAMENT SUMMARY ====================

/**
 * Get list of recent tournaments (up to 200)
 * @param {string} search - Optional search parameter
 * @returns {Promise<Array>} Array of recent tournaments
 */
export const getRecentTournaments = async (search = null) => {
  try {
    let url = `${BASE_URL}/recenttourneys.php`;
    if (search) {
      url += `?search=${encodeURIComponent(search)}`;
    }
    const response = await axios.get(url);
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data?.recenttourneys && Array.isArray(data.recenttourneys)) return data.recenttourneys;
    if (data?.tourneys && Array.isArray(data.tourneys)) return data.tourneys;
    return [];
  } catch (error) {
    console.error('Error fetching recent tournaments:', error);
    throw error;
  }
};

/**
 * Get detailed information about a past tournament
 * @param {number} tourneyId - Tournament ID
 * @param {boolean} includeResults - Include all players' results
 * @returns {Promise<Object>} Tournament information
 */
export const getTournament = async (tourneyId, includeResults = false) => {
  try {
    let url = `${BASE_URL}/tourney.php?tourney=${tourneyId}`;
    if (includeResults) {
      url += '&results=1';
    }
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching tournament:', error);
    throw error;
  }
};

// ==================== PLAYER TOURNAMENT RESULTS ====================

/**
 * Get tournament results
 * @param {Object} options - Query options
 * @param {number} options.tourney - Tournament ID (optional)
 * @param {number} options.player - Player ID (optional)
 * @returns {Promise<Array>} Array of results
 */
export const getResults = async (options) => {
  try {
    if (!options.tourney && !options.player) {
      throw new Error('Either tourney ID or player ID is required');
    }
    
    const params = new URLSearchParams();
    if (options.tourney) {
      params.append('tourney', options.tourney);
    }
    if (options.player) {
      params.append('player', options.player);
    }
    
    const response = await axios.get(`${BASE_URL}/results.php?${params.toString()}`);
    return response.data.results || [];
  } catch (error) {
    console.error('Error fetching results:', error);
    throw error;
  }
};

// ==================== GAME INFORMATION ====================

/**
 * Get information about games
 * @param {Object} options - Query options
 * @param {number} options.id - Single game ID
 * @param {number} options.minid - Minimum game ID (requires maxid)
 * @param {number} options.maxid - Maximum game ID (requires minid)
 * @returns {Promise<Array>} Array of game information
 */
export const getGames = async (options) => {
  try {
    if (options.id) {
      const response = await axios.get(`${BASE_URL}/games.php?id=${options.id}`);
      return response.data.games || [];
    } else if (options.minid && options.maxid) {
      if (options.maxid - options.minid > 1000) {
        throw new Error('Cannot request more than 1000 games at a time');
      }
      const response = await axios.get(`${BASE_URL}/games.php?minid=${options.minid}&maxid=${options.maxid}`);
      return response.data.games || [];
    } else {
      throw new Error('Either id or both minid and maxid are required');
    }
  } catch (error) {
    console.error('Error fetching games:', error);
    throw error;
  }
};

/**
 * Get head-to-head game information between players
 * @param {Array<number>} playerIds - Array of player IDs (2 or more)
 * @returns {Promise<Array>} Array of game information
 */
export const getHeadToHead = async (playerIds) => {
  try {
    if (!playerIds || playerIds.length < 2) {
      throw new Error('At least 2 player IDs are required');
    }
    const playersParam = playerIds.join('+');
    const response = await axios.get(`${BASE_URL}/headtohead.php?players=${playersParam}`);
    return response.data.games || [];
  } catch (error) {
    console.error('Error fetching head-to-head games:', error);
    throw error;
  }
};

/**
 * Get information about all self-uploaded annotated games
 * @returns {Promise<Array>} Array of annotated games
 */
export const getAllAnnotatedGames = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/allanno.php`);
    return response.data.allanno || [];
  } catch (error) {
    console.error('Error fetching annotated games:', error);
    throw error;
  }
};

// ==================== MISCELLANEOUS ====================

/**
 * Get global database information
 * @returns {Promise<Object>} Database info
 */
export const getInfo = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/info.php`);
    return response.data;
  } catch (error) {
    console.error('Error fetching info:', error);
    throw error;
  }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Search for players by name (searches both TWL and CSW)
 * @param {string} playerName - Player name to search
 * @returns {Promise<Array>} Combined results from TWL and CSW
 */
export const searchPlayers = async (playerName) => {
  try {
    const [twlPlayers, cswPlayers] = await Promise.all([
      getPlayers({ search: playerName }),
      getPlayers({ search: playerName, lexicon: 'csw' })
    ]);
    
    // Combine and deduplicate by playerid
    const playerMap = new Map();
    [...twlPlayers, ...cswPlayers].forEach(player => {
      if (!playerMap.has(player.playerid)) {
        playerMap.set(player.playerid, player);
      }
    });
    
    return Array.from(playerMap.values());
  } catch (error) {
    console.error('Error searching players:', error);
    throw error;
  }
};

/**
 * Retrieve top rated players (rankings) via serverless proxy
 * @param {Object} options
 * @param {string} options.lexicon - 'twl' or 'csw'
 * @param {number} options.limit - number of players to return
 * @returns {Promise<Array>} Array of player summaries
 */
export const getTopPlayers = async ({ lexicon = 'twl', limit = 25 } = {}) => {
  try {
    const params = new URLSearchParams();
    if (lexicon) {
      params.append('lexicon', lexicon);
    }
    params.append('limit', limit.toString());

    const response = await axios.get(`/.netlify/functions/getTopPlayers?${params.toString()}`);
    return response.data?.players || [];
  } catch (error) {
    console.error('Error fetching top players:', error);
    return [];
  }
};

/**
 * Search for tournaments by name (searches both upcoming and recent)
 * @param {string} searchTerm - Tournament name to search
 * @returns {Promise<Object>} Object with upcoming and recent tournaments
 */
export const searchTournaments = async (searchTerm) => {
  try {
    const [upcoming, recent] = await Promise.all([
      getUpcomingTournaments(searchTerm),
      getRecentTournaments(searchTerm)
    ]);
    
    return {
      upcoming,
      recent
    };
  } catch (error) {
    console.error('Error searching tournaments:', error);
    throw error;
  }
};

