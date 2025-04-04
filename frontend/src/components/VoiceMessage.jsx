import { useState, useRef, useEffect } from "react";
import { Play, Pause, X } from "lucide-react";

// Simple voice player component for message list
export const CompactVoicePlayer = ({ duration }) => {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 flex items-center justify-center bg-primary rounded-full text-primary-content">
        <Play size={16} />
      </div>
      <div className="text-sm">
        Voice message
        <span className="text-xs ml-2 text-white font-medium">
          {formatSimpleTime(duration)}
        </span>
      </div>
    </div>
  );
};

// Simple time formatter
export const formatSimpleTime = (timeInSeconds) => {
  if (!timeInSeconds || isNaN(timeInSeconds) || !isFinite(timeInSeconds)) {
    return "00:00";
  }
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const VoiceMessage = ({ audioUrl, duration, isOwnMessage }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const audioRef = useRef(null);
  const progressRef = useRef(null);

  // Format time in mm:ss
  // const formatTime = (timeInSeconds) => {
  //   if (!timeInSeconds || isNaN(timeInSeconds) || !isFinite(timeInSeconds)) {
  //     return "0:0";
  //   }
  //   const minutes = Math.floor(timeInSeconds / 60);
  //   const seconds = Math.floor(timeInSeconds % 60);
  //   return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  // };

  const formatTime = (timeInSeconds) => {
    if (!timeInSeconds || isNaN(timeInSeconds) || !isFinite(timeInSeconds)) {
      return "00:00";
    }
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  // Load audio and set up duration when the URL changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;
    
    // Reset player state when URL changes
    setCurrentTime(0);
    setIsPlaying(false);
    setIsLoaded(false);
    
    if (progressRef.current) {
      progressRef.current.style.width = "0%";
    }
    
    // Set initial duration from prop if provided
    if (duration && isFinite(duration) && !isNaN(duration)) {
      setAudioDuration(duration);
    }
    
    // Set correct duration when metadata loads
    const handleMetadata = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setAudioDuration(audio.duration);
        setIsLoaded(true);
      } else if (duration && isFinite(duration)) {
        setAudioDuration(duration);
        setIsLoaded(true);
      }
    };
    
    // Handle loading errors
    const handleError = (err) => {
      console.error("Audio loading error:", err);
      // Use the provided duration as fallback
      if (duration && isFinite(duration)) {
        setAudioDuration(duration);
      }
      setIsLoaded(true);
    };
    
    audio.addEventListener("loadedmetadata", handleMetadata);
    audio.addEventListener("error", handleError);
    
    return () => {
      audio.removeEventListener("loadedmetadata", handleMetadata);
      audio.removeEventListener("error", handleError);
    };
  }, [audioUrl, duration]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (isFinite(audio.currentTime)) {
        setCurrentTime(audio.currentTime);
      }
      
      if (progressRef.current) {
        const durationToUse = (audio.duration && isFinite(audio.duration)) 
          ? audio.duration 
          : (audioDuration && isFinite(audioDuration) ? audioDuration : 1);
        
        const percent = (audio.currentTime / durationToUse) * 100;
        progressRef.current.style.width = `${isFinite(percent) ? percent : 0}%`;
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (progressRef.current) {
        progressRef.current.style.width = "0%";
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("pause", () => setIsPlaying(false));
    audio.addEventListener("play", () => setIsPlaying(true));

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("pause", () => setIsPlaying(false));
      audio.removeEventListener("play", () => setIsPlaying(true));
    };
  }, [audioDuration]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(err => {
        console.error("Failed to play audio:", err);
      });
    }
  };

  return (
    <div className={`flex items-center gap-3 p-2 ${isOwnMessage ? "bg-primary/10" : "bg-base-300"} rounded-md w-full max-w-[250px]`}>
      <button
        onClick={togglePlay}
        className={`w-9 h-6 flex items-center justify-center rounded-full ${
          isPlaying ? "bg-red-500 text-white" : "bg-primary text-primary-content"
        }`}
      >
        {isPlaying ? <Pause size={15} /> : <Play size={15} />}
      </button>
      
      <div className="flex-1">
        <div className="w-full bg-gray-200 dark:bg-gray-700 h-1 rounded-full overflow-hidden">
          <div 
            ref={progressRef}
            className="h-full bg-primary transition-all duration-100"
            style={{ width: "0%" }}
          ></div>
        </div>
        
        <div className="flex justify-between mt-1 text-xs">
          <span className="text-white font-medium">
            {formatTime(currentTime)}
          </span>
          <span className="text-white font-medium">
            {isLoaded ? formatTime(audioDuration) : " "}
          </span>
        </div>
      </div>
      
      <audio ref={audioRef} src={audioUrl} preload="metadata" className="hidden" />
    </div>
  );
};

export default VoiceMessage; 