import { useState } from "react";
import { useGroupsContext } from "../context/GroupsContext";
import { useAuthStore } from "../store/useAuthStore";
import { 
  FaUsers, 
  FaUserPlus, 
  FaUserMinus, 
  FaEdit, 
  FaTrash, 
  FaUserShield, 
  FaUserCog 
} from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { formatDistanceToNow } from "date-fns";
import AddGroupMembersModal from "./AddGroupMembersModal";
import EditGroupModal from "./EditGroupModal";

const GroupInfo = ({ group, isOpen, onClose }) => {
  const { 
    leaveGroup, 
    deleteGroup, 
    promoteToAdmin, 
    demoteAdmin, 
    removeGroupMember, 
    isAdminOrCreator 
  } = useGroupsContext();
  
  const { authUser } = useAuthStore();
  const [isConfirmingAction, setIsConfirmingAction] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);

  if (!isOpen || !group) return null;

  const isCreator = group.creator._id === authUser._id;
  const isAdmin = group.admins.some(admin => admin._id === authUser._id);
  const canManageMembers = isCreator || isAdmin;

  const handleAction = async (action, memberId = null) => {
    if (
      action === "leave" || 
      action === "delete" || 
      (memberId && (action === "remove" || action === "promote" || action === "demote"))
    ) {
      setActionType(action);
      setSelectedMemberId(memberId);
      setIsConfirmingAction(true);
      return;
    }

    if (action === "addMembers") {
      setShowAddMembersModal(true);
      return;
    }

    if (action === "editGroup") {
      setShowEditGroupModal(true);
      return;
    }

    // Execute action directly
    try {
      switch (action) {
        case "confirmLeave":
          await leaveGroup(group._id);
          onClose();
          break;
        case "confirmDelete":
          await deleteGroup(group._id);
          onClose();
          break;
        case "confirmRemove":
          await removeGroupMember(group._id, selectedMemberId);
          break;
        case "confirmPromote":
          await promoteToAdmin(group._id, selectedMemberId);
          break;
        case "confirmDemote":
          await demoteAdmin(group._id, selectedMemberId);
          break;
        default:
          break;
      }
      setIsConfirmingAction(false);
      setActionType(null);
      setSelectedMemberId(null);
    } catch (error) {
      console.error("Error executing action:", error);
    }
  };

  const cancelAction = () => {
    setIsConfirmingAction(false);
    setActionType(null);
    setSelectedMemberId(null);
  };

  const renderConfirmation = () => {
    let title = "";
    let message = "";
    let confirmAction = "";

    switch (actionType) {
      case "leave":
        title = "Leave Group";
        message = "Are you sure you want to leave this group? You will no longer receive messages from this group.";
        confirmAction = "confirmLeave";
        break;
      case "delete":
        title = "Delete Group";
        message = "Are you sure you want to delete this group? This action cannot be undone and all messages will be lost.";
        confirmAction = "confirmDelete";
        break;
      case "remove":
        const memberName = group.members.find(m => m._id === selectedMemberId)?.fullName || "this member";
        title = "Remove Member";
        message = `Are you sure you want to remove ${memberName} from the group?`;
        confirmAction = "confirmRemove";
        break;
      case "promote":
        const promoteeName = group.members.find(m => m._id === selectedMemberId)?.fullName || "this member";
        title = "Promote to Admin";
        message = `Are you sure you want to promote ${promoteeName} to an admin? They will be able to manage members.`;
        confirmAction = "confirmPromote";
        break;
      case "demote":
        const demoteeName = group.admins.find(a => a._id === selectedMemberId)?.fullName || "this admin";
        title = "Demote Admin";
        message = `Are you sure you want to demote ${demoteeName} from admin role?`;
        confirmAction = "confirmDemote";
        break;
      default:
        break;
    }

    return (
      <div className="p-4 bg-base-200 rounded-lg mb-4">
        <h4 className="font-bold text-lg mb-2">{title}</h4>
        <p className="mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <button 
            className="btn btn-sm btn-ghost" 
            onClick={cancelAction}
          >
            Cancel
          </button>
          <button 
            className="btn btn-sm btn-error" 
            onClick={() => handleAction(confirmAction)}
          >
            Confirm
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
        <div className="bg-base-100 w-full max-w-md h-full overflow-y-auto">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold">Group Info</h2>
            <button 
              className="btn btn-ghost btn-sm btn-circle" 
              onClick={onClose}
            >
              <IoClose size={20} />
            </button>
          </div>

          <div className="p-4">
            {isConfirmingAction && renderConfirmation()}

            {/* Group details */}
            <div className="flex flex-col items-center mb-6">
              <img 
                src={group.profilePic || "/group-avatar.png"} 
                alt={group.name} 
                className="w-24 h-24 rounded-full object-cover mb-3"
              />
              <h3 className="text-xl font-bold">{group.name}</h3>
              <p className="text-sm text-gray-500 mb-2">
                Created {formatDistanceToNow(new Date(group.createdAt))} ago
              </p>
              {group.description && (
                <p className="text-center text-gray-600 max-w-xs">{group.description}</p>
              )}
            </div>

            {/* Group actions */}
            <div className="mb-6 flex flex-wrap justify-center gap-2">
              {isCreator && (
                <button 
                  className="btn btn-sm btn-error gap-2"
                  onClick={() => handleAction("delete")}
                >
                  <FaTrash size={14} />
                  Delete Group
                </button>
              )}
              
              {!isCreator && (
                <button 
                  className="btn btn-sm btn-outline gap-2"
                  onClick={() => handleAction("leave")}
                >
                  <FaUserMinus size={14} />
                  Leave Group
                </button>
              )}
              
              {canManageMembers && (
                <button 
                  className="btn btn-sm btn-outline gap-2"
                  onClick={() => handleAction("addMembers")}
                >
                  <FaUserPlus size={14} />
                  Add Members
                </button>
              )}
              
              {(isCreator || isAdmin) && (
                <button 
                  className="btn btn-sm btn-outline gap-2"
                  onClick={() => handleAction("editGroup")}
                >
                  <FaEdit size={14} />
                  Edit Group
                </button>
              )}
            </div>

            {/* Members list */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FaUsers size={18} />
                <h4 className="font-bold">Members ({group.members.length})</h4>
              </div>

              <div className="space-y-3">
                {/* Group creator */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-base-200">
                  <div className="flex items-center gap-3">
                    <img 
                      src={group.creator.profilePic || "/avatar.png"} 
                      alt={group.creator.fullName} 
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-medium">{group.creator.fullName}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <FaUserCog size={10} />
                        Group Creator
                      </div>
                    </div>
                  </div>
                </div>

                {/* Admins (excluding creator) */}
                {group.admins
                  .filter(admin => admin._id !== group.creator._id)
                  .map(admin => (
                    <div key={admin._id} className="flex items-center justify-between p-2 rounded-lg hover:bg-base-200">
                      <div className="flex items-center gap-3">
                        <img 
                          src={admin.profilePic || "/avatar.png"} 
                          alt={admin.fullName} 
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <div className="font-medium">{admin.fullName}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <FaUserShield size={10} />
                            Admin
                          </div>
                        </div>
                      </div>
                      
                      {isCreator && admin._id !== authUser._id && (
                        <button 
                          className="btn btn-ghost btn-xs text-error"
                          onClick={() => handleAction("demote", admin._id)}
                        >
                          Demote
                        </button>
                      )}
                    </div>
                  ))}

                {/* Regular members */}
                {group.members
                  .filter(member => 
                    member._id !== group.creator._id && 
                    !group.admins.some(admin => admin._id === member._id)
                  )
                  .map(member => (
                    <div key={member._id} className="flex items-center justify-between p-2 rounded-lg hover:bg-base-200">
                      <div className="flex items-center gap-3">
                        <img 
                          src={member.profilePic || "/avatar.png"} 
                          alt={member.fullName} 
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <div className="font-medium">{member.fullName}</div>
                          <div className="text-xs text-gray-500">Member</div>
                        </div>
                      </div>
                      
                      {canManageMembers && member._id !== authUser._id && (
                        <div className="flex gap-1">
                          {isCreator && (
                            <button 
                              className="btn btn-ghost btn-xs"
                              onClick={() => handleAction("promote", member._id)}
                            >
                              Promote
                            </button>
                          )}
                          <button 
                            className="btn btn-ghost btn-xs text-error"
                            onClick={() => handleAction("remove", member._id)}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Members Modal */}
      <AddGroupMembersModal 
        group={group}
        isOpen={showAddMembersModal} 
        onClose={() => setShowAddMembersModal(false)} 
      />

      {/* Edit Group Modal */}
      <EditGroupModal 
        group={group}
        isOpen={showEditGroupModal} 
        onClose={() => setShowEditGroupModal(false)} 
      />
    </>
  );
};

export default GroupInfo; 