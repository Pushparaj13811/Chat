import { useEffect, useState } from 'react';
import { useCallStore } from '../../store/useCallStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useChatStore } from '../../store/useChatStore';
import CallRinging from './CallRinging';
import CallInProgress from './CallInProgress';
import toast from 'react-hot-toast';
import { playSound, CALL_SOUNDS } from '../../lib/audio-utils';

const CallModal = () => {
  const { 
    callStatus, 
    callType, 
    call, 
    answerCall, 
    rejectCall, 
    endCall,
    initializeCallFeature,
    isMinimized,
    callFeaturesInitialized
  } = useCallStore();
  
  const { selectedUser } = useChatStore();
  const { authUser } = useAuthStore();
  const socket = useChatStore((state) => state.socket);
  const [initializationAttempted, setInitializationAttempted] = useState(false);

  // Initialize call handlers when component mounts and socket is available
  useEffect(() => {
    // Only try to initialize if socket exists and we haven't successfully initialized before
    if (socket && !callFeaturesInitialized && !initializationAttempted) {
      setInitializationAttempted(true);
      console.log("Socket is available, initializing call features");
      initializeCallFeature();
    }
  }, [socket, callFeaturesInitialized, initializeCallFeature, initializationAttempted]);

  // If no active call or minimized, don't render modal
  if (callStatus === null || callStatus === 'idle' || isMinimized) {
    return null;
  }

  // Show proper UI based on call status
  const renderCallContent = () => {
    switch (callStatus) {
      case 'calling':
        // Outgoing call
        return (
          <CallRinging 
            isOutgoing={true}
            callType={callType}
            user={selectedUser}
            onEnd={endCall}
          />
        );
      case 'ringing':
        // Incoming call
        return (
          <CallRinging
            isOutgoing={false}
            callType={call?.callType}
            user={call?.from}
            onAnswer={answerCall}
            onReject={rejectCall}
          />
        );
      case 'ongoing':
        // Active call
        return (
          <CallInProgress
            callType={callType}
            remotePeer={call?.from || selectedUser}
            onEnd={endCall}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${isMinimized ? 'hidden' : ''}`}>
      <div className="absolute inset-0 bg-black bg-opacity-75" onClick={() => {}} />
      <div className="relative bg-base-200 rounded-lg shadow-xl max-w-3xl w-full md:w-4/5 lg:w-3/4 z-10 overflow-hidden">
        {renderCallContent()}
      </div>
    </div>
  );
};

export default CallModal; 