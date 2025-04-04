import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { sendEmail } from "../utils/emailSender.js";
import jwt from "jsonwebtoken";

// Generate a 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// New controller to send OTP during signup
export const sendOTP = async (req, res) => {
  const { fullName, email, password } = req.body;
  
  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    
    // If user exists but isn't verified, we can update their info
    // Otherwise return error
    if (user) {
      if (user.isVerified) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = Date.now() + 600000; // 10 minutes
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (user) {
      // Update existing unverified user
      user.fullName = fullName;
      user.password = hashedPassword;
      user.otp = otp;
      user.otpExpires = otpExpires;
    } else {
      // Create a new user with OTP
      user = new User({
        fullName,
        email,
        password: hashedPassword,
        otp,
        otpExpires,
        isVerified: false
      });
    }
    
    await user.save();

    // Send OTP email and handle potential failure
    const emailSent = await sendEmail(email, "Your Verification Code", "otpVerification", {
      name: fullName,
      otp: otp
    });

    // In development mode, always succeed even if email sending fails
    // In production, respond based on email sending success
    if (process.env.NODE_ENV === 'development' || emailSent) {
      res.status(200).json({ 
        message: "OTP sent to your email",
        email,
        // Only include OTP in dev mode for testing
        ...(process.env.NODE_ENV === 'development' && { otp })
      });
    } else {
      // Email sending failed in production
      // Delete the user we just created
      await User.findByIdAndDelete(user._id);
      return res.status(500).json({ message: "Failed to send verification email. Please try again." });
    }
  } catch (error) {
    console.log("Error in sendOTP controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Verify OTP and complete registration
export const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  
  try {
    const user = await User.findOne({ 
      email,
      otpExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // OTP verified successfully, mark user as verified
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    
    await user.save();
    
    // Generate token for automatic login
    generateToken(user._id, res);

    // Send welcome email - don't wait for it to complete registration
    sendEmail(user.email, "Welcome to our app", "welcomeEmail", {
      name: user.fullName,
    }).catch(err => console.error("Failed to send welcome email:", err));

    res.status(201).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic
    });
  } catch (error) {
    console.log("Error in verifyOTP controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email });

    if (user) return res.status(400).json({ message: "Email already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    if (newUser) {
      // generate jwt token here
      generateToken(newUser._id, res);
      await newUser.save();

      sendEmail(newUser.email, "Welcome to our app", "welcomeEmail", {
        name: newUser.fullName,
      });

      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  try {
    console.log("Login attempt:", {
      headers: req.headers,
      origin: req.get('origin'),
      userAgent: req.get('user-agent')
    });

    const { email, password } = req.body;
    console.log("Login credentials received:", { email, hasPassword: !!password });

    if (!email || !password) {
      console.log("Missing credentials");
      return res.status(400).json({ message: "Please provide both email and password" });
    }

    const user = await User.findOne({ email });
    console.log("User found:", { found: !!user, email });

    if (!user) {
      console.log("User not found for email:", email);
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Check user account status
    if (user.status === "blocked" || user.status === "suspended") {
      console.log("User account status check failed:", user.status);
      return res.status(403).json({ 
        message: user.status === "blocked" 
          ? "Your account has been blocked due to violation of our terms of service"
          : "Your account has been temporarily suspended",
        supportMessage: "Please contact our support team at support@chatapp.com for assistance",
        status: user.status
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    console.log("Password verification:", { isCorrect: isPasswordCorrect });

    if (!isPasswordCorrect) {
      console.log("Password incorrect for email:", email);
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Update user login statistics
    user.loginCount = (user.loginCount || 0) + 1;
    user.lastSeen = new Date();
    user.isOnline = true;
    await user.save();
    console.log("User stats updated");

    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d"
    });
    console.log("JWT token generated");

    // Set cookie
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: 'none',
      path: '/'
    });
    console.log("Cookie set with token");

    // Send response with token
    const response = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
      token: token
    };
    console.log("Sending successful login response");
    
    res.status(200).json(response);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const userId = req.cookies.jwt ? jwt.verify(req.cookies.jwt, process.env.JWT_SECRET)?.userId : null;
    
    // Update user status to offline if userId is present
    if (userId) {
      try {
        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date()
        });
      } catch (err) {
        console.log("Error updating user status during logout:", err.message);
        // Continue with logout even if updating user status fails
      }
    }
    
    // Clear JWT cookie
    res.cookie("jwt", "", { 
      httpOnly: true,
      expires: new Date(0),
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax'
    });
    
    // If using passport sessions, also logout from there
    if (req.logout) {
      req.logout(function(err) {
        if (err) {
          console.log("Error during passport logout:", err);
        }
      });
    }
    
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Logout failed. Please try again." });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    const userId = req.user._id;

    if (!profilePic) {
      return res.status(400).json({ message: "Profile pic is required" });
    }

    const uploadResponse = await cloudinary.uploader.upload(profilePic);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true }
    );

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//reset link start from here !

dotenv.config();

// Forgot Password Controller
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      console.log("User not found for email:", email); // Log to server
      return res.status(404).json({ message: "User not found" });
    }

    // Generate a reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Save token and expiration to DB
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    // Reset link
    const data = {
      name : user.fullName,
      resetLink : `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`
    }

    // Email options
    await sendEmail(user.email,"Password Reset Request","forgotPassword",data);

    res.json({ message: "Password reset link sent to your email." });
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  console.log(`Auth Controller :: Reset Password :: Reset Token :: ${token}`);
  console.log(`Auth Controller :: Reset Password :: New Password :: ${newPassword}`);

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }, // Check if token is still valid
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Clear reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ message: "Password reset successful. You can now log in." });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Handle OAuth authentication success
export const handleOAuthSuccess = (req, res) => {
  try {
    console.log("OAuth success handler called");
    
    if (!req.user) {
      console.error("OAuth authentication failed - no user data");
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=auth_failed_no_user`);
    }
    
    console.log("Authenticated user:", req.user._id);
    
    // Generate JWT token for the authenticated user
    const token = req.user.generateAuthToken();
    if (!token) {
      console.error("Failed to generate auth token");
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=token_generation_failed`);
    }
    
    console.log("Token generated successfully");
    
    // Set JWT cookie
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax'
    });
    
    // Redirect to frontend with token in URL
    const redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/oauth-success?token=${token}`;
    console.log("Redirecting to:", redirectUrl);
    res.redirect(redirectUrl);
  } catch (error) {
    console.error("OAuth success handler error:", error);
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=auth_failed&message=${encodeURIComponent(error.message)}`);
  }
};

