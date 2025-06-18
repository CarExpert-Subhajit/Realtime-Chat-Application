import { Server } from "socket.io";
import http from "http";
import express from "express";
import mongoose from "mongoose";
import User from "../models/user.model.js"; // Adjust path as needed

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3001"], // adjust to your frontend URL
    methods: ["GET", "POST"],
    credentials: true
  },
});

// Store socketId for each userId
const userSocketMap = {}; // { userId: socketId }

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  const userId = socket.handshake.query.userId;

  if (userId) {
    userSocketMap[userId] = socket.id;
    socket.join(userId);  
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  }

  socket.on("disconnect", async () => {
    console.log("❌ User disconnected:", socket.id);

    const disconnectedUserId = Object.keys(userSocketMap).find(
      (key) => userSocketMap[key] === socket.id
    );

    if (disconnectedUserId) {
      // Remove user from socket map
      delete userSocketMap[disconnectedUserId];

      // Update lastSeen in DB
      try {
        await User.findByIdAndUpdate(disconnectedUserId, {
          lastSeen: new Date(),
        });
      } catch (err) {
        console.error("Error updating lastSeen:", err);
      }

      // Notify all clients about the updated online user list
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    }
  });
});

export { io, app, server };





