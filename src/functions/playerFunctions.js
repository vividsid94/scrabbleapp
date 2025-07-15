import axios from 'axios';

export const revealPlayers = (name1, name2, setRevealedName1, setRevealedName2) => {
  setRevealedName1(name1);
  setRevealedName2(name2);
};

export const revealElo = (tourneyNum, name1, name2, setRevealedElo, setRevealedElo2) => {
  if (tourneyNum !== 0) {
    axios.get('https://cross-tables.com/rest/tourney.php?tourney=' + tourneyNum + '&results=1')
      .then((posRes) => {
        let sampleData = posRes.data;
        let result = sampleData.tourney.results.find(
          result => result.playername === name1
        );
        let result2 = sampleData.tourney.results.find(
          result => result.playername === name2
        );
        if (result) {
          setRevealedElo(result.oldrating + " at event");
        }
        if (result) {
          setRevealedElo2(result2.oldrating + " at event");
        }
      }, (errRes) => {
        console.log(errRes);
      });
  } else {
    axios.get('https://cross-tables.com/rest/players.php?search=' + name1)
      .then((posRes) => {
        let sampleData = posRes.data;
        for (let player of sampleData.players) {
          if (player.name === name1) {
            setRevealedElo(player.twlrating + " currently");
          }
        }
      }, (errRes) => {
        console.log(errRes);
      });
    axios.get('https://cross-tables.com/rest/players.php?search=' + name2)
      .then((posRes) => {
        let sampleData = posRes.data;
        for (let player of sampleData.players) {
          if (player.name === name2) {
            setRevealedElo2(player.twlrating + " currently");
          }
        }
      }, (errRes) => {
        console.log(errRes);
      });
  }
};

export const revealWooglesElo = async (gameId, setRevealedElo, setRevealedElo2) => {
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
    
    if (response.data && response.data.players) {
      const players = response.data.players;
      if (players.length >= 2) {
        // Player 1 rating
        if (players[0].rating) {
          setRevealedElo(players[0].rating + " at game time");
        }
        // Player 2 rating  
        if (players[1].rating) {
          setRevealedElo2(players[1].rating + " at game time");
        }
      }
    }
  } catch (error) {
    console.error('Error getting Woogles game metadata:', error);
  }
}; 