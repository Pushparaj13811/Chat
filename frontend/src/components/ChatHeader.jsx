import { X, Phone, Video } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useCallStore } from "../store/useCallStore";
import toast from "react-hot-toast";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const { makeCall, callStatus, isWebRTCSupported } = useCallStore();

  // Start a call with the selected user
  const handleStartCall = (callType) => {
    // Check WebRTC support first
    if (!isWebRTCSupported) {
      toast.error("Video/Audio calls are not supported on this browser");
      return;
    }
    
    // Check if user is online
    if (!onlineUsers.includes(selectedUser._id)) {
      toast.error(`${selectedUser.fullName} is offline`);
      return;
    }

    // Check if already in a call
    if (callStatus && callStatus !== 'idle') {
      toast.error("You're already in a call");
      return;
    }

    // Start the call
    makeCall(selectedUser._id, callType);
  };

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="avatar">
            <div className="w-10 rounded-full">
              <img 
                src={selectedUser.profilePic || "/avatar.png"} 
                alt={selectedUser.fullName} 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/avatar.png";
                }}
              />
            </div>
          </div>

          {/* User info */}
          <div>
            <h3 className="font-medium">{selectedUser.fullName}</h3>
            <p className="text-sm text-base-content/70">
              {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        {/* Call buttons */}
        <div className="flex items-center gap-2">
          {/* Audio call button */}
          <button 
            onClick={() => handleStartCall('audio')}
            className="btn btn-sm btn-circle btn-ghost text-primary"
            title="Start audio call"
            disabled={!onlineUsers.includes(selectedUser._id) || !isWebRTCSupported}
          >
            <Phone size={20} />
          </button>
          
          {/* Video call button */}
          <button 
            onClick={() => handleStartCall('video')}
            className="btn btn-sm btn-circle btn-ghost text-primary"
            title="Start video call"
            disabled={!onlineUsers.includes(selectedUser._id) || !isWebRTCSupported}
          >
            <Video size={20} />
          </button>
          
          {/* Close chat button */}
          <button 
            onClick={() => setSelectedUser(null)}
            className="btn btn-sm btn-circle btn-ghost"
            title="Close chat"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
export default ChatHeader;
