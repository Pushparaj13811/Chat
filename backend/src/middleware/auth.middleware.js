import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
  try {
    console.log("Auth check for path:", req.path);
    console.log("Request headers:", req.headers);

    // If user is already authenticated via Passport
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      console.log("User authenticated via Passport");
      return next();
    }
    
    // If not, check for JWT token
    let token;
    let tokenSource = '';
    
    // Check cookies first
    if (req.cookies.jwt) {
      token = req.cookies.jwt;
      tokenSource = 'cookie';
    } 
    // Then check Authorization header for mobile clients
    else if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
      tokenSource = 'header';
    }
    // Finally check if token was sent in request body (for mobile)
    else if (req.body.token) {
      token = req.body.token;
      tokenSource = 'body';
    }

    console.log("Token source:", tokenSource);
    console.log("Token found:", !!token);

    if (!token) {
      console.log("No token provided");
      return res.status(401).json({
        success: false,
        message: "Unauthorized - No token provided",
      });
    }

    try {
      // Verify token
      console.log("Attempting to verify token");
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Token verified:", { userId: decoded.userId });
      
      if (!decoded.userId) {
        console.log("Token missing userId");
        return res.status(401).json({
          success: false,
          message: "Invalid token format",
        });
      }

      // Get user from token
      const user = await User.findById(decoded.userId).select("-password");
      console.log("User found from token:", !!user);
      
      if (!user) {
        console.log("No user found for token userId:", decoded.userId);
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
      
      // Set user in request object
      req.user = user;
      console.log("Auth successful, proceeding to next middleware");
      next();
    } catch (jwtError) {
      console.error("JWT Verification Error:", {
        error: jwtError.message,
        name: jwtError.name,
        stack: jwtError.stack
      });
      return res.status(401).json({
        success: false,
        message: "Unauthorized - Invalid token",
        error: process.env.NODE_ENV === 'development' ? jwtError.message : undefined
      });
    }
    
  } catch (error) {
    console.error("Error in protectRoute middleware:", {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
