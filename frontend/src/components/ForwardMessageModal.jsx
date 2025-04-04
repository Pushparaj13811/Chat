import { useState, useEffect } from "react";
import { SearchIcon, X, ArrowRight, Check } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";

const ForwardMessageModal = ({ isOpen, onClose, message }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isForwarding, setIsForwarding] = useState(false);
  const { users, getUsers, forwardMessage } = useChatStore();
  const { authUser } = useAuthStore();
  
  useEffect(() => {
    if (isOpen) {
      getUsers();
      setSearchQuery("");
      setSelectedUsers([]);
      setIsForwarding(false);
    }
  }, [isOpen, getUsers]);
  
  if (!isOpen) return null;
  
  const filteredUsers = users.filter(user => {
    // Exclude the current user
    if (user._id === authUser._id) return false;
    
    // If no search query, show all users
    if (!searchQuery.trim()) return true;
    
    // Search by fullName or email
    const query = searchQuery.toLowerCase();
    return (
      (user.fullName && user.fullName.toLowerCase().includes(query)) || 
      (user.email && user.email.toLowerCase().includes(query))
    );
  });
  
  const toggleUserSelection = (user) => {
    const isSelected = selectedUsers.some(u => u._id === user._id);
    
    if (isSelected) {
      setSelectedUsers(selectedUsers.filter(u => u._id !== user._id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };
  
  const handleForward = async () => {
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one recipient");
      return;
    }
    
    setIsForwarding(true);
    
    try {
      // Forward the message to all selected users
      const promises = selectedUsers.map(user => 
        forwardMessage(message._id, user._id)
      );
      
      await Promise.all(promises);
      onClose();
      toast.success(`Message forwarded to ${selectedUsers.length} recipient${selectedUsers.length > 1 ? 's' : ''}`);
    } catch (error) {
      console.error("Error forwarding message:", error);
      toast.error("Failed to forward message");
    } finally {
      setIsForwarding(false);
    }
  };
  
  // Format message preview to show in modal
  const getMessagePreview = () => {
    if (!message) return "";
    
    if (message.isDeleted) {
      return "This message was deleted";
    }
    
    if (message.type === 'voice') {
      return "Voice message";
    }
    
    if (message.type === 'document') {
      return message.fileName || "Document";
    }
    
    if (message.image && !message.text) {
      return "Photo";
    }
    
    return message.text || "";
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-base-300 rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="p-4 border-b border-base-content/10 flex justify-between items-center">
          <h3 className="text-lg font-medium">Forward Message</h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-base-100"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Message preview with sender info */}
        <div className="p-4 border-b border-base-content/10 bg-base-200">
          <div className="text-sm opacity-70 mb-1">Message</div>
          {message && message.senderId && (
            <div className="flex items-center mb-2">
              <div className="avatar mr-2">
                <div className="w-6 h-6 rounded-full">
                  <img 
                    src={message.senderId === authUser._id ? authUser.profilePic : "default-avatar.jpg"} 
                    alt="Sender" 
                  />
                </div>
              </div>
              <div className="text-xs text-base-content/70">
                From: {message.senderId === authUser._id ? "You" : (message.senderName || "User")}
              </div>
            </div>
          )}
          <div className="font-medium truncate max-w-full">
            {getMessagePreview()}
          </div>
          {message && message.image && (
            <div className="mt-2 h-16 w-16 overflow-hidden rounded-md">
              <img 
                src={message.image} 
                alt="Attachment" 
                className="h-full w-full object-cover"
              />
            </div>
          )}
        </div>
        
        {/* Search */}
        <div className="p-4 border-b border-base-content/10">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-bordered w-full pr-10"
            />
            <SearchIcon size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40" />
          </div>
        </div>
        
        {/* Selected users */}
        {selectedUsers.length > 0 && (
          <div className="p-2 flex flex-wrap gap-2 border-b border-base-content/10 bg-base-200">
            {selectedUsers.map(user => (
              <div key={user._id} className="badge badge-primary gap-1 p-3">
                {user.fullName}
                <button 
                  onClick={() => toggleUserSelection(user)}
                  className="ml-1"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* User list with count */}
        <div className="max-h-64 overflow-y-auto">
          <div className="p-2 bg-base-200 text-xs font-medium">
            {filteredUsers.length} contact{filteredUsers.length !== 1 ? 's' : ''} found
          </div>
          
          {filteredUsers.length === 0 ? (
            <div className="p-4 text-center text-base-content/60">
              No contacts match your search
            </div>
          ) : (
            <div className="divide-y divide-base-content/10">
              {filteredUsers.map(user => {
                const isSelected = selectedUsers.some(u => u._id === user._id);
                
                return (
                  <div 
                    key={user._id}
                    onClick={() => toggleUserSelection(user)}
                    className="p-3 flex items-center cursor-pointer hover:bg-base-200"
                  >
                    {/* Checkbox */}
                    <div className="mr-3">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center ${isSelected ? 'bg-primary text-primary-content' : 'border border-gray-400'}`}>
                        {isSelected && <Check size={14} />}
                      </div>
                    </div>
                    
                    {/* Avatar */}
                    <div className="avatar">
                      <div className="w-12 h-12 rounded-full">
                        <img 
                          src={user.profilePic} 
                          alt={user.fullName || "User"}
                          className="w-full h-full object-cover rounded-full" 
                        />
                      </div>
                    </div>
                    
                    {/* User details */}
                    <div className="ml-3 flex-1">
                      <div className="font-medium">{user.fullName || "User"}</div>
                      {user.email && (
                        <div className="text-xs text-base-content/60 truncate max-w-[180px]">
                          {user.email}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Forward button */}
        <div className="p-4 flex justify-end border-t border-base-content/10">
          <button 
            onClick={handleForward}
            disabled={selectedUsers.length === 0 || isForwarding}
            className="btn btn-primary"
          >
            {isForwarding ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <>
                Forward <ArrowRight size={16} className="ml-1" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForwardMessageModal; 