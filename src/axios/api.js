import axios from 'axios';

export const getMoveSet = async (baseURL, gameNum) => {
    let first3 = Math.floor(gameNum / 100).toString().substring(0, 3);
    let fullLink = baseURL + first3 + '/anno' + gameNum + '.gcg'
    try {
      const response = await axios.get('/.netlify/functions/proxy?url=' + encodeURIComponent(fullLink))
      console.log("Game reset");
      return response.data.toString(); // Return raw GCG string
    } catch(err) {
      console.log(err)
    }
}
export const getGameInfo = async (baseURL, gameNum) => {
    try {
        const response = await axios.get('/.netlify/functions/proxy?url=' + encodeURIComponent(baseURL + gameNum));
        return response.data;
    } catch (error) {
        console.error(error);
    }
}

export const getRecentGameInfo = async (searchLink) => {
    let returnRecentNames = [];
    let returnRecentDictionaries = [];
    let returnRecentGameNums = [];
    try {
      const response = await axios.get('/.netlify/functions/proxy?url=' + encodeURIComponent(searchLink))
      let text = response.data;
      let re = /<a href='annotated\.php\?u=(\d+)'>View<\/a>/;
      let match = text.match(re);
      if (match) {
          let href = `${match[1]}`;
      } else {
          console.log("No match found for annotated game.");
      }
      let re2 = /<td class='nobr'>(.*?)<\/td>|<td class='nobr'>(.*)/g;
      let match2;
      let count = 0;
      let removeAnchorTag = /<a.*?>(.*?)<\/a>/g;
      while ((match2 = re2.exec(text)) && count <= 50) {
        let extractedTag;
        if (match2[1]) {
          extractedTag = match2[1].replace(removeAnchorTag, "$1");
        } else if (match2[2]) {
          extractedTag = match2[2].replace(removeAnchorTag, "$1").replace(/<td>$/, "");
        }
        returnRecentNames.push(extractedTag);
        count++;
      }
      if(count === 0){
          console.log("No match found for <td class='nobr'><td>.")
      }
      let regex = /<td class='tdc nobr'>(.*?)<\/a><\/td>/g;
      let match3;
      let count2 = 0;
      while ((match3 = regex.exec(text)) && count2 <= 100) {
          let extractedTag = match3[1].replace(removeAnchorTag, "$1")
          if (!extractedTag.match(/<a/)) {
            returnRecentDictionaries.push(extractedTag);
          }
          else{
            let number = match3[1].match(/\d+/);
            returnRecentGameNums.push(number[0]);
          }
          count2++;
      }   
      return [returnRecentNames, returnRecentDictionaries, returnRecentGameNums]; 
    } catch(err) {
      console.log(err)
    }
}

export const findPlayerId = async (searchLink, p) => {
  try {    
    let id;
    const response = await axios.get(searchLink + p);
    for (let player of response.data.players) {
      if (player.name === p) {
        id = player.playerid;
      }
    }
    return id;
  } catch(err) {
    console.log(err)
  }
}

export const getCustomPlayerGameInfo = async (searchLink, searchLink2, p) => {
  try {
    const players = new Map();
    const response = await axios.get(searchLink + p);
    for (let player of response.data.players) {
      players.set(player.name.toLowerCase(), player.playerid);
    }
    const id = players.get(p.toLowerCase());
    if(id){
        const response = await axios.get('/.netlify/functions/proxy?url=' + encodeURIComponent(searchLink2) + id)
        let text = response.data;
        
        // Extract game numbers, opponent names, dates, and tournaments from the table
        const gameData = [];
        const tableRegex = /<tr class='row[01]'[^>]*>.*?<td><a href='annotated\.php\?u=(\d+)'>View<\/a><\/td>.*?<td class='nowrap'><a[^>]*>([^<]+)<\/a><\/td>.*?<td><a[^>]*>([^<]+)<\/a><\/td>.*?<td>([^<]+)<\/td>/gs;
        
        let match;
        while ((match = tableRegex.exec(text)) !== null) {
            const gameNum = match[1];
            const opponentName = match[2].trim();
            const tournament = match[3].trim();
            const date = match[4].trim();
            gameData.push({ gameNum, opponentName, tournament, date });
        }
        
        return gameData;
    }
  } catch(err) {
    console.log(err)
  }
}

