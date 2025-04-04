/**
 * Audio utility functions for call sounds
 */

// Cache for audio elements to avoid recreating them
const audioCache = new Map();

// Sound file mapping for call sounds
export const CALL_SOUNDS = {
  RINGTONE: '/audio/call-ringtone.mp3',
  OUTGOING: '/audio/call-outgoing.mp3',
  CONNECTED: '/audio/call-connected.mp3',
  REJECTED: '/audio/call-rejected.mp3',
  ENDED: '/audio/call-end.mp3',
  FAILED: '/audio/call-failed.mp3',
  ACCEPTED: '/audio/call-accepted.mp3'
};

// Sound instances cache to prevent multiple instances of the same sound
const soundInstances = {};

// Error tracking to prevent repeated error logging
const errorTracker = {
  lastError: null,
  lastTimestamp: 0,
  errorCount: 0
};

/**
 * Play a sound with proper error handling and control
 * @param {string} soundPath - Path to the sound file
 * @param {Object} options - Options for playback
 * @param {boolean} options.loop - Whether to loop the sound
 * @param {number} options.volume - Volume level (0-1)
 * @returns {Object} Controller for the sound
 */
export const playSound = (soundPath, options = {}) => {
  try {
    // Default options
    const { loop = false, volume = 1 } = options;
    
    // If we already have an instance of this sound playing, stop it first
    if (soundInstances[soundPath]) {
      try {
        soundInstances[soundPath].pause();
        soundInstances[soundPath].currentTime = 0;
      } catch (err) {
        // Ignore errors when stopping previous instances
      }
    }
    
    // Create a new audio instance
    const audio = new Audio(soundPath);
    
    // Configure audio
    audio.loop = loop;
    audio.volume = volume;
    
    // Preload the audio
    audio.preload = 'auto';
    
    // Store in cache
    soundInstances[soundPath] = audio;
    
    // Create a promise-based play with proper error handling
    const playPromise = audio.play().catch(error => {
      // Only log unique errors or if it's been a while since the last error
      const now = Date.now();
      const errorMessage = error.message || 'Unknown error';
      
      if (errorTracker.lastError !== errorMessage || 
          (now - errorTracker.lastTimestamp > 5000)) {
        
        errorTracker.lastError = errorMessage;
        errorTracker.lastTimestamp = now;
        errorTracker.errorCount = 1;
        
        console.error(`Error playing sound (${soundPath}): ${error.message}`);
      } else {
        // Just increment the counter for duplicate errors
        errorTracker.errorCount++;
        
        // Log only every 5th duplicate error
        if (errorTracker.errorCount % 5 === 0) {
          console.warn(`Multiple (${errorTracker.errorCount}) audio playback errors: ${errorMessage}`);
        }
      }
      
      // Return null to indicate failure
      return null;
    });
    
    // Return a controller
    return {
      // Stop the sound and clean up
      stop: () => {
        try {
          if (audio) {
            audio.pause();
            audio.currentTime = 0;
            
            // Remove from cache when explicitly stopped
            delete soundInstances[soundPath];
          }
        } catch (e) {
          console.warn(`Error stopping sound: ${e.message}`);
        }
      },
      
      // Pause the sound
      pause: () => {
        try {
          if (audio) {
            audio.pause();
          }
        } catch (e) {
          console.warn(`Error pausing sound: ${e.message}`);
        }
      },
      
      // Resume the sound
      resume: () => {
        try {
          if (audio) {
            audio.play().catch(e => console.warn(`Error resuming sound: ${e.message}`));
          }
        } catch (e) {
          console.warn(`Error resuming sound: ${e.message}`);
        }
      },
      
      // Get the underlying audio element
      getAudio: () => audio,
      
      // Get the play promise
      playPromise
    };
  } catch (error) {
    console.error(`Fatal error setting up sound (${soundPath}): ${error.message}`);
    
    // Return a no-op controller on fatal error
    return {
      stop: () => {},
      pause: () => {},
      resume: () => {},
      getAudio: () => null,
      playPromise: Promise.resolve(null)
    };
  }
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

// Preload call sounds
preloadSounds(Object.values(CALL_SOUNDS)); 