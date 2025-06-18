import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useEffect, useRef, useState } from "react";
import { axiosInstance } from "../lib/axios";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { formatMessageTime } from "../lib/utils";
import { Download, Trash2, Trash, ChevronDown, Copy } from "lucide-react";


const downloadImage = async (imageUrl) => {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-image-${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Error downloading image:", err);
    alert("Failed to download image");
  }
};

const ChatContainer = () => {
  const [hiddenMessages, setHiddenMessages] = useState(new Set());
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    notificationSoundEnabled,
  } = useChatStore();

  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const notificationAudio = useRef(new Audio("sound/notification1.mp3")); // ✅ audio ref




  // Initial message fetch + subscriptions
  useEffect(() => {
    getMessages(selectedUser._id);
    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [selectedUser._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);





  // Scroll + Play Sound Logic
  useEffect(() => {
    if (messageEndRef.current && messages?.length) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });

      const latestMsg = messages[messages.length - 1];
      const isIncoming = latestMsg?.senderId !== authUser._id;

      if (isIncoming && notificationSoundEnabled) {
        notificationAudio.current.play().catch((e) =>
          console.log("Sound play blocked:", e)
        );
      }
    }
  }, [messages]);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto relative">
      <ChatHeader />
      {/* <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-base bg-[url(../public/ChatAppBG.png)]"> */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-4 bg-base-100">
        {messages
          .filter((m) => !hiddenMessages.has(m._id))
          .map((message) => (
            <div
              key={message._id}
              className={`chat  gap-2 ${message.senderId === authUser._id ? "chat-end" : "chat-start"}`}
              ref={messageEndRef}
            >
              {/* Avatar */}
              <div className={`chat-image avatar sm:block ${message.senderId === authUser._id ? "hidden mb-1" : "mb-3.5"}`}>

                <div className="size-9 sm:size-10  rounded-full border ">
                  <img
                    src={
                      message.senderId === authUser._id
                        ? authUser.profilePic || "/avatar.png"
                        : selectedUser.profilePic || "/avatar.png"
                    }
                    alt="profile pic"
                  />
                </div>
              </div>

              {/* Timestamp */}


              {/* Bubble */}
              <div
                className={`chat-bubble max-w-[80%] sm:max-w-screen-sm relative flex flex-col break-words  whitespace-pre-wrap min-w-0  ${message.senderId === authUser._id
                  ? "bg-primary text-primary-content"
                  : "bg-secondary text-secondary-content "
                  }`}
              >
                {message.image && (
                  <div className="relative sm:max-w-[200px] mb-2">
                    <img
                      src={message.image}
                      alt="Attachment"
                      className="rounded-md w-full"
                    />
                  </div>
                )}
                {message.text && <p>{message.text}</p>}

                <div className={`flex gap-2 mt-1 ${message.senderId === authUser._id ? "justify-end" : "justify-start"
                  }`}>

                  <time className="text-xs opacity-75">
                    {formatMessageTime(message.createdAt)}
                  </time>

                  {/* Status checks for sent messages */}
                  {message.senderId === authUser._id && (
                    <span className="text-xs text-gray-500 text-right">
                      {message.status === "sent" && "✓"}
                      {message.status === "delivered" && "✓✓"}
                      {message.status === "read" && <span className="text-base-300">✓✓</span>}
                    </span>
                  )}
                </div>


                <div
                  className={`absolute dropdown dropdown-top z-30 top-1/2 transform -translate-y-1/2 text-base-content ${message.senderId === authUser._id
                    ? "sm:dropdown-left  -left-7"
                    : "dropdown-end sm:dropdown-right -right-7 "
                    }`}
                >
                  {/* trigger */}
                  <div tabIndex={0} role="button"  className=" btn rounded-full btn-sm btn-ghost p-1  z-0">
                    <ChevronDown size={18} />

                  </div>

                  {/* menu */}
                  <ul
                    tabIndex={0}
                    className="dropdown-content menu z-[99] bg-base-100 rounded-box w-36 sm:w-40 p-1 shadow relative"
                  >

                    {/* Download Image (if image exists) */}
                    {message.image && (
                      <li>
                        <button
                          className="flex  items-center gap-2 w-full px-2 py-1 hover:bg-base-200 rounded"
                          onClick={() => downloadImage(message.image)}
                        >
                          <Download className="w-4 h-4" />
                          Download Image
                        </button>
                      </li>
                    )}
                    
                    {/* Copy Text (if text exists) */}
                    {message.text && (
                      <li >
                        <button
                          className="flex   items-center gap-2 w-full px-2 py-1 hover:bg-base-200 rounded"
                          onClick={() => navigator.clipboard.writeText(message.text)}
                        >
                          <Copy className="w-4 h-4" />
                          Copy Text
                        </button>
                      </li>
                    )}


                    <li>
                      <button
                        className="flex   items-center gap-2 w-full px-2 py-1 hover:bg-base-200 rounded"
                        onClick={() => {
                          setHiddenMessages((s) => new Set(s).add(message._id));
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete For You
                      </button>
                    </li>

                    {/* Unsend only for your own messages */}
                    {message.senderId === authUser._id && (
                      <li>
                        <button
                          className="flex items-center gap-2 text-red-500 w-full px-2 py-1 hover:bg-base-200 rounded"
                          onClick={async () => {
                            try {
                              await axiosInstance.delete(`/messages/${message._id}`);
                            } catch (err) {
                              console.error("Delete failed", err);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete For Both
                        </button>
                      </li>
                    )}

                  </ul>
                </div>
              </div>
            </div>
          ))}
      </div>

      <MessageInput />
    </div>
  );



};

export default ChatContainer;