// Fetch players from cross-tables.com - both TWL and CSW
export const getAllPlayers = async () => {
  let allPlayers = [];
  
  // Fetch TWL players (top 3000)
  for (let i = 0; i < 15; i++) {
    const url = `https://cross-tables.com/rest/players.php?offset=${i * 200}`;
    try {
      const response = await axios.get(url);
      if (response.data.players && response.data.players.length > 0) {
        allPlayers = allPlayers.concat(response.data.players);
        if (response.data.players.length < 200) break; // No more players
      } else {
        break;
      }
    } catch (error) {
      console.error('Error fetching TWL players:', error);
      break;
    }
  }
  
  // Fetch CSW players (top 3000)
  for (let i = 0; i < 15; i++) {
    const url = `https://cross-tables.com/rest/players.php?lexicon=csw&offset=${i * 200}`;
    try {
      const response = await axios.get(url);
      if (response.data.players && response.data.players.length > 0) {
        allPlayers = allPlayers.concat(response.data.players);
        console.log(`Fetched ${response.data.players.length} CSW players from page ${i + 1}`);
        if (response.data.players.length < 200) break; // No more players
      } else {
        break;
      }
    } catch (error) {
      console.error('Error fetching CSW players:', error);
      break;
    }
  }
  
  console.log(`Total players fetched: ${allPlayers.length}`);
  
  // Check if Kevin Bowerman is in the list
  const kevinBowerman = allPlayers.find(player => 
    player.name.toLowerCase().includes('kevin') && 
    player.name.toLowerCase().includes('bowerman')
  );
  if (kevinBowerman) {
    console.log('Found Kevin Bowerman:', kevinBowerman);
  } else {
    console.log('Kevin Bowerman not found in fetched players');
  }
  
  return allPlayers;
};

// Search for a specific player by name
export const searchPlayerByName = async (playerName) => {
  try {
    // Search in TWL
    const twlUrl = `https://cross-tables.com/rest/players.php?search=${encodeURIComponent(playerName)}`;
    const twlResponse = await axios.get(twlUrl);
    
    // Search in CSW
    const cswUrl = `https://cross-tables.com/rest/players.php?lexicon=csw&search=${encodeURIComponent(playerName)}`;
    const cswResponse = await axios.get(cswUrl);
    
    const results = [];
    
    if (twlResponse.data.players) {
      results.push(...twlResponse.data.players);
    }
    
    if (cswResponse.data.players) {
      results.push(...cswResponse.data.players);
    }
    
    console.log(`Search results for "${playerName}":`, results);
    return results;
  } catch (error) {
    console.error('Error searching for player:', error);
    return [];
  }
};

