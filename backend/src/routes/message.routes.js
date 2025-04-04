import express from "express";
import { getUsersForSidebar, getMessages, sendMessage, addReaction, editMessage, deleteMessage, markMessageSeen, markMessageDelivered, pinMessage, unpinMessage, getPinnedMessages, forwardMessage } from "../controllers/message.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);
router.get("/pinned/:userId", protectRoute, getPinnedMessages);
router.post("/send/:id", protectRoute, sendMessage);
router.post("/reaction/:messageId", protectRoute, addReaction);
router.post("/:messageId/pin", protectRoute, pinMessage);
router.post("/:messageId/unpin", protectRoute, unpinMessage);
router.post("/forward/:messageId/:receiverId", protectRoute, forwardMessage);
router.put("/delivered/:messageId", protectRoute, markMessageDelivered);
router.put("/seen/:messageId", protectRoute, markMessageSeen);
router.put("/edit/:messageId", protectRoute, editMessage);
router.delete("/:messageId", protectRoute, deleteMessage);

export default router; 