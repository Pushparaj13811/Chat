import { useEffect, useState, useRef, useCallback } from "react";
import { useGroupsContext } from "../context/GroupsContext";
import { useAuthStore } from "../store/useAuthStore";
import GroupMessageInput from "./GroupMessageInput";
import MessageStatus from "./MessageStatus";
import { FaUsers, FaInfoCircle, FaRedoAlt, FaSearch, FaTrash, FaVolumeMute, FaVolumeUp, FaPaperclip, FaReply, FaForward, FaEdit, FaRegSmile } from "react-icons/fa";
import { BsPinAngle, BsThreeDotsVertical } from "react-icons/bs";
import { CgPoll } from "react-icons/cg";
import { format } from "date-fns";
import { Smile, Paperclip, Mic, Send, MoreVertical } from "lucide-react";
import MessageReactions from "./MessageReactions";
import { IoCheckmarkDone } from "react-icons/io5";
import GroupInfo from "./GroupInfo";
import toast from "react-hot-toast";

const GroupChatContainer = () => {
  const { 
    selectedGroup, 
    groupMessages, 
    isLoadingGroupMessages, 
    fetchGroupMessages,
    sendGroupMessage,
    isAdminOrCreator
  } = useGroupsContext();
  
  const { authUser } = useAuthStore();
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [activeMessageDropdown, setActiveMessageDropdown] = useState(null);
  const messagesEndRef = useRef(null);
  const dropdownRef = useRef(null);
  // Track if we've already fetched messages for this group
  const fetchedRef = useRef({});
  const retryCount = useRef(0);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      
      // Close message dropdowns when clicking outside
      if (activeMessageDropdown && !event.target.closest('.message-dropdown')) {
        setActiveMessageDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeMessageDropdown]);

  const handleFetchMessages = useCallback(async () => {
    if (!selectedGroup || isLoadingGroupMessages) return;
    
    setFetchError(false);
    try {
      await fetchGroupMessages(selectedGroup._id);
      // Reset retry count on success
      retryCount.current = 0;
    } catch (error) {
      setFetchError(true);
      console.error("Error fetching messages:", error);
      
      // Only retry a few times to avoid infinite loops
      if (retryCount.current < 3) {
        retryCount.current += 1;
        toast.error(`Failed to load messages (Attempt ${retryCount.current}/3)`);
      }
    }
  }, [selectedGroup, fetchGroupMessages, isLoadingGroupMessages]);

  // Fetch messages when selected group changes - use a ref to prevent duplicate fetches
  useEffect(() => {
    if (selectedGroup && !fetchedRef.current[selectedGroup._id] && !isLoadingGroupMessages) {
      fetchedRef.current[selectedGroup._id] = true;
      handleFetchMessages();
    }
  }, [selectedGroup, handleFetchMessages, isLoadingGroupMessages]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (selectedGroup) {
      scrollToBottom();
    }
  }, [groupMessages[selectedGroup?._id]]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (text = message, attachmentInfo = null) => {
    if ((!text || !text.trim()) && !attachmentInfo) return;
    
    try {
      const messageData = {
        text,
        ...(replyTo && { replyToId: replyTo._id }),
      };
      
      await sendGroupMessage(messageData, selectedGroup._id, attachmentInfo);
      setMessage("");
      setReplyTo(null);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const toggleGroupInfo = () => {
    setShowGroupInfo(prev => !prev);
  };

  const toggleDropdown = () => {
    setShowDropdown(prev => !prev);
  };

  const toggleMessageDropdown = (messageId) => {
    setActiveMessageDropdown(activeMessageDropdown === messageId ? null : messageId);
  };

  const handleAction = (action) => {
    setShowDropdown(false);
    
    switch (action) {
      case "search":
        toast("Search functionality coming soon");
        break;
      case "clearChat":
        toast("Clear chat functionality coming soon");
        break;
      case "toggleMute":
        setIsMuted(prev => !prev);
        toast.success(isMuted ? "Notifications enabled" : "Notifications muted");
        break;
      case "pinMessage":
        toast("Pinned messages functionality coming soon");
        break;
      case "attachFile":
        toast("Attachment functionality coming soon");
        break;
      case "CreatePoll":
         toast("Create poll fucntionality coming soon");
         break;
      default:
        break;
    }
  };

  const handleMessageAction = (action, msg) => {
    setActiveMessageDropdown(null);
    
    switch (action) {
      case "react":
        toast("Reaction options coming soon");
        break;
      case "reply":
        setReplyTo(msg);
        break;
      case "forward":
        toast("Forward message functionality coming soon");
        break;
      case "edit":
        if (msg.senderId._id !== authUser._id) {
          toast.error("You can only edit your own messages");
          return;
        }
        toast("Edit message functionality coming soon");
        break;
      case "pin":
        toast("Pin message functionality coming soon");
        break;
      case "deleteForMe":
        toast("Delete for me functionality coming soon");
        break;
      case "deleteForEveryone":
        if (msg.senderId._id !== authUser._id && !(selectedGroup && isAdminOrCreator && isAdminOrCreator(selectedGroup))) {
          toast.error("You can only delete your own messages or need admin rights");
          return;
        }
        toast("Delete for everyone functionality coming soon");
        break;
      default:
        break;
    }
  };

  if (!selectedGroup) return null;

  // Get messages for the current group
  const currentGroupMessages = groupMessages[selectedGroup._id] || [];

  return (
    <div className="flex flex-col h-full">
      {/* Group Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="w-12 h-12 rounded-full">
              <img
                src={selectedGroup.profilePic || "/group-avatar.png"}
                alt={selectedGroup.name}
                className="object-cover"
              />
            </div>
          </div>

          <div>
            <h3 className="font-medium text-lg">{selectedGroup.name}</h3>
            <div className="text-sm text-gray-500 flex items-center gap-1">
              <FaUsers className="text-xs" />
              <span>{selectedGroup.members.length} members</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            className="btn btn-ghost btn-circle"
            onClick={toggleGroupInfo}
            title="Group Info"
          >
            <FaInfoCircle size={20} />
          </button>
          
          <div className="relative" ref={dropdownRef}>
            <button 
              className="btn btn-ghost btn-circle"
              onClick={toggleDropdown}
              title="More Options"
            >
              <MoreVertical size={20} />
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-md shadow-lg bg-base-100 ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1">
                  <button
                    className="flex items-center gap-3 px-4 py-2 w-full text-left hover:bg-base-200 transition-colors"
                    onClick={() => handleAction("search")}
                  >
                    <FaSearch size={16} />
                    <span>Search in chat</span>
                  </button>
                  
                  <button
                    className="flex items-center gap-3 px-4 py-2 w-full text-left hover:bg-base-200 transition-colors"
                    onClick={() => handleAction("pinMessage")}
                  >
                    <BsPinAngle size={16} />
                    <span>Pinned messages</span>
                  </button>
                  
                  <button
                    className="flex items-center gap-3 px-4 py-2 w-full text-left hover:bg-base-200 transition-colors"
                    onClick={() => handleAction("attachFile")}
                  >
                    <FaPaperclip size={16} />
                    <span>Shared files</span>
                  </button>

                  <button
                    className="flex items-center gap-3 px-4 py-2 w-full text-left hover:bg-base-200 transition-colors"
                    onClick={() => handleAction("CreatePoll")}
                  >
                    <CgPoll size={16} />
                    <span>Create Poll</span>
                  </button>
                  
                  <button
                    className="flex items-center gap-3 px-4 py-2 w-full text-left hover:bg-base-200 transition-colors"
                    onClick={() => handleAction("toggleMute")}
                  >
                    {isMuted ? (
                      <>
                        <FaVolumeUp size={16} />
                        <span>Unmute notifications</span>
                      </>
                    ) : (
                      <>
                        <FaVolumeMute size={16} />
                        <span>Mute notifications</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    className="flex items-center gap-3 px-4 py-2 w-full text-left hover:bg-base-200 transition-colors text-error"
                    onClick={() => handleAction("clearChat")}
                  >
                    <FaTrash size={16} />
                    <span>Clear chat</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto bg-base-200">
        {isLoadingGroupMessages ? (
          <div className="flex justify-center items-center h-full">
            <span className="loading loading-spinner"></span>
          </div>
        ) : fetchError ? (
          <div className="flex flex-col justify-center items-center h-full">
            <div className="text-error mb-4">Failed to load messages</div>
            <button 
              className="btn btn-primary gap-2"
              onClick={handleFetchMessages}
            >
              <FaRedoAlt size={16} />
              Retry
            </button>
          </div>
        ) : (
          <>
            {currentGroupMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-2">
                <div className="bg-primary text-white p-3 rounded-full">
                  <FaUsers size={24} />
                </div>
                <p className="text-lg font-medium">No messages yet</p>
                <p className="text-sm text-base-content/70">
                  Start the conversation by sending a message!
                </p>
              </div>
            ) : (
              <>
                {currentGroupMessages.map((msg, index) => {
                  const isMyMessage = msg.senderId._id === authUser._id;
                  const showAvatar = 
                    index === 0 || 
                    currentGroupMessages[index - 1].senderId._id !== msg.senderId._id;
                  
                  return (
                    <div
                      key={msg._id}
                      className={`chat ${isMyMessage ? "chat-end" : "chat-start"} mb-2`}
                    >
                      {!isMyMessage && showAvatar && (
                        <div className="chat-image avatar">
                          <div className="w-10 rounded-full">
                            <img 
                              src={msg.senderId.profilePic || "/avatar.png"} 
                              alt={msg.senderId.fullName} 
                            />
                          </div>
                        </div>
                      )}
                      
                      <div className="chat-header mb-1 flex items-center gap-2">
                        {!isMyMessage && showAvatar && (
                          <span className="text-xs font-bold">
                            {msg.senderId.fullName}
                          </span>
                        )}
                        <time className="text-xs opacity-50">
                          {format(new Date(msg.createdAt), "p")}
                        </time>
                      </div>
                      
                      {msg.replyTo && (
                        <div className={`chat-bubble chat-bubble-${isMyMessage ? "accent" : "primary"} opacity-60 text-xs max-w-[200px] mb-1 py-1`}>
                          <div className="font-bold">
                            {msg.replyTo.senderId === authUser._id 
                              ? "You" 
                              : currentGroupMessages.find(m => m._id === msg.replyTo._id)?.senderId.fullName || "User"}
                          </div>
                          <div className="truncate">{msg.replyTo.text}</div>
                        </div>
                      )}
                      
                      <div className={`chat-bubble ${isMyMessage ? "chat-bubble-accent" : "chat-bubble-primary"} group relative`}>
                        {msg.text}
                        
                        {/* Message options (three dots) - positioned outside the bubble */}
                        <div className={`absolute ${isMyMessage ? '-left-6' : '-right-6'} top-2`}>
                          <button 
                            className="p-0.5 rounded-full hover:bg-base-300/30 transition-colors text-base-content/60 flex items-center justify-center message-dropdown"
                            onClick={() => toggleMessageDropdown(msg._id)}
                          >
                            <BsThreeDotsVertical size={12} />
                          </button>
                          
                          {activeMessageDropdown === msg._id && (
                            <div className="absolute top-0 mt-0 z-10 bg-gray-700 text-white shadow-lg rounded-lg py-0.5 border border-gray-600 w-36 text-xs message-dropdown"
                                 style={{ [isMyMessage ? 'right' : 'left']: '100%', marginLeft: isMyMessage ? '0' : '8px', marginRight: isMyMessage ? '8px' : '0' }}>
                              <div className="py-1">
                                <button
                                  className="flex items-center gap-1.5 w-full px-2 py-1.5 hover:bg-gray-600 text-left"
                                  onClick={() => handleMessageAction("react", msg)}
                                >
                                  <FaRegSmile size={14} />
                                  <span>React</span>
                                </button>
                                
                                <button
                                  className="flex items-center gap-1.5 w-full px-2 py-1.5 hover:bg-gray-600 text-left"
                                  onClick={() => handleMessageAction("reply", msg)}
                                >
                                  <FaReply size={14} />
                                  <span>Reply</span>
                                </button>
                                
                                <button
                                  className="flex items-center gap-1.5 w-full px-2 py-1.5 hover:bg-gray-600 text-left"
                                  onClick={() => handleMessageAction("forward", msg)}
                                >
                                  <FaForward size={14} />
                                  <span>Forward</span>
                                </button>
                                
                                {isMyMessage && (
                                  <button
                                    className="flex items-center gap-1.5 w-full px-2 py-1.5 hover:bg-gray-600 text-left"
                                    onClick={() => handleMessageAction("edit", msg)}
                                  >
                                    <FaEdit size={14} />
                                    <span>Edit</span>
                                  </button>
                                )}
                                
                                <button
                                  className="flex items-center gap-1.5 w-full px-2 py-1.5 hover:bg-gray-600 text-left"
                                  onClick={() => handleMessageAction("pin", msg)}
                                >
                                  <BsPinAngle size={14} />
                                  <span>Pin message</span>
                                </button>
                                
                                <button
                                  className="flex items-center gap-1.5 w-full px-2 py-1.5 hover:bg-gray-600 text-left"
                                  onClick={() => handleMessageAction("deleteForMe", msg)}
                                >
                                  <FaTrash size={14} />
                                  <span>Delete for me</span>
                                </button>
                                
                                {(isMyMessage || (selectedGroup && isAdminOrCreator && isAdminOrCreator(selectedGroup))) && (
                                  <button
                                    className="flex items-center gap-1.5 w-full px-2 py-1.5 hover:bg-gray-600 text-left text-red-400"
                                    onClick={() => handleMessageAction("deleteForEveryone", msg)}
                                  >
                                    <FaTrash size={14} />
                                    <span>Delete for everyone</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="chat-footer flex items-center gap-1 mt-1">
                        {isMyMessage && (
                          <div className="text-xs flex items-center">
                            <IoCheckmarkDone 
                              className={`${
                                msg.readBy.length > 1 
                                  ? "text-blue-500" 
                                  : "text-gray-500"
                              }`} 
                              size={16} 
                            />
                          </div>
                        )}
                        
                        {Object.keys(msg.reactions || {}).length > 0 && (
                          <MessageReactions reactions={msg.reactions} className="ml-2" />
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </>
        )}
      </div>

      {/* Message Input */}
      <GroupMessageInput
        message={message}
        setMessage={setMessage}
        handleSendMessage={handleSendMessage}
        placeholder="Type a message..."
        replyTo={replyTo}
        setReplyTo={setReplyTo}
        disabled={fetchError}
      />

      {/* Group Info Sidebar */}
      <GroupInfo 
        group={selectedGroup} 
        isOpen={showGroupInfo} 
        onClose={() => setShowGroupInfo(false)} 
      />
    </div>
  );
};

export default GroupChatContainer; 