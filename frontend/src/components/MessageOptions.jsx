import { useState, useRef, useEffect } from "react";
import { 
  MoreVertical, 
  Reply, 
  Forward, 
  Edit, 
  Trash2, 
  SmileIcon,
  PinIcon
} from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { toast } from "react-hot-toast";

// Common emojis for reactions
const EMOJI_OPTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

const MessageOptions = ({ message, isOwnMessage }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ left: false, right: false });
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const deleteOptionsRef = useRef(null);
  const { addReaction, setReplyTo, editMessage, deleteMessage, pinMessage, unpinMessage } = useChatStore();
  const { authUser } = useAuthStore();

  // Determine the correct position for the menu
  const calculateMenuPosition = () => {
    if (!buttonRef.current || !menuRef.current) return;
    
    const buttonRect = buttonRef.current.getBoundingClientRect();
    const menuRect = menuRef.current.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    
    // For own messages (right side)
    if (isOwnMessage) {
      // Check if menu will fit to the left
      if (buttonRect.left - menuRect.width < 0) {
        setMenuPosition({ left: false, right: false });
      } else {
        setMenuPosition({ left: false, right: true });
      }
    } 
    // For other's messages (left side)
    else {
      // Check if menu will fit to the right
      if (buttonRect.right + menuRect.width > windowWidth) {
        setMenuPosition({ left: false, right: true });
      } else {
        setMenuPosition({ left: true, right: false });
      }
    }
  };

  // Calculate menu position when it's shown
  useEffect(() => {
    if (showMenu) {
      calculateMenuPosition();
      // Recalculate on window resize
      window.addEventListener('resize', calculateMenuPosition);
      return () => window.removeEventListener('resize', calculateMenuPosition);
    }
  }, [showMenu]);

  // Close menu and emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && 
          !buttonRef.current.contains(event.target)) {
        setShowMenu(false);
      }
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target) && 
          !event.target.closest('[data-reaction-button="true"]')) {
        setShowEmojiPicker(false);
      }
      if (deleteOptionsRef.current && !deleteOptionsRef.current.contains(event.target)) {
        setShowDeleteOptions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle adding a reaction
  const handleReactionClick = (emoji) => {
    addReaction(message._id, emoji);
    // Keep emoji picker open - don't close it
    setShowMenu(false);
  };

  // Check if edit is allowed (only within 15 minutes and not for voice messages)
  const canEdit = () => {
    if (!isOwnMessage) return false;
    if (message.type === 'voice') return false;
    
    const now = new Date();
    const messageTime = new Date(message.createdAt);
    const diffMinutes = (now - messageTime) / (1000 * 60);
    
    return diffMinutes <= 15;
  };

  // Handle other message actions
  const handleAction = (action) => {
    console.log(`Action ${action} for message ${message._id}`);
    
    if (action === "react") {
      // For reaction, hide menu and show emoji picker immediately
      setShowMenu(false);
      setShowEmojiPicker(true);
    } else if (action === "reply") {
      setReplyTo({
        messageId: message._id,
        text: message.text,
        senderId: message.senderId
      });
      setShowMenu(false);
    } else if (action === "edit") {
      if (!canEdit()) {
        toast.error("You can only edit messages within 15 minutes of sending");
        setShowMenu(false);
        return;
      }
      
      // Show edit modal - we'll implement this separately
      window.dispatchEvent(new CustomEvent('editMessage', { 
        detail: { 
          messageId: message._id,
          text: message.text
        }
      }));
      setShowMenu(false);
    } else if (action === "delete") {
      setShowMenu(false);
      setShowDeleteOptions(true);
    } else if (action === "pin") {
      pinMessage(message._id);
      setShowMenu(false);
      toast.success("Message pinned");
    } else if (action === "unpin") {
      unpinMessage(message._id);
      setShowMenu(false);
      toast.success("Message unpinned");
    } else {
      // For other actions, just hide both
      setShowMenu(false);
      setShowEmojiPicker(false);
    }
  };

  // Handle delete options
  const handleDelete = (deleteType) => {
    deleteMessage(message._id, deleteType);
    setShowDeleteOptions(false);
  };

  // Get user's current reaction
  const getUserReaction = () => {
    if (!message.reactions) return null;
    
    for (const [emoji, users] of Object.entries(message.reactions)) {
      if (users.includes(authUser._id)) {
        return emoji;
      }
    }
    return null;
  };

  const userReaction = getUserReaction();

  // Generate menu position classes
  const getMenuPositionClasses = () => {
    if (menuPosition.left) return 'left-full ml-2';
    if (menuPosition.right) return 'right-full mr-2';
    // Default positioning for fallback
    return isOwnMessage ? 'right-0' : 'left-0';
  };

  // Calculate emoji picker position
  const getEmojiPickerPositionClasses = () => {
    if (isOwnMessage) {
      return 'bottom-full mb-2 right-0';
    } else {
      return 'bottom-full mb-2 left-0';
    }
  };

  return (
    <div className="relative flex items-center justify-center h-full">
      {/* 3-dot menu button */}
      <button 
        ref={buttonRef}
        onClick={() => {
          setShowMenu(!showMenu);
          setShowEmojiPicker(false); // Close emoji picker when opening menu
          setShowDeleteOptions(false); // Close delete options when opening menu
        }}
        className="p-0.5 rounded-full hover:bg-base-300/30 transition-colors text-base-content/60 flex items-center justify-center"
      >
        <MoreVertical size={12} />
      </button>

      {/* Options menu */}
      {showMenu && (
        <div 
          ref={menuRef}
          className={`absolute ${getMenuPositionClasses()} top-0 bg-gray-700 text-white shadow-lg rounded-lg py-0.5 z-20 border border-gray-600 w-36 text-xs`}
        >
          <button
            onClick={() => handleAction("reply")}
            className="flex items-center gap-1.5 w-full px-2 py-1.5 hover:bg-gray-600 text-left"
          >
            <Reply size={14} />
            <span>Reply</span>
          </button>

          <button
            onClick={() => handleAction("forward")}
            className="flex items-center gap-1.5 w-full px-2 py-1.5 hover:bg-gray-600 text-left"
          >
            <Forward size={14} />
            <span>Forward</span>
          </button>

          {/* Pin/Unpin option */}
          <button
            onClick={() => handleAction(message.isPinned ? "unpin" : "pin")}
            className="flex items-center gap-1.5 w-full px-2 py-1.5 hover:bg-gray-600 text-left"
          >
            <PinIcon size={14} className={message.isPinned ? "rotate-45" : ""} />
            <span>{message.isPinned ? "Unpin" : "Pin"}</span>
          </button>

          {isOwnMessage && (
            <>
              {canEdit() && (
                <button
                  onClick={() => handleAction("edit")}
                  className="flex items-center gap-1.5 w-full px-2 py-1.5 hover:bg-gray-600 text-left"
                >
                  <Edit size={14} />
                  <span>Edit</span>
                </button>
              )}

              <button
                onClick={() => handleAction("delete")}
                className="flex items-center gap-1.5 w-full px-2 py-1.5 hover:bg-gray-600 text-left text-red-400"
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
            </>
          )}

          <button
            data-reaction-button="true"
            onClick={() => handleAction("react")}
            className="flex items-center gap-1.5 w-full px-2 py-1.5 hover:bg-gray-600 text-left"
          >
            {userReaction ? (
              <>
                <span>{userReaction}</span>
                <span>Change Reaction</span>
              </>
            ) : (
              <>
                <SmileIcon size={14} />
                <span>React</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Emoji picker */}
      {showEmojiPicker && (
        <div 
          ref={emojiPickerRef}
          className={`absolute ${getEmojiPickerPositionClasses()} bg-gray-700 rounded-lg p-1.5 z-20 shadow-lg border border-gray-600`}
        >
          <div className="flex flex-wrap gap-1.5 max-w-[160px]">
            {EMOJI_OPTIONS.map(emoji => (
              <button 
                key={emoji} 
                onClick={() => handleReactionClick(emoji)}
                className="text-base hover:bg-gray-600 p-1 rounded-full transition-colors duration-200"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Delete options */}
      {showDeleteOptions && (
        <div 
          ref={deleteOptionsRef}
          className={`absolute ${getMenuPositionClasses()} top-0 bg-gray-700 text-white shadow-lg rounded-lg py-1.5 z-20 border border-gray-600 w-40 text-xs`}
        >
          <div className="px-2 py-1 text-xs font-medium border-b border-gray-600">Delete Message</div>
          
          <button
            onClick={() => handleDelete("me")}
            className="flex items-center gap-1.5 w-full px-2 py-1.5 hover:bg-gray-600 text-left"
          >
            <span>Delete for me</span>
          </button>
          
          <button
            onClick={() => handleDelete("everyone")}
            className="flex items-center gap-1.5 w-full px-2 py-1.5 hover:bg-gray-600 text-left text-red-400"
          >
            <span>Delete for everyone</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default MessageOptions; 