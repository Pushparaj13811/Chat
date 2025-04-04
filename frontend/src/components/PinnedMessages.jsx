import React, { useState } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { PinIcon, ChevronDown, ChevronUp, X, ChevronLeft, ChevronRight, Pin } from 'lucide-react';
import { formatMessageTime } from '../lib/utils';

const PinnedMessages = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { pinnedMessages, unpinMessage, selectedUser } = useChatStore();
  const { authUser } = useAuthStore();

  if (!pinnedMessages || pinnedMessages.length === 0) {
    return null;
  }

  const currentMessage = pinnedMessages[currentIndex];
  const totalPinned = pinnedMessages.length;

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      // Wrap around to the end
      setCurrentIndex(pinnedMessages.length - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < pinnedMessages.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Wrap around to the beginning
      setCurrentIndex(0);
    }
  };

  const handleUnpin = (messageId) => {
    unpinMessage(messageId);
  };

  // Function to render appropriate content based on message type
  const renderMessageContent = (message) => {
    if (message.isDeleted) {
      return <span className="text-gray-400 italic">This message was deleted</span>;
    }

    if (message.image) {
      return (
        <div className="flex items-center gap-2">
          <img src={message.image} alt="Attachment" className="w-8 h-8 rounded object-cover" />
          {message.text && <span className="text-sm truncate">{message.text}</span>}
        </div>
      );
    }

    if (message.type === 'voice') {
      return (
        <div className="flex items-center gap-2">
          <div className="bg-gray-700 p-1 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="22"></line>
            </svg>
          </div>
          <span className="text-sm">Voice Message ({Math.round(message.duration)}s)</span>
        </div>
      );
    }

    if (message.type === 'document') {
      return (
        <div className="flex items-center gap-2">
          <div className="bg-gray-700 p-1 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <span className="text-sm truncate">{message.fileName || "Document"}</span>
        </div>
      );
    }

    return <span className="text-sm truncate">{message.text}</span>;
  };

  const isOwnMessage = currentMessage.senderId === authUser._id;
  const senderName = isOwnMessage ? "You" : selectedUser?.fullName || "User";

  return (
    <div className="bg-gray-800/50 border-b border-gray-700 overflow-hidden transition-all duration-300">
      {/* Header - always shown */}
      <div
        className="flex items-center justify-between p-2 px-4 cursor-pointer hover:bg-gray-700/30"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2 text-gray-300">
          <Pin size={16} />
          <span className="text-sm font-medium">
            {pinnedMessages.length > 1
              ? `${pinnedMessages.length} pinned messages`
              : "1 pinned message"}
          </span>
        </div>

        <div className="flex items-center">
          {/* Show navigation controls if there are multiple pinned messages */}
          {pinnedMessages.length > 1 && (
            <div className="flex items-center mr-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                className="p-1 hover:bg-gray-700 rounded-full"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs mx-1 text-gray-400">
                {currentIndex + 1}/{pinnedMessages.length}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="p-1 hover:bg-gray-700 rounded-full"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Expand/collapse button */}
          <button className="p-1 hover:bg-gray-700 rounded-full">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Current pinned message preview - always shown */}
      <div className="px-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center">
              {/* Sender avatar and name */}
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full overflow-hidden">
                  <img
                    src={
                      currentMessage.senderId === authUser._id
                        ? authUser.profilePic || "/avatar.png"
                        : selectedUser.profilePic || "/avatar.png"
                    }
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-xs font-medium text-gray-300">
                  {currentMessage.senderId === authUser._id
                    ? "You"
                    : selectedUser.username}
                </span>
              </div>
              <span className="mx-2 text-gray-500">•</span>
              <span className="text-xs text-gray-400">
                {formatMessageTime(currentMessage.createdAt)}
              </span>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleUnpin(currentMessage._id);
            }}
            className="p-1 hover:bg-gray-700 rounded-full"
            title="Unpin message"
          >
            <X size={14} />
          </button>
        </div>

        {/* Message content */}
        <div className="mt-1 text-gray-200">
          {renderMessageContent(currentMessage)}
        </div>
      </div>

      {/* Expanded view of all pinned messages */}
      {isExpanded && pinnedMessages.length > 1 && (
        <div className="px-4 pt-2 pb-3 border-t border-gray-700/50 max-h-60 overflow-y-auto">
          <h4 className="text-xs font-medium text-gray-400 mb-2">All pinned messages</h4>
          <div className="space-y-3">
            {pinnedMessages.map((message, index) => (
              <div
                key={message._id}
                className={`p-2 rounded ${
                  index === currentIndex ? "bg-gray-700/50" : "hover:bg-gray-700/30"
                } cursor-pointer`}
                onClick={() => setCurrentIndex(index)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full overflow-hidden">
                      <img
                        src={
                          message.senderId === authUser._id
                            ? authUser.profilePic || "/avatar.png"
                            : selectedUser.profilePic || "/avatar.png"
                        }
                        alt="avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-300">
                      {message.senderId === authUser._id
                        ? "You"
                        : selectedUser.username}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatMessageTime(message.createdAt)}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnpin(message._id);
                    }}
                    className="p-1 hover:bg-gray-700/70 rounded-full"
                    title="Unpin message"
                  >
                    <X size={12} />
                  </button>
                </div>
                <div className="mt-1 text-sm text-gray-300">
                  {renderMessageContent(message)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PinnedMessages; 