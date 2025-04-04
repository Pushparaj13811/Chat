import { useState, useEffect } from "react";
import { useGroupsContext } from "../../context/GroupsContext";
import { useMessagesContext } from "../../context/MessagesContext";
import { IoMdClose } from "react-icons/io";
import { FaPlus, FaUserCircle, FaCamera } from "react-icons/fa";

const CreateGroupModal = ({ isOpen, onClose }) => {
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [profilePic, setProfilePic] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { createGroup } = useGroupsContext();
  const { conversations } = useMessagesContext();

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setGroupName("");
    setDescription("");
    setSelectedMembers([]);
    setProfilePic(null);
    setProfilePicPreview("");
    setIsCreating(false);
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePic(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleMemberSelection = (userId) => {
    if (selectedMembers.includes(userId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== userId));
    } else {
      setSelectedMembers([...selectedMembers, userId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    
    setIsCreating(true);
    
    try {
      const groupData = {
        name: groupName.trim(),
        description: description.trim(),
        members: selectedMembers
      };
      
      const newGroup = await createGroup(groupData, profilePic);
      if (newGroup) {
        onClose();
      }
    } catch (error) {
      console.error("Error creating group:", error);
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold dark:text-white">Create New Group</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <IoMdClose size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          {/* Group profile pic upload */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              {profilePicPreview ? (
                <img
                  src={profilePicPreview}
                  alt="Group profile"
                  className="w-24 h-24 rounded-full object-cover border dark:border-gray-700"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <FaUserCircle size={40} className="text-gray-400" />
                </div>
              )}
              <label
                htmlFor="group-profile-pic"
                className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full cursor-pointer"
              >
                <FaCamera size={14} />
              </label>
              <input
                id="group-profile-pic"
                type="file"
                accept="image/*"
                onChange={handleProfilePicChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Group name */}
          <div className="mb-4">
            <label
              htmlFor="group-name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Group Name*
            </label>
            <input
              id="group-name"
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Enter group name"
              required
            />
          </div>

          {/* Group description */}
          <div className="mb-4">
            <label
              htmlFor="group-description"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Description
            </label>
            <textarea
              id="group-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Enter group description"
              rows={3}
            />
          </div>

          {/* Member selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Add Members
            </label>
            <div className="max-h-40 overflow-y-auto border rounded-md dark:border-gray-700 p-2">
              {conversations.length > 0 ? (
                conversations.map((conversation) => (
                  <div
                    key={conversation._id}
                    className={`flex items-center justify-between p-2 rounded-md mb-1 cursor-pointer ${
                      selectedMembers.includes(conversation._id)
                        ? "bg-blue-100 dark:bg-blue-900"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                    onClick={() => toggleMemberSelection(conversation._id)}
                  >
                    <div className="flex items-center">
                      <img
                        src={conversation.profilePic || "/default-avatar.png"}
                        alt={conversation.fullName}
                        className="w-10 h-10 rounded-full object-cover mr-3"
                      />
                      <span className="font-medium dark:text-white">
                        {conversation.fullName}
                      </span>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        selectedMembers.includes(conversation._id)
                          ? "bg-blue-500 text-white"
                          : "border-2 border-gray-400"
                      }`}
                    >
                      {selectedMembers.includes(conversation._id) && (
                        <FaPlus className="transform rotate-45" size={12} />
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-2">
                  No contacts available
                </p>
              )}
            </div>
          </div>

          {/* Submit button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md mr-2 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
              disabled={!groupName.trim() || isCreating}
            >
              {isCreating ? "Creating..." : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal; 