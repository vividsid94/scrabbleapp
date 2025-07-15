import axios from 'axios';

export const getMoveSet = async (baseURL, gameNum) => {
    let first3 = Math.floor(gameNum / 100).toString().substring(0, 3);
    let fullLink = baseURL + first3 + '/anno' + gameNum + '.gcg'
    let returnMoveSet = [];
    let returnOrigPlayerRaw = [];
    try {
      const response = await axios.get('/.netlify/functions/proxy?url=' + encodeURIComponent(fullLink))
      console.log("Game reset");
      returnMoveSet = response.data.toString().split("\n").filter(str => str.startsWith(">"));
      returnOrigPlayerRaw = response.data.toString().split("\n").filter(str => str.startsWith(">"))[0].split(':')[0];
      var lines = response.data.toString().split("\n");
      var notes = [];
      for (var i = 0; i < lines.length; i++) {
          if (lines[i].startsWith("#note")) {
              var count = lines.slice(0,i).filter(line => line.startsWith(">")).length;
              notes.push([lines[i].replace("#note ", ""), count]);
          }
      }
      return [returnMoveSet, returnOrigPlayerRaw, notes];  
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



