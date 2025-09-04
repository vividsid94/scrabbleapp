/**
 * Load Dictionary - Railway Service Interface
 * 
 * This function provides a unified interface to the deployed Railway service
 * for word validation, anagram search, and subanagram search.
 * 
 * Used by: gameLogic.js, botLogic.js, getBoardControl.js, getTopMoves.js, 
 * generateMoves.js, studyLogic.js, Boggle.js
 */

const axios = require('axios');
const RAILWAY_BASE_URL = 'https://scrabble-move-generator-production.up.railway.app';

/**
 * Railway Dictionary Interface
 * Provides compatibility with existing code that expects a dictionary object
 */
class RailwayDictionary {
  constructor() {
    this.baseUrl = RAILWAY_BASE_URL;
    this.format = 'Railway Service';
  }

  /**
   * Check if a word exists in the dictionary
   */
  async contains(word) {
    try {
      const response = await axios.post(`${this.baseUrl}/validate-word`, {
        word: word
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000 // 10 second timeout
      });

      return response.data.isValid || false;
    } catch (error) {
      console.error('Error calling Railway service:', error);
      return false;
    }
  }

  /**
   * Search for anagrams of given letters
   */
  async search(letters) {
    try {
      const response = await axios.post(`${this.baseUrl}/find-anagrams`, {
        letters: letters
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000 // 10 second timeout
      });

      const data = response.data;
      
      // Handle different response formats
      if (data.words) return data.words;
      if (data.anagrams) return data.anagrams;
      if (data.results) return data.results;
      if (Array.isArray(data)) return data;
      
      return [];
    } catch (error) {
      console.error('Error calling Railway service:', error);
      return [];
    }
  }

  /**
   * Search for subanagrams (shorter words)
   */
  async searchSubanagrams(letters) {
    try {
      const response = await axios.post(`${this.baseUrl}/find-subanagrams`, {
        letters: letters
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000 // 10 second timeout
      });

      const data = response.data;
      
      // Handle different response formats
      if (data.words) return data.words;
      if (data.subanagrams) return data.subanagrams;
      if (data.results) return data.results;
      if (Array.isArray(data)) return data;
      
      return [];
    } catch (error) {
      console.error('Error calling Railway service:', error);
      return [];
    }
  }

  /**
   * Get information about the dictionary
   */
  getInfo() {
    return {
      format: this.format,
      source: 'Railway Service',
      url: this.baseUrl
    };
  }

  // Compatibility methods for existing code
  hasKWG() { return false; }
  hasGaddag() { return false; }
  getPrimaryFormat() { return this.format; }
  getWordCount() { return 'Unknown (Railway Service)'; }
  
  // Legacy methods that might be expected
  getAllWords() { return []; } // Not supported via Railway
  getDefinition(word) { return null; } // Not supported via Railway
}

/**
 * Load the dictionary - returns Railway service interface
 */
function loadDictionary() {
  return new RailwayDictionary();
}

module.exports = loadDictionary;
