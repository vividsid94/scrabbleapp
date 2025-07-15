export const wooglesGames = [
  // Josh's games
  "7sBFFm78",
  "ZtFCZs9k", 
  "bz9KJzFC",
  "LcHEfRna",
  "WCQdZywV",
  "LtFbbRzH",
  "nJ2snggw",
  "QALSJSoH",
  "DbFobzTj",
  "kSvXdDBd",
  // HappyWanderer's games
  "CZppU53h",
  "yvTLH3xK",
  "dLNqink9",
  "dRHXZUWC",
  "rALtKMGP",
  "FuKhpoRn",
  "koL4eren",
  "Je7uygni",
  "SBhbguEW",
  "NYhc6j6v",
  // vividsid94's games
  "QKrTv2Au",
  "qXbNRp7j",
  "R8XxJ6Y9",
  "muCHDQvk",
  "GyYCGRRy",
  "L2tq5Lvg",
  "oceajEGJ",
  "M6qivG9q",
  "FVPYZ6mS",
  "zUW5ppc2",
  // Charlie_T's games
  "zt8SWavK",
  "zDgDBepJ",
  "w3J9DA8y",
  "HLm5ftZ4",
  "Hhi5XbFE",
  "uLJWpCHy",
  "7tSykkYY",
  "yao3iTsY",
  "ZiBx4Ko7",
  "qqU6qoDC"
];

export const getRandomWooglesGame = () => {
  const randomIndex = Math.floor(Math.random() * wooglesGames.length);
  return wooglesGames[randomIndex];
}; 