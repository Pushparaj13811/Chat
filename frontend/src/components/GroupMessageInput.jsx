import { useState, useRef } from "react";
import { Send, MessageSquare, X } from "lucide-react";
import toast from "react-hot-toast";

const GroupMessageInput = ({
  message,
  setMessage,
  handleSendMessage,
  placeholder = "Type a message...",
  replyTo,
  setReplyTo,
  disabled = false
}) => {
  const [attachment, setAttachment] = useState(null);
  const [attachmentType, setAttachmentType] = useState(null);
  const fileInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (disabled) return;
    
    if ((!message || !message.trim()) && !attachment) {
      return;
    }
    
    try {
      await handleSendMessage(
        message,
        attachment ? { file: attachment, type: attachmentType } : null
      );
      
      // Reset form
      setMessage("");
      setAttachment(null);
      setAttachmentType(null);
      
      if (replyTo) {
        setReplyTo(null);
      }
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error sending group message:", error);
      toast.error("Failed to send message");
    }
  };

  return (
    <div className={`px-4 py-3 bg-base-100 border-t ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
      {/* Reply indicator */}
      {replyTo && (
        <div className="flex items-center justify-between bg-base-200 p-2 rounded mb-2">
          <div className="flex items-center">
            <MessageSquare size={16} className="mr-2" />
            <div className="text-sm truncate">
              <span className="font-medium">Reply to:</span>{" "}
              {replyTo.text}
            </div>
          </div>
          <button 
            className="btn btn-ghost btn-xs btn-circle"
            onClick={() => setReplyTo(null)}
          >
            <X size={14} />
          </button>
        </div>
      )}
      
      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        {/* Text Input */}
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={placeholder}
          className="input flex-1 bg-base-200"
          disabled={disabled}
        />
        
        {/* Send Button */}
        <button 
          type="submit" 
          className="btn btn-circle btn-primary"
          disabled={(!message || !message.trim()) && !attachment || disabled}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default GroupMessageInput; 