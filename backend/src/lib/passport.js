import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as GitHubStrategy } from 'passport-github2';
import dotenv from 'dotenv';
import User from '../models/user.model.js';
import { generateToken } from './utils.js';

dotenv.config();

// Serialize user to session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`,
      proxy: true
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("Google profile:", profile);
        // Check if user already exists
        let user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          // Check if user is blocked or suspended
          if (user.status === "blocked") {
            return done(new Error("Your account has been blocked due to violation of our terms of service. Please contact support."), null);
          }
          
          if (user.status === "suspended") {
            return done(new Error("Your account has been temporarily suspended. Please contact support."), null);
          }
          
          // If user exists but has no Google ID, update it
          if (!user.googleId) {
            user.googleId = profile.id;
            await user.save();
          }
          return done(null, user);
        }
        
        // Create new user if doesn't exist
        user = new User({
          googleId: profile.id,
          email: profile.emails[0].value,
          fullName: profile.displayName,
          profilePic: profile.photos[0]?.value || '',
          password: Math.random().toString(36).slice(-8), // Random password
          isVerified: true // OAuth users are automatically verified
        });
        
        await user.save();
        return done(null, user);
      } catch (error) {
        console.error("Google auth error:", error);
        return done(error, null);
      }
    }
  )
);

// Facebook Strategy
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/api/auth/facebook/callback`,
      profileFields: ['id', 'displayName', 'photos', 'email'],
      proxy: true
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Facebook doesn't always provide email, so we need to handle that case
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : `${profile.id}@facebook.com`;
        
        // Check if user already exists
        let user = await User.findOne({ 
          $or: [
            { email: email },
            { facebookId: profile.id }
          ]
        });

        if (user) {
          // Check if user is blocked or suspended
          if (user.status === "blocked") {
            return done(new Error("Your account has been blocked due to violation of our terms of service. Please contact support."), null);
          }
          
          if (user.status === "suspended") {
            return done(new Error("Your account has been temporarily suspended. Please contact support."), null);
          }
          
          // If user exists but has no Facebook ID, update it
          if (!user.facebookId) {
            user.facebookId = profile.id;
            await user.save();
          }
          return done(null, user);
        }
        
        // Create new user if doesn't exist
        user = new User({
          facebookId: profile.id,
          email: email,
          fullName: profile.displayName,
          profilePic: profile.photos[0]?.value || '',
          password: Math.random().toString(36).slice(-8), // Random password
          isVerified: true // OAuth users are automatically verified
        });
        
        await user.save();
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// GitHub Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/api/auth/github/callback`,
      scope: ['user:email'],
      proxy: true
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // GitHub may not provide email in the profile, need to handle that
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : `${profile.id}@github.com`;
        
        // Check if user already exists
        let user = await User.findOne({ 
          $or: [
            { email: email },
            { githubId: profile.id }
          ]
        });

        if (user) {
          // Check if user is blocked or suspended
          if (user.status === "blocked") {
            return done(new Error("Your account has been blocked due to violation of our terms of service. Please contact support."), null);
          }
          
          if (user.status === "suspended") {
            return done(new Error("Your account has been temporarily suspended. Please contact support."), null);
          }
          
          // If user exists but has no GitHub ID, update it
          if (!user.githubId) {
            user.githubId = profile.id;
            await user.save();
          }
          return done(null, user);
        }
        
        // Create new user if doesn't exist
        user = new User({
          githubId: profile.id,
          email: email,
          fullName: profile.displayName || profile.username,
          profilePic: profile.photos[0]?.value || '',
          password: Math.random().toString(36).slice(-8), // Random password
          isVerified: true // OAuth users are automatically verified
        });
        
        await user.save();
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

export default passport; 