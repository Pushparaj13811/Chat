import express from "express";
import { checkAuth, forgotPassword, resetPassword, login, logout, signup, updateProfile, sendOTP, verifyOTP, handleOAuthSuccess } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import passport from "passport";

const router = express.Router();

// OTP verification routes
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);

// Original signup route (can keep as fallback)
router.post("/signup", signup);
// router.post("/signup", (req, res) => {
//     console.log("Signup route hit!");
//     res.json({ message: "Signup works!" });
//   });
  
router.post("/login", login);
router.post("/logout", logout);

router.put("/update-profile", protectRoute, updateProfile);

router.get("/check", protectRoute, checkAuth);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// OAuth routes
// Google OAuth
router.get("/google", (req, res, next) => {
  console.log("Google OAuth route hit");
  passport.authenticate("google", { 
    scope: ["profile", "email"],
    prompt: "select_account"
  })(req, res, next);
});

router.get(
  "/google/callback",
  (req, res, next) => {
    console.log("Google callback route hit");
    passport.authenticate("google", { 
      failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=google_auth_failed`,
      failWithError: true
    })(req, res, next);
  },
  (req, res, next) => {
    // This middleware will only be called on successful authentication
    handleOAuthSuccess(req, res, next);
  },
  // Error handling middleware
  (err, req, res, next) => {
    console.error("Google OAuth error:", err.message);
    // Check if the error message indicates a blocked or suspended account
    if (err.message.includes("blocked")) {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/oauth-success?error=account_blocked&message=${encodeURIComponent(err.message)}`);
    } else if (err.message.includes("suspended")) {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/oauth-success?error=account_suspended&message=${encodeURIComponent(err.message)}`);
    } else {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/oauth-success?error=oauth_error&message=${encodeURIComponent(err.message)}`);
    }
  }
);

// Facebook OAuth
router.get("/facebook", passport.authenticate("facebook", { scope: ["email"] }));
router.get(
  "/facebook/callback",
  passport.authenticate("facebook", { 
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=facebook_auth_failed`,
    failWithError: true 
  }),
  (req, res, next) => {
    // This middleware will only be called on successful authentication
    handleOAuthSuccess(req, res, next);
  },
  // Error handling middleware
  (err, req, res, next) => {
    console.error("Facebook OAuth error:", err.message);
    // Check if the error message indicates a blocked or suspended account
    if (err.message.includes("blocked")) {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=account_blocked&message=${encodeURIComponent(err.message)}`);
    } else if (err.message.includes("suspended")) {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=account_suspended&message=${encodeURIComponent(err.message)}`);
    } else {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=oauth_error&message=${encodeURIComponent(err.message)}`);
    }
  }
);

// GitHub OAuth
router.get("/github", passport.authenticate("github", { scope: ["user:email"] }));
router.get(
  "/github/callback",
  passport.authenticate("github", { 
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=github_auth_failed`,
    failWithError: true 
  }),
  (req, res, next) => {
    // This middleware will only be called on successful authentication
    handleOAuthSuccess(req, res, next);
  },
  // Error handling middleware
  (err, req, res, next) => {
    console.error("GitHub OAuth error:", err.message);
    // Check if the error message indicates a blocked or suspended account
    if (err.message.includes("blocked")) {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=account_blocked&message=${encodeURIComponent(err.message)}`);
    } else if (err.message.includes("suspended")) {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=account_suspended&message=${encodeURIComponent(err.message)}`);
    } else {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=oauth_error&message=${encodeURIComponent(err.message)}`);
    }
  }
);

export default router;
