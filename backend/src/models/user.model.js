// import mongoose from "mongoose";

// const userSchema = new mongoose.Schema(
//   {
//     email: {
//       type: String,
//       required: true,
//       unique: true,
//     },
//     fullName: {
//       type: String,
//       required: true,
//     },
//     password: {
//       type: String,
//       required: true,
//       minlength: 6,
//     },
//     profilePic: {
//       type: String,
//       default: "",
//     },
//   },
//   { timestamps: true }
// );

// const User = mongoose.model("User", userSchema);

// export default User;

import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    profilePic: {
      type: String,
      default: "",
    },
    // OAuth provider IDs
    googleId: {
      type: String,
    },
    facebookId: {
      type: String,
    },
    githubId: {
      type: String,
    },
    // Password Reset Fields
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
    // OTP Verification Fields
    otp: {
      type: String,
    },
    otpExpires: {
      type: Date,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    // User Status Fields
    status: {
      type: String,
      enum: ["active", "blocked", "suspended"],
      default: "active"
    },
    isOnline: {
      type: Boolean,
      default: false
    },
    lastSeen: {
      type: Date,
      default: Date.now
    },
    // User Activity Fields (for admin dashboard)
    messageCount: {
      type: Number,
      default: 0
    },
    loginCount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

// Generate JWT token
userSchema.methods.generateAuthToken = function() {
  try {
    console.log("Generating token for user:", this._id);
    const token = jwt.sign(
      { userId: this._id },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );
    console.log("Token generated successfully");
    return token;
  } catch (error) {
    console.error("Error generating token:", error);
    return null;
  }
};

const User = mongoose.model("User", userSchema);

export default User;

