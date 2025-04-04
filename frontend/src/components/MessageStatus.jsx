import React from 'react';
import { CheckIcon, CheckCheckIcon, Clock } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

const MessageStatus = ({ message }) => {
  const { onlineUsers } = useAuthStore();
  
  if (!message || message.senderId !== useAuthStore.getState().authUser?._id) {
    // Only show status for messages sent by current user
    return null;
  }

  // Simply display the status directly from the message object
  switch (message.status) {
    case 'seen':
      return (
        <div className="flex items-center text-blue-500" title="Seen">
          <CheckCheckIcon className="fill-blue-500" size={12} />
          <span className="text-[10px] ml-0.5">Seen</span>
        </div>
      );
    case 'delivered':
      return (
        <div className="flex items-center text-gray-500" title="Delivered">
          <CheckCheckIcon size={12} />
          <span className="text-[10px] ml-0.5">Delivered</span>
        </div>
      );
    case 'sent':
      return (
        <div className="flex items-center text-gray-400" title="Sent">
          <CheckIcon size={12} />
          <span className="text-[10px] ml-0.5">Sent</span>
        </div>
      );
    case 'sending':
      return (
        <div className="flex items-center text-gray-400" title="Sending...">
          <Clock size={12} />
          <span className="text-[10px] ml-0.5">Sending...</span>
        </div>
      );
    default:
      if (message.hasError) {
        return (
          <div className="flex items-center text-red-500" title="Failed to send">
            <span className="text-[10px]">Failed</span>
          </div>
        );
      }
      return (
        <div className="flex items-center text-gray-400" title="Sending...">
          <Clock size={12} />
          <span className="text-[10px] ml-0.5">Sending...</span>
        </div>
      );
  }
};

export default MessageStatus; 