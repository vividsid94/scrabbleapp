// Test rack configurations
// Set to null to use random racks
export const TEST_RACKS = {
  enabled: false, // Set to false to use random racks
  player1: ['?', 'R', 'A', 'V', 'L', 'O', 'E'], // Example test rack
  player2: ['?', 'R', 'R', 'V', 'T', 'L', 'M']  // Example test rack
}; 

// Configuration for bot rack visibility
export const BOT_RACK_VISIBILITY = {
  enabled: false, // Set to true to always show bot's rack
  showDuringThinking: false // Set to true to show rack even when bot is thinking
}; 