import { useState, useRef, useEffect } from "react";
import { MoreVertical, Pin, Forward, Edit, Reply, Trash, Smile } from "lucide-react";
import toast from "react-hot-toast";
import { useOutsideClick } from "../../hooks/useOutsideClick";
import EmojiPicker from "./EmojiPicker";
import { useChatStore } from "../../store/useChatStore";
import { useAuthStore } from "../../store/useAuthStore";
import ForwardMessageModal from "../modals/ForwardMessageModal";

const MessageOptions = ({ message, selectedConversation, fromMe }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text || "");
  const [showForwardModal, setShowForwardModal] = useState(false);
  const dropdownRef = useRef();
  const emojiPickerRef = useRef();
  const editTextRef = useRef();
  
  const { setReplyTo, addReaction, editMessage, deleteMessage, pinMessage, unpinMessage } = useChatStore();
  const { authUser } = useAuthStore();
  
  useOutsideClick(dropdownRef, () => {
    if (showDropdown) setShowDropdown(false);
  });
  
  useOutsideClick(emojiPickerRef, () => {
    if (showEmojiPicker) setShowEmojiPicker(false);
  });
  
  useEffect(() => {
    if (isEditing && editTextRef.current) {
      editTextRef.current.focus();
    }
  }, [isEditing]);
  
  const handleDropdownClick = (e) => {
    e.stopPropagation();
    setShowDropdown(!showDropdown);
    setShowEmojiPicker(false);
  };
  
  const handleReactionClick = () => {
    setShowEmojiPicker(!showEmojiPicker);
    setShowDropdown(false);
  };
  
  const handleEmojiSelect = (emoji) => {
    addReaction(message._id, emoji);
    setShowEmojiPicker(false);
  };
  
  const handleReplyClick = () => {
    setReplyTo(message);
    setShowDropdown(false);
    toast.success("Replying to message");
  };

  const handleForwardClick = () => {
    setShowForwardModal(true);
    setShowDropdown(false);
  };
  
  const handlePinClick = () => {
    if (message.isPinned) {
      unpinMessage(message._id)
        .then(() => {
          toast.success("Message unpinned");
        })
        .catch((error) => {
          toast.error(error.message || "Failed to unpin message");
        });
    } else {
      pinMessage(message._id)
        .then(() => {
          toast.success("Message pinned");
        })
        .catch((error) => {
          toast.error(error.message || "Failed to pin message");
        });
    }
    setShowDropdown(false);
  };
  
  const handleEditClick = () => {
    // Only allow editing within 15 minutes
    const messageDate = new Date(message.createdAt);
    const currentDate = new Date();
    const timeDifference = (currentDate - messageDate) / (1000 * 60); // in minutes
    
    if (timeDifference > 15) {
      toast.error("Cannot edit messages older than 15 minutes");
      return;
    }
    
    setIsEditing(true);
    setShowDropdown(false);
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditText(message.text || "");
  };
  
  const handleSaveEdit = () => {
    if (editText.trim() === "") {
      toast.error("Message cannot be empty");
      return;
    }
    
    if (editText === message.text) {
      setIsEditing(false);
      return;
    }
    
    editMessage(message._id, editText)
      .then(() => {
        setIsEditing(false);
        toast.success("Message updated");
      })
      .catch((error) => {
        toast.error(error.message || "Failed to update message");
      });
  };
  
  const handleDeleteClick = (deleteType) => {
    deleteMessage(message._id, deleteType)
      .then(() => {
        toast.success(
          deleteType === "everyone" 
            ? "Message deleted for everyone" 
            : "Message deleted for you"
        );
      })
      .catch((error) => {
        toast.error(error.message || "Failed to delete message");
      });
    
    setShowDropdown(false);
  };
  
  const isMessageEditable = () => {
    if (!fromMe) return false;
    
    const messageDate = new Date(message.createdAt);
    const currentDate = new Date();
    const timeDifference = (currentDate - messageDate) / (1000 * 60); // in minutes
    
    return timeDifference <= 15;
  };
  
  // Check if message is recent enough to edit
  const canEdit = isMessageEditable();
  
  // Dropdown position class based on message sender
  const dropdownPositionClass = fromMe ? "right-0" : "left-0";
  
  if (isEditing) {
    return (
      <div className="mt-1 flex flex-col gap-2 w-full max-w-sm">
        <textarea
          ref={editTextRef}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          className="textarea textarea-bordered w-full resize-none text-sm"
          rows={2}
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <button onClick={handleCancelEdit} className="btn btn-sm btn-ghost">
            Cancel
          </button>
          <button onClick={handleSaveEdit} className="btn btn-sm btn-primary">
            Save
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <div className="relative inline-block">
        <button
          onClick={handleDropdownClick}
          className="p-1 rounded-full hover:bg-gray-700/20 transition-colors"
          aria-label="Message options"
        >
          <MoreVertical size={16} />
        </button>
        
        {showDropdown && (
          <div
            ref={dropdownRef}
            className={`absolute ${dropdownPositionClass} mt-1 z-10 bg-base-200 rounded-md shadow-lg p-2 w-48`}
          >
            <button
              onClick={handleReactionClick}
              className="w-full text-left px-4 py-2 text-sm hover:bg-base-300 rounded-md flex items-center"
            >
              <Smile className="w-4 h-4 mr-2" />
              React
            </button>
            
            <button
              onClick={handleReplyClick}
              className="w-full text-left px-4 py-2 text-sm hover:bg-base-300 rounded-md flex items-center"
            >
              <Reply className="w-4 h-4 mr-2" />
              Reply
            </button>
            
            {!message.isDeleted && (
              <button
                onClick={handleForwardClick}
                className="w-full text-left px-4 py-2 text-sm hover:bg-base-300 rounded-md flex items-center"
              >
                <Forward className="w-4 h-4 mr-2" />
                Forward
              </button>
            )}
            
            <button
              onClick={handlePinClick}
              className="w-full text-left px-4 py-2 text-sm hover:bg-base-300 rounded-md flex items-center"
            >
              <Pin className="w-4 h-4 mr-2" />
              {message.isPinned ? "Unpin Message" : "Pin Message"}
            </button>
            
            {fromMe && canEdit && !message.isDeleted && !message.isForwarded && (
              <button
                onClick={handleEditClick}
                className="w-full text-left px-4 py-2 text-sm hover:bg-base-300 rounded-md flex items-center"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </button>
            )}
            
            {fromMe && !message.isDeleted ? (
              <button
                onClick={() => handleDeleteClick("everyone")}
                className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-base-300 rounded-md flex items-center"
              >
                <Trash className="w-4 h-4 mr-2" />
                Delete for Everyone
              </button>
            ) : null}
            
            <button
              onClick={() => handleDeleteClick("me")}
              className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-base-300 rounded-md flex items-center"
            >
              <Trash className="w-4 h-4 mr-2" />
              Delete for Me
            </button>
          </div>
        )}
        
        {showEmojiPicker && (
          <div 
            ref={emojiPickerRef} 
            className={`absolute z-20 ${fromMe ? 'right-0' : 'left-0'} ${fromMe ? 'bottom-8' : 'top-8'}`}
            style={{ minWidth: '320px' }}
          >
            <EmojiPicker onEmojiSelect={handleEmojiSelect} showCloseButton={true} onClose={() => setShowEmojiPicker(false)} />
          </div>
        )}
      </div>
      
      {/* Forward Message Modal */}
      <ForwardMessageModal 
        isOpen={showForwardModal} 
        onClose={() => setShowForwardModal(false)} 
        message={message} 
      />
    </>
  );
};

export default MessageOptions; 