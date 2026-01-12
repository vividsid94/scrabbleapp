/**
 * Theo Yell Functions
 * 
 * Generates hilarious yelling audio when the player makes a bad move
 */

/**
 * Generate a random scolding phrase for Theo
 */
const getRandomYellPhrase = () => {
  const phrases = [
    "What on earth are you thinking?!",
    "That is absolutely terrible!",
    "No! No! No! What are you doing?!",
    "Are you even trying?!",
    "That move is completely awful!",
    "You should be ashamed of that move!",
    "Come on! You're better than this!",
    "Really?! That's the best you can do?!",
    "That's not just bad, that's embarrassing!",
    "Think! Use your brain!",
    "What in the world was that?!",
    "You're making me look bad!",
    "That's a horrible, horrible move!",
    "No way! That's unacceptable!",
    "Seriously?! Did you even look at the board?!",
    "That's the worst move I've ever seen!",
    "You call that a move?!",
    "I can't believe you just did that!",
    "That's pathetic!",
    "You're supposed to be good at this!"
  ];
  return phrases[Math.floor(Math.random() * phrases.length)];
};

/**
 * Use Web Speech API to make Theo yell at the player
 * @param {Object} mascotRef - Reference to the mascot component
 * @param {boolean} isBingoMiss - Whether this is a bingo miss
 * @returns {string} The phrase that Theo said
 */
