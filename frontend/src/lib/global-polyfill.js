// Polyfill for the 'global' variable needed by simple-peer and other Node.js libraries
if (typeof global === 'undefined') {
  window.global = window;
}

// Add Buffer polyfill
import { Buffer as BufferPolyfill } from 'buffer';
if (typeof window !== 'undefined') {
  window.Buffer = BufferPolyfill;
}

// Add process polyfill
if (typeof process === 'undefined' || !process.nextTick) {
  window.process = window.process || {};
  window.process.nextTick = function(fn) {
    setTimeout(fn, 0);
  };
}

export default {}; 