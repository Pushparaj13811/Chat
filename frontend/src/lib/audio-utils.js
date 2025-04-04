/**
 * Audio utility functions for call sounds
 */

// Cache for audio elements to avoid recreating them
const audioCache = new Map();

/**
 * Play a sound with proper error handling and browser compatibility
 * @param {string} src - Path to the audio file
 * @param {Object} options - Playback options
 * @param {number} options.volume - Volume from 0 to 1 (default: 0.7)
 * @param {boolean} options.loop - Whether to loop the audio (default: false)
 * @param {Function} options.onEnded - Callback when audio ends
 * @returns {Object} - Control functions { stop, setVolume }
 */
export const playSound = (src, options = {}) => {
  const {
    volume = 0.7,
    loop = false,
    onEnded = null
  } = options;
  
  // Return a no-op if no source provided
  if (!src) {
    console.warn('No audio source provided');
    return { 
      stop: () => {}, 
      setVolume: () => {}
    };
  }
  
  // Check if we already have this audio in cache
  let audio = audioCache.get(src);
  
  // If not in cache, create a new audio element and cache it
  if (!audio) {
    audio = new Audio(src);
    audioCache.set(src, audio);
  }
  
  // Reset the audio to the beginning if it was already playing
  audio.currentTime = 0;
  audio.volume = volume;
  audio.loop = loop;
  
  // Add ended callback if provided
  if (onEnded) {
    const handleEnded = () => {
      onEnded();
      audio.removeEventListener('ended', handleEnded);
    };
    
    audio.addEventListener('ended', handleEnded);
  }
  
  // Attempt to play with proper error handling
  const playPromise = audio.play();
  
  if (playPromise !== undefined) {
    playPromise.catch(error => {
      console.error(`Error playing sound (${src}):`, error);
      
      // Most common error is that browser requires user interaction first
      if (error.name === 'NotAllowedError') {
        console.warn('Audio playback requires user interaction first');
      }
    });
  }
  
  // Return control functions
  return {
    stop: () => {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (error) {
        console.error('Error stopping audio:', error);
      }
    },
    setVolume: (newVolume) => {
      try {
        audio.volume = Math.max(0, Math.min(1, newVolume));
      } catch (error) {
        console.error('Error setting audio volume:', error);
      }
    }
  };
};

/**
 * Preload audio files to cache them for faster playback
 * @param {Array<string>} sources - Array of audio file paths to preload
 */
export const preloadSounds = (sources) => {
  sources.forEach(src => {
    if (!audioCache.has(src)) {
      const audio = new Audio();
      audio.src = src;
      audio.preload = 'auto';
      audioCache.set(src, audio);
    }
  });
};

/**
 * Define call sound paths for easier reference
 */
export const CALL_SOUNDS = {
  RINGTONE: '/audio/incoming-call.mp3',
  OUTGOING: '/audio/outgoing-call.mp3',
  CONNECTED: '/audio/call-connected.mp3',
  ENDED: '/audio/call-end.mp3',
  ACCEPTED: '/audio/call-answer.mp3',
  REJECTED: '/audio/call-rejected.mp3',
  FAILED: '/audio/call-failed.mp3'
};

// Preload call sounds
preloadSounds(Object.values(CALL_SOUNDS)); 