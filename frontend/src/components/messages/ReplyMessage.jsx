import { useAuthStore } from "../../store/useAuthStore";
import { useChatStore } from "../../store/useChatStore";

const ReplyMessage = ({ message }) => {
  const { authUser } = useAuthStore();
  const { selectedUser } = useChatStore();
  
  // Extract replyTo data
  const replyData = message.replyTo;
  
  // If replyData is undefined or doesn't have required properties, don't render
  if (!replyData || typeof replyData !== 'object') {
    return null;
  }
  
  const isOwnReply = replyData.senderId === authUser._id;
  
  // Determine the appropriate content based on message type
  const getReplyContent = () => {
    if (replyData.isDeleted) {
      return "This message was deleted";
    }
    
    if (replyData.type === "image" || replyData.image) {
      return "📷 Image";
    } else if (replyData.type === "voice") {
      return "🎤 Voice message";
    } else if (replyData.type === "document") {
      return `📄 ${replyData.fileName || "Document"}`;
    } else {
      // Text message - truncate if too long
      let text = replyData.text || "";
      if (text.length > 40) {
        text = text.substring(0, 40) + "...";
      }
      return text;
    }
  };

  return (
    <div className="flex flex-col mb-1 mt-1 max-w-full">
      <div className="flex items-center text-xs text-gray-400 mb-1">
        <div className="mr-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path>
          </svg>
        </div>
        <span className="truncate">
          Replying to {isOwnReply ? "yourself" : (selectedUser?.fullName || "user")}
        </span>
      </div>
      <div className="bg-gray-600 p-2 rounded-md text-sm text-gray-200 max-w-[95%] truncate">
        {getReplyContent()}
      </div>
    </div>
  );
};

export default ReplyMessage; 