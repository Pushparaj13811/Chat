import express from "express";
import { 
  adminLogin,
  adminLogout,
  getAllUsers,
  getUserDetails,
  updateUserStatus,
  deleteUser,
  getDashboardStats,
  checkAuth,
  getMessageAnalytics
} from "../controllers/admin.controller.js";
import { protectAdminRoute } from "../middleware/adminAuth.js";

const router = express.Router();

// Auth routes
router.post("/login", adminLogin);
router.post("/logout", adminLogout);

// Protected routes
router.use(protectAdminRoute);

// Auth check route
router.get("/check-auth", checkAuth);

// Dashboard routes
router.get("/dashboard/stats", getDashboardStats);
router.get("/dashboard/message-analytics", getMessageAnalytics);

// User management routes
router.get("/users", getAllUsers);
router.get("/users/:userId", getUserDetails);
router.patch("/users/:userId/status", updateUserStatus);
router.delete("/users/:userId", deleteUser);

export default router; 