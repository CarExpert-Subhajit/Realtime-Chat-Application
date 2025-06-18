import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  
  // ── read from localStorage or default to true ──
  notificationSoundEnabled: (() => {
    const saved = localStorage.getItem("notificationSound");
    return saved === null ? true : JSON.parse(saved);
  })(),

  // ── set to localStorage ──
  setNotificationSound: (enabled) => {
    localStorage.setItem("notificationSound", JSON.stringify(enabled));
    set({ notificationSoundEnabled: enabled });
  },

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      const fetchedMessages = res.data;
      set({ messages: fetchedMessages });
  
      // ✅ Update status of received messages to "read"
      const myId = useAuthStore.getState().authUser._id;
  
      fetchedMessages.forEach((msg) => {
        if (msg.receiverId === myId && msg.status !== "read") {
          axiosInstance.patch(`/messages/${msg._id}/status`, { status: "read" });
        }
      });
  
    } catch (error) {
      toast.error(error.response?.data?.message || "Error loading messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      // send to server
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );
  
      // append locally
      set({ messages: [...messages, res.data] });
  
      // now re-fetch sidebar users so 'selectedUser' shows up permanently
      await get().getUsers();
  
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },
  


  updateMessageStatus: async (messageId, status) => {
    try {
      await axiosInstance.patch(`/messages/${messageId}/status`, { status });
    } catch (error) {
      console.error("Failed to update message status:", error.response?.data?.message || error.message);
    }
  },

  

subscribeToMessages: () => {
  const socket = useAuthStore.getState().socket;

  socket.on("newMessage", (newMessage) => {
    const myId = useAuthStore.getState().authUser._id;
    const otherUserId = newMessage.senderId === myId ? newMessage.receiverId : newMessage.senderId;

    // Move sender or receiver to top
    get().moveUserToTop(otherUserId);

    const { selectedUser, messages } = get();
    if (selectedUser && newMessage.senderId === selectedUser._id) {
      set({
        messages: [...messages, newMessage],
      });
    }
  });

  // 👇 Add this block for message status update
  socket.on("messageStatusUpdated", ({ messageId, status }) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg._id === messageId ? { ...msg, status } : msg
      ),
    }));
  });

  socket.on("messageDeleted", ({ messageId }) => {
    set((state) => ({
      messages: state.messages.filter((m) => m._id !== messageId)
    }));
  });
  
},

  

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
    socket.off("messageStatusUpdated"); 
    socket.off("messageDeleted");


  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),

  moveUserToTop: (userId) => {
    set((state) => {
      const updatedUsers = [...state.users];
      const index = updatedUsers.findIndex((user) => user._id === userId);
      if (index !== -1) {
        const [user] = updatedUsers.splice(index, 1);
        updatedUsers.unshift(user);
      }
      return { users: updatedUsers };
    });
  },
}));
