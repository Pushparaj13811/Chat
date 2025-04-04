import { useState, useEffect } from "react";
import { useGroupsContext } from "../context/GroupsContext";
import { FaEdit, FaTimes, FaCamera } from "react-icons/fa";
import toast from "react-hot-toast";

const EditGroupModal = ({ group, isOpen, onClose }) => {
  const { updateGroup } = useGroupsContext();
  
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize form with group data when modal is opened
  useEffect(() => {
    if (isOpen && group) {
      setGroupName(group.name || "");
      setDescription(group.description || "");
      setProfilePicPreview(group.profilePic || null);
      setProfilePic(null);
    }
  }, [isOpen, group]);
  
  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }
      
      setProfilePic(file);
      const reader = new FileReader();
      reader.onload = () => {
        setProfilePicPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!groupName.trim()) {
      toast.error("Group name is required");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const updateData = {
        name: groupName.trim(),
        description: description.trim()
      };
      
      await updateGroup(group._id, updateData, profilePic);
      toast.success("Group updated successfully");
      onClose();
    } catch (error) {
      console.error("Failed to update group:", error);
      toast.error("Failed to update group");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-base-100 rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FaEdit /> Edit Group
          </h2>
          <button 
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <FaTimes size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          {/* Group Profile Picture */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-base-300 flex items-center justify-center">
                {profilePicPreview ? (
                  <img 
                    src={profilePicPreview} 
                    alt="Group profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl">
                    {groupName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <label 
                htmlFor="edit-group-profile-pic" 
                className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer"
              >
                <FaCamera size={14} />
              </label>
              <input 
                type="file" 
                id="edit-group-profile-pic" 
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
          
          <div className="flex justify-end gap-2 mt-6">
            <button 
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isSubmitting || !groupName.trim()}
            >
              {isSubmitting ? <span className="loading loading-spinner"></span> : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditGroupModal; 