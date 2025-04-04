import express from "express";
import { 
  createGroup, 
  getUserGroups, 
  getGroupById, 
  updateGroup, 
  addGroupMembers, 
  removeGroupMember, 
  promoteToAdmin, 
  demoteAdmin, 
  deleteGroup 
} from "../controllers/group.controller.js";
import { 
  getGroupMessages, 
  sendGroupMessage, 
  editGroupMessage, 
  deleteGroupMessage, 
  addGroupMessageReaction, 
  forwardGroupMessage, 
  pinGroupMessage, 
  unpinGroupMessage, 
  getGroupPinnedMessages 
} from "../controllers/groupMessage.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Group management routes
router.post("/create", protectRoute, createGroup);
router.get("/", protectRoute, getUserGroups);
router.get("/:groupId", protectRoute, getGroupById);
router.put("/:groupId", protectRoute, updateGroup);
router.post("/:groupId/members", protectRoute, addGroupMembers);
router.delete("/:groupId/members/:memberId", protectRoute, removeGroupMember);
router.post("/:groupId/admins/:memberId", protectRoute, promoteToAdmin);
router.delete("/:groupId/admins/:adminId", protectRoute, demoteAdmin);
router.delete("/:groupId", protectRoute, deleteGroup);

// Group message routes
router.get("/:groupId/messages", protectRoute, getGroupMessages);
router.post("/:groupId/messages", protectRoute, sendGroupMessage);
router.put("/messages/:messageId", protectRoute, editGroupMessage);
router.delete("/messages/:messageId", protectRoute, deleteGroupMessage);
router.post("/messages/:messageId/reaction", protectRoute, addGroupMessageReaction);
router.post("/messages/:messageId/forward/:groupId", protectRoute, forwardGroupMessage);
router.post("/messages/:messageId/pin", protectRoute, pinGroupMessage);
router.post("/messages/:messageId/unpin", protectRoute, unpinGroupMessage);
router.get("/:groupId/pinned-messages", protectRoute, getGroupPinnedMessages);

export default router; 