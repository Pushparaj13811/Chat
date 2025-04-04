import { useEffect, useState, useRef } from 'react';
import { PhoneCall, Phone, PhoneOff, Video, MicOff } from 'lucide-react';
import { playSound, CALL_SOUNDS } from '../../lib/audio-utils';

const CallRinging = ({ isOutgoing, callType, user, onAnswer, onReject, onEnd }) => {
  const [ringCount, setRingCount] = useState(0);
  const [ringDuration, setRingDuration] = useState(0);
  const audioContextRef = useRef(null);

  // Initialize audio context to warm up audio hardware
  useEffect(() => {
    // Create an audio context to initialize the audio system
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioContextRef.current = new AudioContext();
        
        // Create and start a silent oscillator to activate the audio system
        const oscillator = audioContextRef.current.createOscillator();
        const gainNode = audioContextRef.current.createGain();
        gainNode.gain.value = 0; // Silent
        oscillator.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);
        oscillator.start();
        oscillator.stop(audioContextRef.current.currentTime + 0.001);
        
        console.log('Audio system warmed up');
      }
    } catch (error) {
      console.error('Could not initialize audio context:', error);
    }
    
    // Cleanup on unmount
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(err => console.error('Error closing audio context:', err));
      }
    };
  }, []);

  // Create ringing animation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setRingCount(prev => (prev + 1) % 3);
    }, 800);

    return () => clearInterval(interval);
  }, []);

  // Track call duration
  useEffect(() => {
    const timer = setInterval(() => {
      setRingDuration(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Format ring duration for display
  const formatRingDuration = () => {
    const minutes = Math.floor(ringDuration / 60);
    const seconds = ringDuration % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-8 text-center flex flex-col items-center justify-center min-h-[500px] bg-gradient-to-b from-base-300 to-base-200">
      {/* Call type indicator */}
      <div className="mb-4">
        <span className="badge badge-lg badge-primary">
          {callType === 'video' ? 'Video Call' : 'Audio Call'}
        </span>
      </div>
      
      {/* Call status */}
      <div className="text-lg font-medium mb-6">
        {isOutgoing ? 'Calling...' : 'Incoming Call'}
        <div className="text-sm opacity-70">{formatRingDuration()}</div>
      </div>
      
      {/* User avatar with ripple effect */}
      <div className="relative mb-8">
        <div className="w-40 h-40 rounded-full overflow-hidden mb-2 mx-auto border-4 border-primary/30">
          <img 
            src={user?.profilePic || '/avatar.png'} 
            alt={user?.name || 'User'} 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/avatar.png";
            }}
          />
        </div>
        
        {/* Ripple animation for incoming/outgoing calls */}
        <div className={`absolute -inset-4 z-0 ${isOutgoing ? 'ripple-outgoing' : 'ripple-incoming'}`}></div>
      </div>

      <h2 className="text-2xl font-bold mb-2">
        {user?.name || user?.fullName || 'User'}
      </h2>

      <div className="text-base-content/70 mb-12 flex items-center justify-center text-lg">
        {callType === 'video' ? (
          <Video className="mr-3 size-6" />
        ) : (
          <PhoneCall className="mr-3 size-6" />
        )}
        <span>
          {isOutgoing ? 'Calling...' : `Incoming ${callType} call`}
          <span className="inline-block w-16 text-left">
            {'.'.repeat(ringCount + 1)}
          </span>
        </span>
      </div>

      <div className="flex gap-8 mt-8">
        {isOutgoing ? (
          // Outgoing call - only show end call button
          <button 
            onClick={onEnd}
            className="btn btn-lg btn-circle bg-red-500 hover:bg-red-600 text-white shadow-lg"
          >
            <PhoneOff size={32} />
          </button>
        ) : (
          // Incoming call - show accept and reject buttons
          <>
            <button 
              onClick={onReject}
              className="btn btn-lg btn-circle bg-red-500 hover:bg-red-600 text-white shadow-lg"
            >
              <PhoneOff size={32} />
            </button>
            <button 
              onClick={onAnswer}
              className="btn btn-lg btn-circle bg-green-500 hover:bg-green-600 text-white shadow-lg"
            >
              {callType === 'video' ? <Video size={32} /> : <Phone size={32} />}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CallRinging; 