import { useChatStore } from "../store/useChatStore";
import { useGroupsContext } from "../context/GroupsContext";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";
import GroupChatContainer from "../components/GroupChatContainer";

const HomePage = () => {
  const { selectedUser } = useChatStore();
  const { selectedGroup } = useGroupsContext();

  // Determine what to render based on what is selected
  const renderContent = () => {
    if (selectedUser) {
      return <ChatContainer />;
    } else if (selectedGroup) {
      return <GroupChatContainer />;
    } else {
      return <NoChatSelected />;
    }
  };

  return (
    <div className="h-screen bg-base-200">
      <div className="flex items-center justify-center pt-20 px-4">
        <div className="bg-base-100 rounded-lg shadow-cl w-full max-w-7xl h-[calc(100vh-8rem)]">
          <div className="flex h-full rounded-lg overflow-hidden">
            <div className="flex-shrink-0">
              <Sidebar />
            </div>
            <div className="flex-grow">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
