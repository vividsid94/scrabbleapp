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
        const regex = /<td><a href='annotated\.php\?u=(\d+)'>View<\/a><\/td>/g;
        // Array to store the numbers
        const numbers = [];
        
        // Use `match` method to find all matches
        let match;
        while ((match = regex.exec(text)) !== null) {
            // The first captured group will contain the number
            numbers.push(match[1]);
        }
        
        return numbers;
    }
  } catch(err) {
    console.log(err)
  }
}



