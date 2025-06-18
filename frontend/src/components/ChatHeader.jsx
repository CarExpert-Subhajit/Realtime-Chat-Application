import { X } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { formatDistanceToNow } from "date-fns";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const [showImagePreview, setShowImagePreview] = useState(false);

  const isOnline = onlineUsers.includes(selectedUser._id);

  const getLastSeenText = () => {
    if (!selectedUser.lastSeen) return "Offline";
    return `Last seen ${formatDistanceToNow(new Date(selectedUser.lastSeen), {
      addSuffix: true,
    })}`;
  };

  return (
    <>
      <div className="p-2.5 border-b border-base-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="avatar">
              <div
                className="size-10 rounded-full relative cursor-pointer"
                onClick={() => setShowImagePreview(true)}
              >
                <img
                  src={selectedUser.profilePic || "/avatar.png"}
                  alt={selectedUser.fullName}
                />
              </div>
            </div>

            {/* User info */}
            <div>
              <h3 className="font-medium">{selectedUser.fullName}</h3>
              <p className="text-sm text-base-content/70">
                {isOnline ? "Online" : getLastSeenText()}
              </p>
            </div>
          </div>

          {/* Close button */}
          <button onClick={() => setSelectedUser(null)}>
            <X />
          </button>
        </div>
      </div>

      {/* Image Preview Modal */}
      {showImagePreview && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center"
          onClick={() => setShowImagePreview(false)}
        >
          <img
            src={selectedUser.profilePic || "/avatar.png"}
            alt="Full Size Profile"
            className="max-w-full max-h-full rounded-lg shadow-lg"
          />
        </div>
      )}
    </>
  );
};

export default ChatHeader;
