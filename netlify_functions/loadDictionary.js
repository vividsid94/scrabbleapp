/**
 * Load Dictionary - Now calls deployed Railway service
 * 
 * This function provides a simple interface to validate words and search anagrams
 * by calling the deployed Go service instead of parsing KWG files locally.
 */

const RAILWAY_BASE_URL = 'https://scrabble-move-generator-production.up.railway.app';

/**
 * Simple dictionary interface that calls the Railway service
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
      const response = await fetch(`${this.baseUrl}/validate-word`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ word: word })
      });

      if (!response.ok) {
        console.error('Railway service error:', response.status, response.statusText);
        return false;
      }

      const data = await response.json();
      return data.isValid || false;
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
      const response = await fetch(`${this.baseUrl}/anagram-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ letters: letters })
      });

      if (!response.ok) {
        console.error('Railway service error:', response.status, response.statusText);
        return [];
      }

      const data = await response.json();
      return data.words || [];
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
}

/**
 * Load the dictionary - now returns Railway service interface
 */
function loadDictionary() {
  return new RailwayDictionary();
}

module.exports = loadDictionary;
