import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    // Get all users except the current one
    const users = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    // For each user, find the latest message with logged-in user
    const usersWithLastMessage = await Promise.all(
      users.map(async (user) => {
        const lastMessage = await Message.findOne({
          $or: [
            { senderId: loggedInUserId, receiverId: user._id },
            { senderId: user._id, receiverId: loggedInUserId },
          ],
        })
          .sort({ createdAt: -1 })
          .limit(1);

        return {
          ...user.toObject(),
          lastMessageTime: lastMessage ? lastMessage.createdAt : user.createdAt,
        };
      })
    );

    // Sort users by lastMessageTime descending
    usersWithLastMessage.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

    res.status(200).json(usersWithLastMessage);
  } catch (error) {
    console.error("Error in getUsersForSidebar:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};




export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};


export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      // Upload base64 image to Cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    // ✅ Emit to receiver if online
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }
    io.to(receiverId).emit("refreshUsers");
    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};




// PATCH /messages/:messageId/status
export const updateMessageStatus = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { status } = req.body;

    // Validate status
    if (!["delivered", "read"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    // Find message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Status priority logic
    const statusPriority = { sent: 1, delivered: 2, read: 3 };
    if (statusPriority[status] <= statusPriority[message.status]) {
      return res.status(400).json({ error: "Cannot downgrade message status" });
    }

    message.status = status;
    await message.save();

    // ✅ Emit to both sender and receiver
    const senderSocketId = getReceiverSocketId(message.senderId.toString());
    const receiverSocketId = getReceiverSocketId(message.receiverId.toString());

    const payload = {
      messageId: message._id,
      status: message.status,
    };

    if (senderSocketId) {
      io.to(senderSocketId).emit("messageStatusUpdated", payload);
    }

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageStatusUpdated", payload);
    }

    res.status(200).json({ message: "Status updated", updatedMessage: message });
  } catch (error) {
    console.error("Error updating message status:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};


export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    // Find the message
    const msg = await Message.findById(messageId);
    if (!msg) return res.status(404).json({ error: "Message not found" });

    // Only sender can delete
    if (msg.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Delete it
    await msg.deleteOne();

    // Notify both parties
    const roomIds = [msg.senderId.toString(), msg.receiverId.toString()];
    roomIds.forEach((uid) => {
      io.to(uid).emit("messageDeleted", { messageId });
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("deleteMessage error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};


