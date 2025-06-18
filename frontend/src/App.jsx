import Navbar from "./components/Navbar";

import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { useEffect } from "react";

import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";

import { initSocket, getSocket } from "./lib/socket.js";
import { useChatStore } from "./store/useChatStore.js"; // ✅ CORRECT


const App = () => {
  const { authUser, checkAuth, isCheckingAuth, onlineUsers } = useAuthStore();
  const { theme } = useThemeStore();
  console.log({ onlineUsers });

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (authUser?._id) {
      initSocket(authUser._id);
      const socket = getSocket();

      if (!socket) return;

      socket.on("newMessage", (newMessage) => {
        const { selectedUser, messages, getUsers } = useChatStore.getState();

        if (selectedUser && newMessage.senderId === selectedUser._id) {
          useChatStore.setState({ messages: [...messages, newMessage] });
        }

        getUsers(); // refresh sidebar
      });
      socket.on("refreshUsers", () => {
        useChatStore.getState().getUsers();  // reload sidebar list
      });
      return () => {
        socket.off("newMessage");
        socket.off("refreshUsers");
      };
    }
  }, [authUser]);


  if (isCheckingAuth && !authUser)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );

  return (
    <div data-theme={theme}>
      <Navbar />

      <Routes>
        <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
      </Routes>

      <Toaster />
    </div>
  );
};

export default App;
