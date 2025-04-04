import { useAuthStore } from "../../store/useAuthStore";
import { formatTimestamp } from "../../utils/formatTimestamp";
import MessageOptions from "./MessageOptions";
import MessageReactions from "./MessageReactions";
import ReplyMessage from "./ReplyMessage";

const Message = ({ message, selectedConversation }) => {
  const { authUser } = useAuthStore();
  const fromMe = message.senderId === authUser._id;
  const chatClassName = fromMe ? "chat-end" : "chat-start";
  const bubbleBgColor = fromMe ? "bg-blue-500" : "bg-gray-200";
  const bubbleTextColor = fromMe ? "text-white" : "text-gray-800";
  const formattedTimestamp = formatTimestamp(message.createdAt);
  const profilePic = fromMe ? authUser.profilePic : selectedConversation?.profilePic;
  const senderName = fromMe ? "You" : selectedConversation?.username;

  // Status indicators
  const renderStatusIndicator = () => {
    if (!fromMe) return null;

    if (message.status === "sent") {
      return (
        <div className="text-xs text-gray-500 flex items-center">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
          Sent
        </div>
      );
    } else if (message.status === "delivered") {
      return (
        <div className="text-xs text-gray-500 flex items-center">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          Delivered
        </div>
      );
    } else if (message.status === "seen") {
      return (
        <div className="text-xs text-blue-500 flex items-center">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
          </svg>
          Seen
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className={`chat ${chatClassName}`}>
      <div className="chat-image avatar">
        <div className="w-10 rounded-full">
          <img alt="User avatar" src={profilePic} />
        </div>
      </div>
      <div className="chat-header">
        {senderName}
        <time className="text-xs opacity-50 ml-1">{formattedTimestamp}</time>
        {message.isEdited && (
          <span className="text-xs opacity-50 ml-1">(edited)</span>
        )}
      </div>
      <div className="flex flex-col">
        {message.isReply && message.replyTo && (
          <ReplyMessage 
            replyData={message.replyTo} 
            senderName={message.senderId === message.replyTo.senderId ? "yourself" : selectedConversation?.username} 
          />
        )}
        <div className={`${bubbleBgColor} chat-bubble ${bubbleTextColor}`}>
          {message.text}
        </div>
      </div>
      
      {message.image && (
        <div className="chat-image mt-1">
          <img
            src={message.image}
            alt="Message attachment"
            className="rounded-md max-w-xs"
          />
        </div>
      )}
      
      {renderStatusIndicator()}
      
      <MessageOptions 
        message={message} 
        selectedConversation={selectedConversation} 
        fromMe={fromMe} 
      />
      
      {message.reactions && Object.entries(message.reactions).length > 0 && (
        <MessageReactions 
          reactions={message.reactions} 
          fromMe={fromMe}
        />
      )}
    </div>
  );
};

export default Message; 