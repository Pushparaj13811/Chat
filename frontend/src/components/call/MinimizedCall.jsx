import { useCallStore } from '../../store/useCallStore';
import { PhoneCall, Video, Maximize, PhoneOff } from 'lucide-react';

const MinimizedCall = () => {
  const { 
    isMinimized, 
    callStatus, 
    callType,
    toggleMinimize, 
    endCall,
    formatCallDuration,
    call
  } = useCallStore();
  
  // Only show if there's a call and it's minimized
  if (!isMinimized || callStatus !== 'ongoing') {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 bg-base-100 shadow-lg rounded-lg p-2 z-50 flex items-center w-64">
      <div className="flex items-center flex-1">
        {/* Call type icon */}
        <div className="bg-primary rounded-full p-2 mr-3">
          {callType === 'video' ? (
            <Video className="size-5 text-white" />
          ) : (
            <PhoneCall className="size-5 text-white" />
          )}
        </div>
        
        {/* Call info */}
        <div className="flex-1">
          <p className="text-sm font-medium">
            {callType === 'video' ? 'Video' : 'Audio'} Call
          </p>
          <p className="text-xs opacity-70">
            {formatCallDuration()}
          </p>
        </div>
      </div>
      
      {/* Control buttons */}
      <div className="flex gap-2">
        <button 
          onClick={toggleMinimize} 
          className="btn btn-sm btn-circle"
        >
          <Maximize size={16} />
        </button>
        <button 
          onClick={endCall} 
          className="btn btn-sm btn-circle bg-red-500 hover:bg-red-600 text-white"
        >
          <PhoneOff size={16} />
        </button>
      </div>
    </div>
  );
};

export default MinimizedCall; 