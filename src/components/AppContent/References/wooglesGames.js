export const wooglesGames = [
  "QKrTv2Au",
  "qXbNRp7j", 
  "R8XxJ6Y9",
  "muCHDQvk",
  "GyYCGRRy",
  "L2tq5Lvg",
  "oceajEGJ",
  "M6qivG9q",
  "FVPYZ6mS",
  "zUW5ppc2"
];

export const getRandomWooglesGame = () => {
  const randomIndex = Math.floor(Math.random() * wooglesGames.length);
  return wooglesGames[randomIndex];
}; 