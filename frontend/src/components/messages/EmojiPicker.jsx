import React, { useState } from "react";
import { X, Plus } from "lucide-react";

const EmojiPicker = ({ onEmojiSelect, showCloseButton = false, onClose }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Initial set of emojis for compact view (single row)
  const initialEmojis = ["👍", "👎", "❤️", "😂", "😢", "🙏"];
  
  // Additional emojis to show when expanded
  const expandedEmojis = [
    "😮", "😡", "🎉", "👀", "🔥", "💯", "✅", "👏", 
    "😊", "🤔", "🥰", "😎", "🤣", "😍", "🤩", "😘", 
    "🙄", "😴", "🤐", "😷", "🤒", "🤕", "🤢", "🤮"
  ];

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="bg-base-200 rounded-lg shadow-lg p-3 border border-base-300">
      {showCloseButton && (
        <div className="flex justify-end mb-2">
          <button
            onClick={onClose}
            className="p-1 hover:bg-base-300 rounded-full"
            aria-label="Close emoji picker"
          >
            <X size={14} />
          </button>
        </div>
      )}
      
      {/* Single row of emojis */}
      <div className="flex items-center gap-3 mb-2">
        {initialEmojis.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onEmojiSelect(emoji)}
            className="w-10 h-10 flex items-center justify-center hover:bg-base-300 rounded-md transition-colors text-xl"
          >
            {emoji}
          </button>
        ))}
        
        <button
          onClick={toggleExpand}
          className="w-10 h-10 flex items-center justify-center hover:bg-base-300 rounded-md transition-colors"
          aria-label={isExpanded ? "Show fewer emojis" : "Show more emojis"}
        >
          <Plus size={20} />
        </button>
      </div>
      
      {/* Expanded emoji grid */}
      {isExpanded && (
        <div className="grid grid-cols-6 gap-2 pt-2 border-t border-base-300">
          {expandedEmojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onEmojiSelect(emoji)}
              className="w-8 h-8 flex items-center justify-center hover:bg-base-300 rounded-md transition-colors text-lg"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmojiPicker; 