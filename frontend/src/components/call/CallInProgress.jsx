import { useRef, useEffect, useState } from 'react';
import { useCallStore } from '../../store/useCallStore';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, Minimize, Maximize, 
  Volume2, Volume1, VolumeX, Signal, 
} from 'lucide-react';
import { playSound, CALL_SOUNDS } from '../../lib/audio-utils';

const CallInProgress = ({ callType, remotePeer, onEnd }) => {
  const { 
    localStream, 
    remoteStream, 
    isMuted, 
    isVideoOff,
    toggleMute, 
    toggleVideo,
    toggleMinimize,
    isMinimized,
    formatCallDuration
  } = useCallStore();
  
  const { authUser } = useAuthStore();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const [connectionQuality, setConnectionQuality] = useState('good'); // 'good', 'medium', 'poor'
  const [volume, setVolume] = useState(80);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [audioReady, setAudioReady] = useState(false);

  // Set up local video stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Set up remote stream for both video and audio calls
  useEffect(() => {
    if (remoteStream) {
      // For video calls, set the stream to the video element
      if (callType === 'video' && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.volume = volume / 100;
      }
      
      // For audio calls, set the stream to the audio element
      if (callType === 'audio' && remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.volume = volume / 100;
        
        // Try to play audio immediately 
        const playPromise = remoteAudioRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('Audio playback started successfully');
              setAudioReady(true);
            })
            .catch(error => {
              console.error('Audio playback failed:', error);
              // We'll add a button to manually start audio playback
            });
        }
      }
    }
  }, [remoteStream, volume, callType]);

  // Update call duration
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Simulate connection quality changes (in a real app, this would be based on WebRTC stats)
  useEffect(() => {
    // This is a simple simulation - in a real app you'd monitor actual network conditions
    const simulateConnectionChanges = () => {
      const qualities = ['good', 'medium', 'good', 'good'];
      const randomQuality = qualities[Math.floor(Math.random() * qualities.length)];
      setConnectionQuality(randomQuality);
    };
    
    const interval = setInterval(simulateConnectionChanges, 10000);
    return () => clearInterval(interval);
  }, []);

  // Handle volume change
  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value, 10);
    setVolume(newVolume);
    
    // Update volume for both video and audio elements
    if (remoteVideoRef.current) {
      remoteVideoRef.current.volume = newVolume / 100;
    }
    
    if (remoteAudioRef.current) {
      remoteAudioRef.current.volume = newVolume / 100;
    }
  };

  // Play audio manually (for browsers with strict autoplay policies)
  const handleManualAudioStart = () => {
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.play()
        .then(() => {
          console.log('Audio playback started manually');
          setAudioReady(true);
        })
        .catch(error => {
          console.error('Manual audio playback failed:', error);
        });
    }
  };

  // Get appropriate volume icon based on current volume
  const getVolumeIcon = () => {
    if (volume === 0) return <VolumeX size={20} />;
    if (volume < 50) return <Volume1 size={20} />;
    return <Volume2 size={20} />;
  };

  // Get connection quality color
  const getConnectionQualityColor = () => {
    switch(connectionQuality) {
      case 'good': return 'text-green-500';
      case 'medium': return 'text-yellow-400';
      case 'poor': return 'text-red-500';
      default: return 'text-green-500';
    }
  };

  // Add a function to safely play audio
  const playSafeAudio = async (audioElement) => {
    if (!audioElement) return false;
    
    try {
      // Try to play the audio
      await audioElement.play();
      return true;
    } catch (error) {
      console.error('Audio playback failed:', error);
      return false;
    }
  };

  // Add additional useEffect to handle audio playback after user interaction
  useEffect(() => {
    // Function to attempt to play audio after user interaction
    const playAudioAfterInteraction = async () => {
      if (remoteAudioRef.current && remoteStream) {
        const success = await playSafeAudio(remoteAudioRef.current);
        if (success) {
          setAudioReady(true);
          // Remove event listeners after successful playback
          document.removeEventListener('click', playAudioAfterInteraction);
          document.removeEventListener('touchstart', playAudioAfterInteraction);
        }
      }
    };

    // Add event listeners for user interaction to enable audio
    if (remoteStream && !audioReady) {
      document.addEventListener('click', playAudioAfterInteraction);
      document.addEventListener('touchstart', playAudioAfterInteraction);
      
      // Try to play immediately in case autoplay is allowed
      playAudioAfterInteraction();
    }

    // Cleanup function
    return () => {
      document.removeEventListener('click', playAudioAfterInteraction);
      document.removeEventListener('touchstart', playAudioAfterInteraction);
    };
  }, [remoteStream, audioReady]);

  return (
    <div className={`relative ${callType === 'video' ? 'h-[800px]' : 'h-[700px]'}`}>
      {/* Hidden audio element for audio calls */}
      <audio 
        ref={remoteAudioRef} 
        autoPlay 
        playsInline 
        className="hidden"
      />
      
      {/* Call info header */}
      <div className="absolute top-0 left-0 right-0 bg-base-300 p-3 flex items-center justify-between z-10">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full overflow-hidden mr-3 ring-2 ring-primary/30">
            <img 
              src={remotePeer?.profilePic || '/avatar.png'} 
              alt={remotePeer?.name || 'User'} 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/avatar.png";
              }}
            />
          </div>
          <div>
            <div className="text-base font-semibold">
              {remotePeer?.name || remotePeer?.fullName || 'User'}
            </div>
            <div className="text-sm opacity-70 flex items-center">
              {formatCallDuration()} · 
              <span className={`ml-2 flex items-center ${getConnectionQualityColor()}`}>
                <Signal size={14} className="mr-1" />
                {connectionQuality === 'good' ? 'Good connection' : 
                 connectionQuality === 'medium' ? 'Fair connection' : 'Poor connection'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <button 
              onClick={() => setShowVolumeControl(!showVolumeControl)}
              className="btn btn-sm btn-circle bg-base-200"
            >
              {getVolumeIcon()}
            </button>
            
            {showVolumeControl && (
              <div className="absolute right-0 top-full mt-2 bg-base-300 p-3 rounded-lg shadow-lg z-20 w-48">
                <div className="flex items-center gap-2">
                  <VolumeX size={16} />
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={volume} 
                    onChange={handleVolumeChange}
                    className="range range-primary range-sm flex-1" 
                  />
                  <Volume2 size={16} />
                </div>
              </div>
            )}
          </div>
          
          <button 
            onClick={toggleMinimize} 
            className="btn btn-sm btn-circle bg-base-200"
          >
            <Minimize size={16} />
          </button>
        </div>
      </div>
      
      {/* Video containers */}
      {callType === 'video' && (
        <div className="relative h-full bg-gray-900">
          {/* Remote video (full screen) */}
          <div className="absolute inset-0">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-cover ${!remoteStream ? 'hidden' : ''}`}
            />
            
            {/* Show remote user avatar if video is off or not yet connected */}
            {(!remoteStream || isVideoOff) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-base-300/50">
                <div className="w-48 h-48 rounded-full overflow-hidden mb-6 border-4 border-base-100">
                  <img 
                    src={remotePeer?.profilePic || '/avatar.png'} 
                    alt={remotePeer?.name || 'User'} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/avatar.png";
                    }}
                  />
                </div>
                <h2 className="text-2xl font-bold mb-2">
                  {remotePeer?.name || remotePeer?.fullName || 'User'}
                </h2>
                <div className="text-lg opacity-70">
                  {formatCallDuration()}
                </div>
              </div>
            )}
          </div>
          
          {/* Local video (picture-in-picture) */}
          <div className="absolute bottom-24 right-4 w-48 h-36 rounded-lg overflow-hidden border-2 border-white shadow-lg">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
            />
            
            {/* Show avatar if local video is off */}
            {isVideoOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <div className="w-16 h-16 rounded-full overflow-hidden">
                  <img 
                    src={authUser?.profilePic || '/avatar.png'} 
                    alt="You" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/avatar.png";
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Audio call display */}
      {callType === 'audio' && (
        <div className="flex items-center justify-center h-full bg-gradient-to-b from-base-300 to-base-200">
          <div className="text-center">
            <div className="w-40 h-40 rounded-full overflow-hidden mx-auto mb-6 border-4 border-primary/30">
              <img 
                src={remotePeer?.profilePic || '/avatar.png'} 
                alt={remotePeer?.name || 'User'} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/avatar.png";
                }}
              />
            </div>
            <h2 className="text-2xl font-bold mb-3">
              {remotePeer?.name || remotePeer?.fullName || 'User'}
            </h2>
            <p className="text-base-content/70 text-xl mb-2">
              {formatCallDuration()}
            </p>
            <div className={`flex items-center justify-center ${getConnectionQualityColor()} text-sm mb-4`}>
              <Signal size={14} className="mr-1" />
              {connectionQuality === 'good' ? 'Good connection' : 
              connectionQuality === 'medium' ? 'Fair connection' : 'Poor connection'}
            </div>
            
            {/* Audio playback status/control */}
            {remoteStream && !audioReady && (
              <button 
                onClick={handleManualAudioStart}
                className="btn btn-sm btn-primary mt-2"
              >
                <Volume2 size={16} className="mr-2" /> Tap to hear audio
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Call controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-base-300 p-6 flex items-center justify-center space-x-6">
        {/* Mute button */}
        <button 
          onClick={toggleMute}
          className={`btn btn-lg btn-circle ${isMuted ? 'bg-red-500 hover:bg-red-600 text-white' : 'btn-primary'}`}
        >
          {isMuted ? <MicOff size={28} /> : <Mic size={28} />}
        </button>
        
        {/* Video toggle button (only in video calls) */}
        {callType === 'video' && (
          <button 
            onClick={toggleVideo}
            className={`btn btn-lg btn-circle ${isVideoOff ? 'bg-red-500 hover:bg-red-600 text-white' : 'btn-primary'}`}
          >
            {isVideoOff ? <VideoOff size={28} /> : <Video size={28} />}
          </button>
        )}
        
        {/* End call button */}
        <button 
          onClick={onEnd}
          className="btn btn-lg btn-circle bg-red-500 hover:bg-red-600 text-white"
        >
          <PhoneOff size={28} />
        </button>
      </div>
    </div>
  );
};

export default CallInProgress; 