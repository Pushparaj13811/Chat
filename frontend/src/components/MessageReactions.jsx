import { useState, useRef, useEffect } from "react";
import { SmileIcon } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

// Common emojis for reactions
const EMOJI_OPTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

// This component can be used in two ways:
// 1. With a message object that has reactions
// 2. With direct reactions object
const MessageReactions = ({ message, reactions: directReactions, fromMe, showButton = false }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { addReaction } = useChatStore();
  const { authUser } = useAuthStore();
  const emojiPickerRef = useRef(null);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle adding a reaction
  const handleReactionClick = (emoji) => {
    if (message && message._id) {
      addReaction(message._id, emoji);
    }
    setShowEmojiPicker(false);
  };

  // Get formatted reactions from message or direct reactions
  const getFormattedReactions = () => {
    // Determine which reactions object to use
    const reactionsObject = directReactions || (message && message.reactions);
    
    if (!reactionsObject) return [];
    
    return Object.entries(reactionsObject).map(([emoji, users]) => ({
      emoji,
      count: Array.isArray(users) ? users.length : 0,
      hasReacted: Array.isArray(users) && authUser?._id ? users.includes(authUser._id) : false
    }));
  };

  // Check if user has already reacted
  const getUserReaction = () => {
    const reactionsObject = directReactions || (message && message.reactions);
    
    if (!reactionsObject || !authUser?._id) return null;
    
    for (const [emoji, users] of Object.entries(reactionsObject)) {
      if (Array.isArray(users) && users.includes(authUser._id)) {
        return emoji;
      }
    }
    return null;
  };

  const formattedReactions = getFormattedReactions();
  const userReaction = getUserReaction();

  // No need to render anything if there are no reactions and no button
  if (formattedReactions.length === 0 && !showButton) {
    return null;
  }

  return (
    <div className="relative">
      {/* Display existing reactions - showing just emoji and count */}
      {formattedReactions.length > 0 && (
        <div className="flex items-center gap-1.5">
          {formattedReactions.map(({ emoji, count, hasReacted }) => (
            <button
              key={emoji}
              onClick={() => handleReactionClick(emoji)}
              className={`flex items-center rounded-full ${
                hasReacted ? "bg-primary/30 text-white" : "text-white"
              }`}
            >
              <span className="text-sm">{emoji}</span>
              <span className="text-xs font-medium">{count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Only show button if requested */}
      {showButton && message && (
        <button 
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className={`ml-1 p-1 rounded-full transition-colors ${
            userReaction 
              ? "bg-primary/20 text-primary" 
              : "text-base-content/60 hover:bg-base-300/30"
          }`}
          title="React to message"
        >
          {userReaction ? (
            <span className="text-xs">{userReaction}</span>
          ) : (
            <SmileIcon size={14} />
          )}
        </button>
      )}

      {/* Emoji picker dropdown */}
      {showEmojiPicker && (
        <div 
          ref={emojiPickerRef} 
          className="absolute bottom-6 right-0 bg-base-300 shadow-lg rounded-lg p-1.5 z-10 border border-base-200"
        >
          <div className="flex gap-1.5">
            {EMOJI_OPTIONS.map(emoji => (
              <button
                key={emoji}
                onClick={() => handleReactionClick(emoji)}
                className={`w-7 h-7 flex items-center justify-center hover:bg-base-200 rounded-full transition-colors ${
                  userReaction === emoji ? "bg-primary/20 text-primary" : ""
                }`}
              >
                <span className="text-sm">{emoji}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageReactions; 