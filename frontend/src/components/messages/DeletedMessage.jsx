import { useAuthStore } from "../../store/useAuthStore";
import { formatTimestamp } from "../../utils/formatTimestamp";

const DeletedMessage = ({ message, selectedConversation }) => {
  const { authUser } = useAuthStore();
  const fromMe = message.senderId === authUser._id;
  const chatClassName = fromMe ? "chat-end" : "chat-start";
  const profilePic = fromMe ? authUser.profilePic : selectedConversation?.profilePic;
  const senderName = fromMe ? "You" : selectedConversation?.username;
  const formattedTimestamp = formatTimestamp(message.createdAt);

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
      </div>
      <div className="chat-bubble bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 italic">
        This message was deleted
      </div>
    </div>
  );
};

export default DeletedMessage; 