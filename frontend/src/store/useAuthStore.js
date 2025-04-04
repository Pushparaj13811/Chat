import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.VITE_API_URL;

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  isSendingOTP: false,
  isVerifyingOTP: false,
  pendingEmail: null,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    set({ isCheckingAuth: true });
    try {
      const res = await axiosInstance.get("/api/auth/check");
      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      // Handle 401 errors silently - user is not logged in
      if (error.response && error.response.status === 401) {
        console.log("User not authenticated");
      } else {
        console.error("Error in checkAuth:", error);
      }
      set({ authUser: null });
      
      // Clear localStorage if there's invalid data
      localStorage.removeItem("user");
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  // Send OTP for registration
  sendOTP: async (data) => {
    set({ isSendingOTP: true });
    try {
      const res = await axiosInstance.post("/api/auth/send-otp", data);
      set({ pendingEmail: data.email });
      toast.success(res.data.message || "OTP sent to your email");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send OTP");
      console.log("Error in sendOTP:", error);
      throw error;
    } finally {
      set({ isSendingOTP: false });
    }
  },

  // Verify OTP and complete registration
  verifyOTP: async (data) => {
    set({ isVerifyingOTP: true });
    try {
      const res = await axiosInstance.post("/api/auth/verify-otp", data);
      set({ 
        authUser: res.data,
        pendingEmail: null 
      });
      localStorage.setItem("user", JSON.stringify(res.data));
      toast.success("Account created successfully");
      get().connectSocket();
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "OTP verification failed");
      console.log("Error in verifyOTP:", error);
      throw error;
    } finally {
      set({ isVerifyingOTP: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/api/auth/signup", data);
      set({ authUser: res.data });
      localStorage.setItem("user", JSON.stringify(res.data));
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup failed");
      console.log("error in signup:", error);
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/api/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");
      localStorage.setItem("user", JSON.stringify(res.data));
      get().connectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    // Disconnect socket first to prevent issues
    get().disconnectSocket();
    
    // Clear local state immediately to ensure UI updates
    const currentUser = get().authUser;
    set({ authUser: null });
    localStorage.removeItem("user");
    
    try {
      const response = await axiosInstance.post("/api/auth/logout");
      toast.success(response.data?.message || "Logged out successfully");
    } catch (error) {
      console.error("Logout API error:", error);
      // Don't show error to user since we already logged them out locally
      // This prevents confusion since the user is effectively logged out from the app
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/api/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("error in update profile:", error);
      toast.error(error.response.data.message);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
    });
    socket.connect();

    set({ socket: socket });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });
  },
  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },

  // Handle OAuth login success
  handleOAuthLogin: async (userData, token) => {
    try {
      // Store token in axios instance
      if (token) {
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      
      set({ authUser: userData });
      localStorage.setItem("user", JSON.stringify(userData));
      toast.success("Logged in successfully");
      get().connectSocket();
      
      return true;
    } catch (error) {
      console.error("OAuth login error:", error);
      toast.error("Failed to complete authentication");
      return false;
    }
  },
}));
