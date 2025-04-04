import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState, useCallback } from "react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import MessageReactions from "./MessageReactions";
import MessageOptions from "./messages/MessageOptions";
import ReplyMessage from "./messages/ReplyMessage";
import VoiceMessage from "./VoiceMessage";
import { File, Forward } from "lucide-react";
import MessageStatus from "./MessageStatus";
import PinnedMessages from "./PinnedMessages";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    replyTo,
    markMessageAsSeen,
    getPinnedMessages,
    pinnedMessages,
    isUserTyping
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const [chatInFocus, setChatInFocus] = useState(false);
  const observedMessagesRef = useRef(new Set());

  useEffect(() => {
    if (selectedUser?._id) {
      getMessages(selectedUser._id);
      getPinnedMessages(selectedUser._id);
    }

    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [selectedUser?._id, getMessages, getPinnedMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Track when the chat is in focus 
  useEffect(() => {
    const handleVisibilityChange = () => {
      setChatInFocus(!document.hidden);
    };

    const handleFocus = () => setChatInFocus(true);
    const handleBlur = () => setChatInFocus(false);

    // Initial focus state
    setChatInFocus(document.hasFocus() && !document.hidden);

    // Add event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  // Mark messages as seen when in focus
  useEffect(() => {
    // Don't try to mark messages as seen if not in focus or no selected user
    if (!chatInFocus || !selectedUser || !messages.length) return;

    // Get messages from the selected user that are unread (not marked as seen yet)
    const unreadMessages = messages.filter(
      (msg) => msg.senderId === selectedUser._id && msg.status !== "seen"
    );
    
    // If we have unread messages, mark them as seen after a delay
    if (unreadMessages.length > 0) {
      const timeoutId = setTimeout(() => {
        try {
          // Only mark the LAST unread message as seen - this will automatically mark all previous messages
          const lastUnreadMessage = unreadMessages[unreadMessages.length - 1];
          if (lastUnreadMessage && lastUnreadMessage._id) {
            console.log(`Marking message ${lastUnreadMessage._id} as seen`);
            markMessageAsSeen(lastUnreadMessage._id);
          }
        } catch (error) {
          console.error("Error in marking message as seen:", error);
        }
      }, 2000); // Longer delay to ensure proper sequence
      
      return () => clearTimeout(timeoutId);
    }
  }, [chatInFocus, selectedUser, messages, markMessageAsSeen]);

  // Helper function to check if an element is in the viewport
  const isElementInViewport = (el) => {
    if (!el) return false;
    
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  };

  if (!selectedUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">Select a conversation to start chatting</p>
      </div>
    );
  }

  // Sort messages chronologically by creation time
  const sortedMessages = [...messages].sort((a, b) => {
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  return (
    <div className="flex flex-col h-full w-full">
      <ChatHeader />
      
      {pinnedMessages?.length > 0 && <PinnedMessages />}
      
      <div className="flex-1 overflow-auto px-4 md:px-6 py-2">
        {isMessagesLoading ? (
          <div className="space-y-4">
            <MessageSkeleton />
            <MessageSkeleton />
            <MessageSkeleton />
          </div>
        ) : (
          <div className="space-y-4 max-w-4xl mx-auto">
            {sortedMessages.map((message, index) => {
              const isOwnMessage = message.senderId === authUser._id;
              const isLastMessage = index === sortedMessages.length - 1;
              
              return (
                <div 
                  key={message._id} 
                  className={`chat ${isOwnMessage ? 'chat-end' : 'chat-start'}`}
                  ref={isLastMessage ? messageEndRef : null}
                >
                  <div className="chat-image avatar">
                    <div className="w-10 rounded-full">
                      <img 
                        src={isOwnMessage ? authUser?.profilePic || "/avatar.png" : selectedUser?.profilePic || "/avatar.png"} 
                        alt="Avatar" 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/avatar.png";
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="chat-header">
                    {isOwnMessage ? 'You' : selectedUser?.fullName}
                    <time className="text-xs opacity-50 ml-1">
                      {formatMessageTime(message.createdAt)}
                    </time>
                    {message.isEdited && (
                      <span className="text-xs opacity-50 ml-1">(edited)</span>
                    )}
                  </div>
                  
                  <div 
                    id={`message-${message._id}`}
                    className="chat-bubble-container relative"
                  >
                    {/* If message is a reply, show reference to original message */}
                    {message.isReply && message.replyTo && (
                      <ReplyMessage message={message} />
                    )}
                    
                    <div className={`chat-bubble flex flex-col gap-1 ${
                      message.isDeleted ? 'bg-base-300 text-base-content/70' : ''
                    }`}>
                      {/* Forwarded message indicator with original sender */}
                      {message.isForwarded && (
                        <div className="text-xs opacity-60 flex items-center mb-1">
                          <Forward size={12} className="mr-1" />
                          {message.originalSenderName 
                            ? `Forwarded message from ${message.originalSenderName}` 
                            : (isOwnMessage ? 'Forwarded by you' : `Forwarded by ${selectedUser?.fullName}`)}
                        </div>
                      )}
                      
                      {message.isDeleted ? (
                        <span className="italic">This message was deleted</span>
                      ) : (
                        <>
                          {/* Regular message content */}
                          {message.text && <div className="whitespace-pre-wrap">{message.text}</div>}
                          
                          {/* Image attachment */}
                          {message.image && (
                            <div className="mb-1">
                              <img 
                                src={message.image} 
                                alt="Attachment" 
                                className="rounded-md max-w-60 max-h-60 object-contain" 
                              />
                            </div>
                          )}
                          
                          {/* Voice message */}
                          {message.type === 'voice' && (
                            <VoiceMessage message={message} />
                          )}
                          
                          {/* Document attachment */}
                          {message.type === 'document' && (
                            <a 
                              href={message.attachment} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center text-primary hover:underline"
                            >
                              <File size={16} className="mr-2" />
                              {message.fileName || "Document"}
                            </a>
                          )}
                        </>
                      )}
                    </div>
                    
                    {/* Status indicator */}
                    <div className="flex justify-end mt-1">
                      {isOwnMessage && <MessageStatus message={message} />}
                    </div>
                    
                    {/* Message reactions */}
                    {message.reactions && Object.keys(message.reactions).length > 0 && (
                      <div className={`absolute ${isOwnMessage ? 'right-2' : 'left-2'} -bottom-2`}>
                        <MessageReactions message={message} isOwnMessage={isOwnMessage} />
                      </div>
                    )}
                    
                    {/* Message options (three dots) */}
                    <div className={`absolute ${isOwnMessage ? '-left-6' : '-right-6'} top-2`}>
                      <MessageOptions message={message} fromMe={isOwnMessage} />
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Typing indicator */}
            {isUserTyping && (
              <div className="chat chat-start">
                <div className="chat-image avatar">
                  <div className="w-10 rounded-full">
                    <img 
                      src={selectedUser?.profilePic || "/avatar.png"} 
                      alt="Avatar" 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/avatar.png";
                      }}
                    />
                  </div>
                </div>
                <div className="chat-header">
                  {selectedUser?.fullName}
                </div>
                <div className="chat-bubble bg-base-300 text-base-content min-h-0 py-2 px-4">
                  <div className="flex items-center gap-1">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <span className="text-xs opacity-70">typing...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div id="message-end-anchor" ref={messageEndRef} />
          </div>
        )}
      </div>
      
      <MessageInput />
    </div>
  );
};

export default ChatContainer;
