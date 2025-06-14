// Test rack configurations
// Set to null to use random racks
export const TEST_RACKS = {
  enabled: false, // Set to false to use random racks
  player1: ['E', 'C', 'C', 'D', 'L', 'F', 'G'], // Example test rack
  player2: ['E', 'V', 'V', 'U', 'U', 'L', 'U']  // Example test rack
}; 

// Configuration for bot rack visibility
export const BOT_RACK_VISIBILITY = {
  enabled: false, // Set to true to always show bot's rack
  showDuringThinking: false // Set to true to show rack even when bot is thinking
}; 