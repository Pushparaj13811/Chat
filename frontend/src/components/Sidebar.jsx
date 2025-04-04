import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useGroupsContext } from "../context/GroupsContext";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, UsersRound, Plus } from "lucide-react";
import CreateGroupModal from "./CreateGroupModal";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();
  const { groups, selectedGroup, setSelectedGroup, isLoadingGroups } = useGroupsContext();
  const { onlineUsers } = useAuthStore();
  
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [activeTab, setActiveTab] = useState("chats"); // "chats" or "groups"
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  // Add a safety check for users array and improve filtering logic
  const filteredUsers = Array.isArray(users) ? 
    users.filter(user => !showOnlineOnly || (Array.isArray(onlineUsers) && onlineUsers.includes(user._id))) 
    : [];

  // Reset selected entities when switching tabs
  const handleTabChange = (tab) => {
    if (tab === "chats") {
      setSelectedGroup(null);
    } else {
      setSelectedUser(null);
    }
    setActiveTab(tab);
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setSelectedGroup(null);
  };

  const handleSelectGroup = (group) => {
    setSelectedGroup(group);
    setSelectedUser(null);
  };

  if (isUsersLoading || isLoadingGroups) return <SidebarSkeleton />;

  return (
    <>
      <aside className="h-full w-20 lg:w-64 border-r border-base-300 flex flex-col transition-all duration-200">
        {/* Tabs for chats and groups */}
        <div className="border-b border-base-300 w-full">
          <div className="flex">
            <button 
              className={`flex-1 py-3 px-2 flex items-center justify-center lg:justify-start gap-2 ${
                activeTab === "chats" ? "bg-base-300" : "hover:bg-base-200"
              }`}
              onClick={() => handleTabChange("chats")}
            >
              <Users className="size-5" />
              <span className="font-medium hidden lg:block">Chats</span>
            </button>
            <button 
              className={`flex-1 py-3 px-2 flex items-center justify-center lg:justify-start gap-2 ${
                activeTab === "groups" ? "bg-base-300" : "hover:bg-base-200"
              }`}
              onClick={() => handleTabChange("groups")}
            >
              <UsersRound className="size-5" />
              <span className="font-medium hidden lg:block">Groups</span>
            </button>
          </div>

          {/* Filters and actions */}
          <div className="p-2 flex justify-between items-center">
            {activeTab === "chats" ? (
              <div className="hidden lg:flex items-center gap-2 ml-2">
                <input
                  type="checkbox"
                  className="toggle toggle-sm toggle-primary"
                  checked={showOnlineOnly}
                  onChange={() => setShowOnlineOnly(!showOnlineOnly)}
                />
                <span className="text-xs">
                  Show online only {onlineUsers.length > 0 ? `(${onlineUsers.length})` : ""}
                </span>
              </div>
            ) : (
              <div></div> // Empty div to maintain flex spacing
            )}

            {activeTab === "groups" && (
              <button 
                onClick={() => setShowCreateGroupModal(true)}
                className="btn btn-sm btn-primary btn-circle ml-auto"
                title="Create New Group"
              >
                <Plus className="size-4" />
              </button>
            )}
          </div>
        </div>

        {/* Content based on active tab */}
        <div className="overflow-y-auto w-full py-3">
          {activeTab === "chats" ? (
            // Users list
            <>
              {filteredUsers.map((user) => (
                <button
                  key={user._id}
                  onClick={() => handleSelectUser(user)}
                  className={`
                    w-full p-3 flex items-center gap-3
                    hover:bg-base-300 transition-colors
                    ${selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""}
                  `}
                >
                  <div className="relative mx-auto lg:mx-0">
                    <img
                      src={user.profilePic || "/avatar.png"}
                      alt={user.fullName || "User"}
                      className="size-12 object-cover rounded-full"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/avatar.png";
                      }}
                    />
                    {onlineUsers && onlineUsers.includes(user._id) && (
                      <span
                        className="absolute bottom-0 right-0 size-3 bg-green-500 
                        rounded-full ring-2 ring-zinc-900"
                      />
                    )}
                  </div>

                  {/* User info - only visible on larger screens */}
                  <div className="hidden lg:block text-left min-w-0">
                    <div className="font-medium truncate">{user.fullName}</div>
                    <div className="text-sm text-zinc-400">
                      {onlineUsers && onlineUsers.includes(user._id) ? "Online" : "Offline"}
                    </div>
                  </div>
                </button>
              ))}

              {filteredUsers.length === 0 && (
                <div className="text-center text-zinc-500 py-4 px-2">
                  {showOnlineOnly ? "No online contacts" : "No contacts found"}
                </div>
              )}
            </>
          ) : (
            // Groups list
            <>
              {groups && groups.length > 0 ? (
                groups.map((group) => (
                  <button
                    key={group._id}
                    onClick={() => handleSelectGroup(group)}
                    className={`
                      w-full p-3 flex items-center gap-3
                      hover:bg-base-300 transition-colors
                      ${selectedGroup?._id === group._id ? "bg-base-300 ring-1 ring-base-300" : ""}
                    `}
                  >
                    <div className="relative mx-auto lg:mx-0">
                      <img
                        src={group.profilePic || "/group-avatar.png"}
                        alt={group.name || "Group"}
                        className="size-12 object-cover rounded-full"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/group-avatar.png";
                        }}
                      />
                    </div>

                    {/* Group info - only visible on larger screens */}
                    <div className="hidden lg:block text-left min-w-0">
                      <div className="font-medium truncate">{group.name}</div>
                      <div className="text-sm text-zinc-400 truncate">
                        {group.members.length} members
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center text-zinc-500 py-4 px-2">
                  No groups found. Create your first group!
                </div>
              )}
            </>
          )}
        </div>
      </aside>

      {/* Create Group Modal */}
      <CreateGroupModal 
        isOpen={showCreateGroupModal} 
        onClose={() => setShowCreateGroupModal(false)} 
      />
    </>
  );
};

export default Sidebar;