// Get a specific Woogles game by ID (returns GCG format) - using REST API
export const getWooglesGame = async (gameId) => {
  try {
    const url = 'https://woogles.io/api/game_service.GameMetadataService/GetGCG';
    const requestBody = { game_id: gameId };
    
    const response = await axios.get('/.netlify/functions/proxy?url=' + encodeURIComponent(url) + 
      '&method=POST&body=' + encodeURIComponent(JSON.stringify(requestBody)), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Woogles Game Response:', response.data);
    return response.data.gcg; // Returns the GCG string
  } catch (error) {
    console.error('Error getting Woogles game:', error);
    throw error;
  }
};

// Parse Woogles GCG data into structured format
export const parseWooglesGCG = async (gcgData) => {
  try {
    const lines = gcgData.split('\n');
    const gameInfo = {
      id: '',
      lexicon: '',
      player1: { name: '', username: '' },
      player2: { name: '', username: '' },
      moves: [],
      finalScores: { player1: 0, player2: 0 },
      winner: ''
    };
    
    // Parse headers
    for (const line of lines) {
      if (line.startsWith('#id')) {
        gameInfo.id = line.split(' ')[1];
      } else if (line.startsWith('#lexicon')) {
        gameInfo.lexicon = line.split(' ')[1];
      } else if (line.startsWith('#player1')) {
        const parts = line.split(' ');
        gameInfo.player1.username = parts[1];
        gameInfo.player1.name = parts.slice(2).join(' ');
      } else if (line.startsWith('#player2')) {
        const parts = line.split(' ');
        gameInfo.player2.username = parts[1];
        gameInfo.player2.name = parts.slice(2).join(' ');
      }
    }
    
    // Use NEW content-based parser for moves
    const { parseGCG } = await import('../utils/gcgParser');
    const parsedMoves = parseGCG(gcgData);
    
    // Convert to the format expected by this function
    gameInfo.moves = parsedMoves.map(move => ({
      player: move.player,
      play: `${move.rack} ${move.location || ''} ${move.word || ''}`.trim(),
      points: move.score || 0,
      runningTotal: move.total || 0
    }));
    
    // Get final scores from last moves
    if (gameInfo.moves.length > 0) {
      const lastMove = gameInfo.moves[gameInfo.moves.length - 1];
      if (lastMove.player === gameInfo.player1.username) {
        gameInfo.finalScores.player1 = lastMove.runningTotal;
        gameInfo.finalScores.player2 = gameInfo.moves[gameInfo.moves.length - 2]?.runningTotal || 0;
      } else {
        gameInfo.finalScores.player2 = lastMove.runningTotal;
        gameInfo.finalScores.player1 = gameInfo.moves[gameInfo.moves.length - 2]?.runningTotal || 0;
      }
      
      // Determine winner
      if (gameInfo.finalScores.player1 > gameInfo.finalScores.player2) {
        gameInfo.winner = gameInfo.player1.username;
      } else if (gameInfo.finalScores.player2 > gameInfo.finalScores.player1) {
        gameInfo.winner = gameInfo.player2.username;
      }
    }
    
    return gameInfo;
  } catch (error) {
    console.error('Error parsing Woogles GCG:', error);
    return null;
  }
};

// Get Woogles game history (returns detailed game data) - using REST API
export const getWooglesGameHistory = async (gameId) => {
  try {
    const url = 'https://woogles.io/api/game_service.GameMetadataService/GetGameHistory';
    const requestBody = { game_id: gameId };
    
    const response = await axios.get('/.netlify/functions/proxy?url=' + encodeURIComponent(url) + 
      '&method=POST&body=' + encodeURIComponent(JSON.stringify(requestBody)), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Woogles Game History Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error getting Woogles game history:', error);
    throw error;
  }
};

// Get Woogles user profile and games - using REST API
export const getWooglesUserProfile = async (username) => {
  try {
    const url = 'https://woogles.io/api/user_service.UserService/GetFullProfile';
    const requestBody = { username: username };
    
    const response = await axios.get('/.netlify/functions/proxy?url=' + encodeURIComponent(url) + 
      '&method=POST&body=' + encodeURIComponent(JSON.stringify(requestBody)), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Woogles User Profile Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error getting Woogles user profile:', error);
    throw error;
  }
};

// Get Woogles games for a specific player
export const getWooglesPlayerGames = async (username, limit = 10) => {
  try {
    const url = 'https://woogles.io/api/game_service.GameMetadataService/GetGameHistory';
    const requestBody = { 
      username: username,
      limit: limit,
      offset: 0
    };
    
    const response = await axios.get('/.netlify/functions/proxy?url=' + encodeURIComponent(url) + 
      '&method=POST&body=' + encodeURIComponent(JSON.stringify(requestBody)), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Woogles Player Games Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error getting Woogles player games:', error);
    throw error;
  }
};

// Search for Woogles players
export const searchWooglesPlayers = async (searchTerm) => {
  try {
    const url = 'https://woogles.io/api/user_service.UserService/GetFullProfile';
    const requestBody = { username: searchTerm };
    
    const response = await axios.get('/.netlify/functions/proxy?url=' + encodeURIComponent(url) + 
      '&method=POST&body=' + encodeURIComponent(JSON.stringify(requestBody)), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Woogles Player Search Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error searching Woogles players:', error);
    throw error;
  }
};

// Test Woogles API with the correct REST endpoints
export const testWooglesAPI = async () => {
  try {
    console.log('🧪 Testing Woogles REST API...');
    
    // Test with a real game ID from the gist example
    const realGameId = 'qj3fjmdK';
    console.log('Testing with game ID:', realGameId);
    
    // Test GetGCG endpoint and parse the data
    try {
      const gcgResponse = await getWooglesGame(realGameId);
      console.log('✅ GetGCG Raw Response:', gcgResponse);
      
      // Parse the GCG data
      const parsedGame = parseWooglesGCG(gcgResponse);
      console.log('✅ Parsed Game Data:', parsedGame);
      
      if (parsedGame) {
        console.log('🎮 Game Summary:');
        console.log(`   ID: ${parsedGame.id}`);
        console.log(`   Lexicon: ${parsedGame.lexicon}`);
        console.log(`   Players: ${parsedGame.player1.name} vs ${parsedGame.player2.name}`);
        console.log(`   Final Score: ${parsedGame.finalScores.player1} - ${parsedGame.finalScores.player2}`);
        console.log(`   Winner: ${parsedGame.winner}`);
        console.log(`   Total Moves: ${parsedGame.moves.length}`);
      }
    } catch (gcgError) {
      console.log('❌ GetGCG failed:', gcgError.message);
    }
    
    // Test GetGameHistory endpoint
    try {
      const historyResponse = await getWooglesGameHistory(realGameId);
      console.log('✅ GetGameHistory Response:', historyResponse);
    } catch (historyError) {
      console.log('❌ GetGameHistory failed:', historyError.message);
    }
    
    // Test user profile endpoint (this one doesn't work)
    try {
      const profileResponse = await getWooglesUserProfile('testuser');
      console.log('✅ GetFullProfile Response:', profileResponse);
    } catch (profileError) {
      console.log('❌ GetFullProfile failed:', profileError.message);
    }
    
    return { 
      message: 'Woogles API test completed - check console for details',
      gameId: realGameId
    };
  } catch (error) {
    console.error('❌ Error testing Woogles API:', error);
    throw error;
  }
};

// Woogles API functions
export const getWooglesGameMetadata = async (gameId) => {
  try {
    const url = 'https://woogles.io/api/game_service.GameMetadataService/GetMetadata';
    const requestBody = { game_id: gameId };
    
    const response = await axios.get('/.netlify/functions/proxy?url=' + encodeURIComponent(url) + 
      '&method=POST&body=' + encodeURIComponent(JSON.stringify(requestBody)), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Woogles Game Metadata Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error getting Woogles game metadata:', error);
    throw error;
  }
};

export const getWooglesGameGCG = async (gameId) => {
  try {
    const url = 'https://woogles.io/api/game_service.GameMetadataService/GetGCG';
    const requestBody = { game_id: gameId };
    
    const response = await axios.get('/.netlify/functions/proxy?url=' + encodeURIComponent(url) + 
      '&method=POST&body=' + encodeURIComponent(JSON.stringify(requestBody)), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Woogles Game GCG Response:', response.data);
    return response.data.gcg;
  } catch (error) {
    console.error('Error getting Woogles game GCG:', error);
    throw error;
  }
};

export const getApprovedSubmissions = async () => {
  try {
    const response = await axios.get('/.netlify/functions/getApprovedSubmissions');
    if (response.data && response.data.success) {
      return response.data.submissions;
    }
    return [];
  } catch (error) {
    console.error('Error fetching approved submissions:', error);
    return [];
  }
};





