import { useState, useEffect } from "react";
import { useGroupsContext } from "../context/GroupsContext";
import { useChatStore } from "../store/useChatStore";
import { FaUsers, FaUserPlus, FaTimes, FaCamera } from "react-icons/fa";
import toast from "react-hot-toast";

const CreateGroupModal = ({ isOpen, onClose }) => {
  const { createGroup } = useGroupsContext();
  const { users, getUsers, isUsersLoading } = useChatStore();
  
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [profilePic, setProfilePic] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (isOpen && users.length === 0) {
      getUsers();
    }
  }, [isOpen, getUsers, users.length]);

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePic(file);
      const reader = new FileReader();
      reader.onload = () => {
        setProfilePicPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectMember = (userId) => {
    setSelectedMembers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!groupName.trim()) {
      toast.error("Group name is required");
      return;
    }
    
    if (selectedMembers.length === 0) {
      toast.error("Please select at least one member");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const groupData = {
        name: groupName.trim(),
        description: description.trim(),
        members: selectedMembers
      };
      
      const result = await createGroup(groupData, profilePic);
      if (result) {
        resetForm();
        onClose();
      }
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("Failed to create group");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setGroupName("");
    setDescription("");
    setSelectedMembers([]);
    setProfilePic(null);
    setProfilePicPreview(null);
    setSearchTerm("");
  };

  if (!isOpen) return null;

  const filteredUsers = users.filter(user => 
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-base-100 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FaUsers /> Create New Group
          </h2>
          <button 
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <FaTimes size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Group Profile Picture */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-base-300 flex items-center justify-center">
                {profilePicPreview ? (
                  <img 
                    src={profilePicPreview} 
                    alt="Group profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FaUsers size={40} className="text-gray-500" />
                )}
              </div>
              <label 
                htmlFor="group-profile-pic" 
                className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer"
              >
                <FaCamera size={14} />
              </label>
              <input 
                type="file" 
                id="group-profile-pic" 
                accept="image/*" 
                className="hidden" 
                onChange={handleProfilePicChange}
              />
            </div>
          </div>

          {/* Group Name */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-medium">Group Name*</span>
            </label>
            <input 
              type="text" 
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="input input-bordered" 
              placeholder="Enter group name"
              required
            />
          </div>

          {/* Group Description */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-medium">Description (optional)</span>
            </label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="textarea textarea-bordered" 
              placeholder="What's this group about?"
              rows={3}
            />
          </div>

          {/* Members Selection */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-medium">Add Members*</span>
            </label>
            
            <div className="input-group mb-2">
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-bordered flex-1" 
                placeholder="Search users"
              />
              <span className="btn btn-square btn-primary">
                <FaUserPlus />
              </span>
            </div>
            
            {selectedMembers.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedMembers.map(userId => {
                  const user = users.find(u => u._id === userId);
                  if (!user) return null;
                  
                  return (
                    <div 
                      key={userId}
                      className="badge badge-primary gap-1 p-3"
                    >
                      <span>{user.fullName}</span>
                      <button 
                        type="button"
                        onClick={() => handleSelectMember(userId)}
                        className="btn-ghost rounded-full p-1"
                      >
                        <FaTimes size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            
            <div className="bg-base-200 rounded-lg max-h-48 overflow-y-auto">
              {isUsersLoading ? (
                <div className="flex justify-center items-center p-4">
                  <span className="loading loading-spinner"></span>
                </div>
              ) : filteredUsers.length > 0 ? (
                <ul className="menu p-0">
                  {filteredUsers.map(user => (
                    <li key={user._id}>
                      <div 
                        className={`flex items-center py-2 px-3 ${
                          selectedMembers.includes(user._id) ? "bg-base-300" : ""
                        }`}
                        onClick={() => handleSelectMember(user._id)}
                      >
                        <div className="avatar mr-2">
                          <div className="w-8 rounded-full">
                            <img 
                              src={user.profilePic || "/avatar.png"} 
                              alt={user.fullName} 
                            />
                          </div>
                        </div>
                        <div className="flex-1">{user.fullName}</div>
                        <input 
                          type="checkbox" 
                          className="checkbox checkbox-primary" 
                          checked={selectedMembers.includes(user._id)}
                          readOnly
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  {searchTerm ? "No users match your search" : "No users available"}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button 
              type="button"
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="btn btn-ghost"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isSubmitting || !groupName.trim() || selectedMembers.length === 0}
            >
              {isSubmitting ? <span className="loading loading-spinner"></span> : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal; 