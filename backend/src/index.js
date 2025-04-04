import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import fileUpload from "express-fileupload";
import path from "path";
import session from "express-session";
import passport from "./lib/passport.js";

import { connectDB } from "./lib/db.js";

import authRoutes from "./routes/auth.routes.js";
import messageRoutes from "./routes/message.routes.js";
import groupRoutes from "./routes/group.routes.js";
import { app, server } from "./lib/socket.js";
import adminRoutes from "./routes/admin.routes.js";

dotenv.config();

const PORT = process.env.PORT;
const __dirname = path.resolve();

//const app = express();
//app.use(express.json()); 

// Helper function to get allowed origins
const getAllowedOrigins = () => {
  // Get origins from env or use default
  const origins = process.env.ALLOWED_ORIGINS || "http://localhost:5173";
  return origins.split(',');
};

app.use(
  cors({
    origin: function(origin, callback) {
      console.log("Incoming request from origin:", origin);
      const allowedOrigins = getAllowedOrigins();
      console.log("Allowed origins:", allowedOrigins);
      
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        console.log("No origin provided - allowing request");
        return callback(null, true);
      }
      
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
        console.log("Origin allowed:", origin);
        callback(null, true);
      } else {
        console.log('Blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    exposedHeaders: ["Set-Cookie", "Authorization"]
  })
);

// Enable pre-flight requests for all routes
app.options('*', cors());

// Set trust proxy to handle cookies with secure flag behind proxy/ngrok
app.set('trust proxy', 1);

// Parse cookies
app.use(cookieParser());

// Parse JSON bodies
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Add session support for Passport
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your_session_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Add file upload middleware
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  abortOnLimit: true
}));

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/admin", adminRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

server.listen(PORT, () => {
  console.log("server is running on PORT:" + PORT);
  connectDB();
});
