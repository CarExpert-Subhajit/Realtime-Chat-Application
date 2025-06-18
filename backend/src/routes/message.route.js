import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getMessages, getUsersForSidebar, sendMessage, updateMessageStatus, deleteMessage  } from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);

router.post("/send/:id", protectRoute, sendMessage);
router.patch("/:messageId/status", protectRoute, updateMessageStatus);
router.delete("/:messageId", protectRoute, deleteMessage);

export default router;
