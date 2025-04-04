import Admin from "../models/admin.model.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import Message from "../models/message.model.js";
import GroupMessage from "../models/groupMessage.model.js";

// Admin Login
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await admin.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate token
    const token = admin.generateAuthToken();
    
    res.cookie("admin_jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax'
    });

    res.status(200).json({
      _id: admin._id,
      fullName: admin.fullName,
      email: admin.email,
      role: admin.role
    });
  } catch (error) {
    console.error("Error in admin login:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Check Admin Auth Status
export const checkAuth = async (req, res) => {
  try {
    const admin = req.admin; // This comes from the protectAdminRoute middleware
    if (!admin) {
      return res.status(401).json({ message: "Not authorized" });
    }
    res.status(200).json({
      _id: admin._id,
      fullName: admin.fullName,
      email: admin.email,
      role: admin.role
    });
  } catch (error) {
    console.error("Error in check auth:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Admin Logout
export const adminLogout = (req, res) => {
  try {
    res.cookie("admin_jwt", "", {
      httpOnly: true,
      expires: new Date(0),
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax'
    });
    res.status(200).json({ message: "Admin logged out successfully" });
  } catch (error) {
    console.error("Error in admin logout:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get All Users
export const getAllUsers = async (req, res) => {
  try {
    const { 
      search = "", 
      page = 1, 
      limit = 10,
      sort = "createdAt",
      order = "desc",
      status = "all" 
    } = req.query;
    
    // Build search query
    let searchQuery = {};
    
    // Add text search if provided
    if (search) {
      searchQuery.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }
    
    // Add status filter if not "all"
    if (status !== "all") {
      searchQuery.status = status;
    }

    // Build sort object
    const sortObj = {};
    sortObj[sort] = order === "asc" ? 1 : -1;

    const users = await User.find(searchQuery)
      .select("-password")
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await User.countDocuments(searchQuery);

    res.status(200).json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error("Error in getting all users:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get User Details
export const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select("-password");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error in getting user details:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update User Status (Block/Unblock/Suspend)
export const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body; // status can be "blocked", "active", or "suspended"

    // Validate status value
    if (!["active", "blocked", "suspended"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user status
    user.status = status;
    
    // If user is blocked or suspended, force them offline
    if (status === "blocked" || status === "suspended") {
      user.isOnline = false;
      user.lastSeen = new Date();
    }
    
    await user.save();

    res.status(200).json({ 
      message: `User ${status} successfully`,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        status: user.status,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen
      }
    });
  } catch (error) {
    console.error("Error in updating user status:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Delete User
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await User.findByIdAndDelete(userId);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error in deleting user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get Dashboard Stats
export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const onlineUsers = await User.countDocuments({ isOnline: true });
    const offlineUsers = totalUsers - onlineUsers;
    const recentUsers = await User.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(5);

    const stats = {
      totalUsers,
      onlineUsers,
      offlineUsers,
      recentUsers
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error("Error in getting dashboard stats:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get Message Analytics
export const getMessageAnalytics = async (req, res) => {
  try {
    // Get total message count
    const totalMessages = await Message.countDocuments();
    
    // Get today's messages
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMessages = await Message.countDocuments({
      createdAt: { $gte: today }
    });
    
    // Get group messages count
    const groupMessages = await GroupMessage.countDocuments();
    
    // Get direct messages count
    const directMessages = await Message.countDocuments();
    
    // Get message types distribution
    const textMessages = await Message.countDocuments({ type: 'text' });
    const imageMessages = await Message.countDocuments({ type: 'image' });
    const voiceMessages = await Message.countDocuments({ type: 'voice' });
    const videoMessages = await Message.countDocuments({ 
      $or: [
        { type: 'video' }, 
        { fileName: { $regex: /\.(mp4|mov|avi|wmv)$/i } }
      ] 
    });
    const otherFiles = totalMessages - textMessages - imageMessages - voiceMessages - videoMessages;
    
    // Calculate percentages
    const textPercentage = (textMessages / totalMessages * 100).toFixed(1);
    const imagePercentage = (imageMessages / totalMessages * 100).toFixed(1);
    const voicePercentage = (voiceMessages / totalMessages * 100).toFixed(1);
    const videoPercentage = (videoMessages / totalMessages * 100).toFixed(1);
    const otherPercentage = (otherFiles / totalMessages * 100).toFixed(1);
    
    // Get message volume for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const messageVolume = await Message.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { 
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } 
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Get active hours distribution
    const hourlyDistribution = await Message.aggregate([
      {
        $group: {
          _id: { $hour: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      }
    ]);
    
    // Format hourly data
    const peakHours = hourlyDistribution.map(hour => {
      return {
        hour: `${hour._id}:00 - ${hour._id + 1}:00`,
        count: hour.count,
        percentage: ((hour.count / totalMessages) * 100).toFixed(1)
      };
    });
    
    // Get most active groups
    const activeGroups = await GroupMessage.aggregate([
      {
        $group: {
          _id: "$groupId",
          messageCount: { $sum: 1 }
        }
      },
      {
        $sort: { messageCount: -1 }
      },
      {
        $limit: 5
      },
      {
        $lookup: {
          from: "groups",
          localField: "_id",
          foreignField: "_id",
          as: "groupInfo"
        }
      },
      {
        $unwind: "$groupInfo"
      },
      {
        $project: {
          _id: 1,
          messageCount: 1,
          name: "$groupInfo.name",
          memberCount: { $size: "$groupInfo.members" }
        }
      }
    ]);
    
    // Calculate daily averages and get trend data for groups
    const groupsWithTrend = await Promise.all(activeGroups.map(async (group) => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const previousPeriodStart = new Date(thirtyDaysAgo);
      previousPeriodStart.setDate(previousPeriodStart.getDate() - 30);
      
      // Current period count
      const currentPeriodMessages = await GroupMessage.countDocuments({
        groupId: group._id,
        createdAt: { $gte: thirtyDaysAgo }
      });
      
      // Previous period count
      const previousPeriodMessages = await GroupMessage.countDocuments({
        groupId: group._id,
        createdAt: { $gte: previousPeriodStart, $lt: thirtyDaysAgo }
      });
      
      // Calculate trend percentage
      let trendPercentage = 0;
      if (previousPeriodMessages > 0) {
        trendPercentage = (((currentPeriodMessages - previousPeriodMessages) / previousPeriodMessages) * 100).toFixed(1);
      } else if (currentPeriodMessages > 0) {
        trendPercentage = 100;
      }
      
      // Calculate average messages per day
      const avgPerDay = (currentPeriodMessages / 30).toFixed(1);
      
      return {
        ...group,
        avgPerDay,
        trend: trendPercentage
      };
    }));
    
    // Assemble all analytics data
    const analytics = {
      summary: {
        totalMessages,
        todayMessages,
        groupMessages,
        directMessages
      },
      messageTypes: {
        text: {
          count: textMessages,
          percentage: textPercentage
        },
        image: {
          count: imageMessages,
          percentage: imagePercentage
        },
        voice: {
          count: voiceMessages,
          percentage: voicePercentage
        },
        video: {
          count: videoMessages,
          percentage: videoPercentage
        },
        other: {
          count: otherFiles,
          percentage: otherPercentage
        }
      },
      messageVolume,
      peakHours,
      activeGroups: groupsWithTrend
    };
    
    res.status(200).json(analytics);
  } catch (error) {
    console.error("Error in getting message analytics:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}; 