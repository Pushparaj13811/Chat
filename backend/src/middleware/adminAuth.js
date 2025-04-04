import jwt from "jsonwebtoken";
import Admin from "../models/admin.model.js";

export const protectAdminRoute = async (req, res, next) => {
  try {
    const token = req.cookies.admin_jwt;

    if (!token) {
      return res.status(401).json({ message: "Not authorized - No token" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.adminId) {
      return res.status(401).json({ message: "Not authorized - Invalid token" });
    }

    // Get admin from token
    const admin = await Admin.findById(decoded.adminId).select("-password");
    if (!admin) {
      return res.status(401).json({ message: "Not authorized - Admin not found" });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error("Error in admin auth middleware:", error);
    res.status(401).json({ message: "Not authorized - Invalid token" });
  }
}; 