export const makeTheoYell = (mascotRef, isBingoMiss = false) => {
  console.log('🔊 makeTheoYell called', { hasMascotRef: !!mascotRef, hasCurrent: !!mascotRef?.current, isBingoMiss });
  
  // Shake the mascot first (even if speech isn't available)
  if (mascotRef?.current) {
    console.log('🔊 Shaking mascot!');
    mascotRef.current.shake();
  } else {
    console.warn('⚠️ Mascot ref not available for shaking');
  }

  // Check if Web Speech API is available
  if (!('speechSynthesis' in window)) {
    console.warn('Web Speech API not supported');
    return isBingoMiss ? "You missed a bingo!" : getRandomYellPhrase();
  }

  const phrase = isBingoMiss ? "You missed a bingo!" : getRandomYellPhrase();
  
  // Create speech synthesis
  const utterance = new SpeechSynthesisUtterance();
  
  // Add pauses and emphasis for more dramatic scolding effect
  // Replace multiple exclamation marks with pauses
  let processedPhrase = phrase
    .replace(/!!/g, '! ... ')
    .replace(/\?!/g, '? ... ')
    .replace(/!$/g, '! ... ');
  
  utterance.text = processedPhrase;
  utterance.volume = 1.0; // Maximum volume for scolding
  utterance.rate = 0.75; // Slower, more deliberate and serious scolding tone
  utterance.pitch = 0.65; // Lower pitch for authoritative, scolding tone
  
  // Function to set voice and speak
  const speakWithVoice = () => {
    console.log('🔊 Speaking phrase:', phrase);
    const voices = speechSynthesis.getVoices();
    console.log('🔊 Available voices:', voices.length);
    
    // Log all available voices for debugging
    console.log('🔊 All voices:', voices.map(v => `${v.name} (${v.lang})`).join(', '));
    
    // Try to find the best scolding voice with priority order
    let selectedVoice = null;
    
    // Priority 1: Deep/authoritative voices by name
    const deepVoices = voices.filter(voice => {
      const name = voice.name.toLowerCase();
      return name.includes('deep') || 
             name.includes('low') || 
             name.includes('baritone') ||
             name.includes('bass') ||
             name.includes('gravel') ||
             name.includes('gruff');
    });
    
    if (deepVoices.length > 0) {
      selectedVoice = deepVoices[0];
      console.log('🔊 Found deep voice:', selectedVoice.name);
    }
    
    // Priority 2: Specific male voices that sound authoritative
    if (!selectedVoice) {
      const specificVoices = voices.filter(voice => {
        const name = voice.name.toLowerCase();
        return name.includes('david') ||
               name.includes('mark') ||
               name.includes('paul') ||
               name.includes('james') ||
               name.includes('thomas') ||
               name.includes('richard') ||
               name.includes('william') ||
               name.includes('george') ||
               name.includes('daniel') ||
               name.includes('michael');
      });
      
      if (specificVoices.length > 0) {
        selectedVoice = specificVoices[0];
        console.log('🔊 Found specific male voice:', selectedVoice.name);
      }
    }
    
    // Priority 3: Google/Microsoft male voices
    if (!selectedVoice) {
      const techVoices = voices.filter(voice => {
        const name = voice.name.toLowerCase();
        return (name.includes('google') || name.includes('microsoft')) &&
               (name.includes('male') || name.includes('en-us') || name.includes('en-gb')) &&
               !name.includes('female');
      });
      
      if (techVoices.length > 0) {
        selectedVoice = techVoices[0];
        console.log('🔊 Found tech voice:', selectedVoice.name);
      }
    }
    
    // Priority 4: Any English male voice
    if (!selectedVoice) {
      const maleVoices = voices.filter(voice => {
        const name = voice.name.toLowerCase();
        return voice.lang.startsWith('en') &&
               (name.includes('male') || 
                name.includes('man') ||
                (!name.includes('female') && !name.includes('woman') && !name.includes('zira')));
      });
      
      if (maleVoices.length > 0) {
        // Prefer voices that aren't high-pitched
        selectedVoice = maleVoices.find(v => 
          !v.name.toLowerCase().includes('high') && 
          !v.name.toLowerCase().includes('child')
        ) || maleVoices[0];
        console.log('🔊 Found English male voice:', selectedVoice.name);
      }
    }
    
    // Priority 5: Any English voice
    if (!selectedVoice) {
      const englishVoices = voices.filter(voice => voice.lang.startsWith('en'));
      if (englishVoices.length > 0) {
        selectedVoice = englishVoices[0];
        console.log('🔊 Found English voice:', selectedVoice.name);
      }
    }
    
    // Priority 6: Any available voice
    if (!selectedVoice && voices.length > 0) {
      selectedVoice = voices[0];
      console.log('🔊 Using fallback voice:', selectedVoice.name);
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      console.log('🔊 Using scolding voice:', selectedVoice.name, `(${selectedVoice.lang})`);
    } else {
      console.log('🔊 No voice found, using default');
    }

    // Speak it!
    try {
      speechSynthesis.speak(utterance);
      console.log('🔊 Speech started!');
    } catch (error) {
      console.error('❌ Error speaking:', error);
    }

    // Clean up after speaking
    utterance.onend = () => {
      console.log('🔊 Speech ended');
      speechSynthesis.cancel();
    };
    
    utterance.onerror = (error) => {
      console.error('❌ Speech error:', error);
    };
  };

  // Load voices if not already loaded
  if (speechSynthesis.getVoices().length === 0) {
    console.log('🔊 Waiting for voices to load...');
    speechSynthesis.onvoiceschanged = () => {
      console.log('🔊 Voices loaded!');
      speakWithVoice();
    };
  } else {
    speakWithVoice();
  }
  
  // Return the phrase so it can be displayed
  return phrase;
};

/**
 * Check if we should trigger Theo's yell based on move coach score
 */
export const shouldTheoYell = (moveCoachData, theoYellEnabled) => {
  if (!theoYellEnabled || !moveCoachData) {
    return false;
  }

  // Get the analysis score (0-100)
  // Trigger yell if score is "poor" (< 40) or "fair" (< 60)
  const score = moveCoachData.score || 0;
  const rating = moveCoachData.overallRating || 'good';
  
  // Yell if rating is poor or fair
  return rating === 'poor' || (rating === 'fair' && score < 50);
};
