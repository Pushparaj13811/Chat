import { create } from "zustand";
import Peer from "simple-peer";
import { useAuthStore } from "./useAuthStore";
import { useChatStore } from "./useChatStore";
import toast from "react-hot-toast";
import { playSound, CALL_SOUNDS } from "../lib/audio-utils";

// Check WebRTC compatibility
const checkWebRTCSupport = () => {
  if (typeof navigator === 'undefined') return false;
  
  const hasGetUserMedia = !!(
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia ||
    (navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
  );

  const hasRTCPeerConnection = !!(
    window.RTCPeerConnection ||
    window.webkitRTCPeerConnection ||
    window.mozRTCPeerConnection ||
    window.msRTCPeerConnection
  );

  return hasGetUserMedia && hasRTCPeerConnection;
};

export const useCallStore = create((set, get) => ({
  // Call state
  callType: null, // 'audio' or 'video'
  callStatus: null, // 'idle', 'calling', 'ringing', 'ongoing', 'ended'
  localStream: null,
  remoteStream: null,
  call: null, // incoming call data
  peer: null,
  callDuration: 0,
  isMuted: false,
  isVideoOff: false,
  isMinimized: false,
  errorMessage: null,
  isWebRTCSupported: checkWebRTCSupport(),
  callFeaturesInitialized: false,
  callSoundController: null, // For controlling call sounds

  // Stop any playing call sound
  stopCallSound: () => {
    const { callSoundController } = get();
    if (callSoundController) {
      callSoundController.stop();
      set({ callSoundController: null });
    }
  },

  // Play a call sound with proper handling
  playCallSound: (soundType, options = {}) => {
    // Stop any currently playing sound first
    get().stopCallSound();
    
    // Start the new sound and store its controller
    const controller = playSound(CALL_SOUNDS[soundType], options);
    set({ callSoundController: controller });
    
    return controller;
  },

  // Initialize call functionality
  initializeCallFeature: () => {
    const socket = useChatStore.getState().socket;
    
    if (!socket) {
      console.error("Socket not available for call initialization");
      return false; // Return false to indicate initialization failed
    }

    // Clean up any previous listeners to prevent duplicates
    socket.off("incomingCall");
    socket.off("callAccepted");
    socket.off("callRejected");
    socket.off("callBusy");
    socket.off("callEnded");
    
    // Listen for incoming calls
    socket.on("incomingCall", (data) => {
      const { from, callType, signal } = data;
      
      // Reject call if WebRTC is not supported
      if (!get().isWebRTCSupported) {
        socket.emit("rejectCall", { to: from.userId });
        toast.error("Video/Audio calls are not supported on this browser");
        return;
      }
      
      // Get current user and ongoing call status
      const { authUser } = useAuthStore.getState();
      const { callStatus } = get();
      
      // If user is already in a call, send busy signal
      if (callStatus === 'ongoing' || callStatus === 'calling' || callStatus === 'ringing') {
        socket.emit("callBusy", { to: from.userId });
        return;
      }
      
      // Play incoming call ringtone
      get().playCallSound('RINGTONE', { loop: true, volume: 0.8 });
      
      // Set call state to ringing
      set({ 
        call: { 
          isReceivingCall: true, 
          from, 
          signal,
          callType 
        }, 
        callStatus: 'ringing',
        callType
      });
    });
    
    // Handle call accepted
    socket.on("callAccepted", (data) => {
      const { signal } = data;
      const { peer } = get();
      
      if (peer) {
        // Stop outgoing call sound
        get().stopCallSound();
        
        // Play connected sound
        get().playCallSound('CONNECTED', { volume: 0.7 });
        
        peer.signal(signal);
        set({ callStatus: 'ongoing' });
        
        // Start timer for call duration
        get().startCallTimer();
      }
    });
    
    // Handle call rejected
    socket.on("callRejected", () => {
      // Stop outgoing call sound
      get().stopCallSound();
      
      // Play rejected sound
      get().playCallSound('REJECTED', { volume: 0.7 });
      
      get().endCall('rejected');
      toast.error("Call was rejected");
    });
    
    // Handle busy signal
    socket.on("callBusy", () => {
      // Stop outgoing call sound
      get().stopCallSound();
      
      // Play busy sound (using rejected sound)
      get().playCallSound('REJECTED', { volume: 0.7 });
      
      get().endCall('busy');
      toast.error("User is busy in another call");
    });
    
    // Handle call ended
    socket.on("callEnded", () => {
      // Stop any current call sound
      get().stopCallSound();
      
      // Play end call sound
      get().playCallSound('ENDED', { volume: 0.7 });
      
      get().endCall('ended');
    });

    // Set a flag to indicate successful initialization
    set({ callFeaturesInitialized: true });
    
    return true; // Return true to indicate successful initialization
  },
  
  // Make a call to another user
  makeCall: async (userId, callType = 'video') => {
    try {
      // Check WebRTC support
      if (!get().isWebRTCSupported) {
        toast.error("Video/Audio calls are not supported on this browser");
        return;
      }

      // Initialize call features if not already done
      if (!get().callFeaturesInitialized) {
        const initialized = get().initializeCallFeature();
        if (!initialized) {
          toast.error("Failed to initialize call features. Please try again.");
          return;
        }
      }
      
      // Get necessary state
      const socket = useChatStore.getState().socket;
      const { authUser } = useAuthStore.getState();
      
      if (!socket || !userId || !authUser) {
        set({ errorMessage: "Missing required information for call" });
        toast.error("Cannot start call - socket connection not available");
        return;
      }
      
      // Play outgoing call sound
      get().playCallSound('OUTGOING', { loop: true, volume: 0.6 });
      
      // Set initial call state
      set({ 
        callStatus: 'calling', 
        callType,
        errorMessage: null,
        isVideoOff: callType === 'audio',
      });
      
      // Get user media based on call type
      const constraints = {
        video: callType === 'video' ? { width: 640, height: 480 } : false,
        audio: true
      };
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        set({ localStream: stream });
        
        // Initialize audio tracks
        get().initializeAudioTracks(stream);
        
        // Create peer connection with browser-specific config
        const peer = new Peer({
          initiator: true,
          trickle: false,
          stream: stream,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' }
            ]
          }
        });
        
        // Handle peer events
        peer.on('signal', (signal) => {
          socket.emit('callUser', {
            userToCall: userId,
            signal,
            from: {
              userId: authUser._id,
              name: authUser.fullName,
              profilePic: authUser.profilePic
            },
            callType
          });
        });
        
        peer.on('stream', (remoteStream) => {
          set({ remoteStream });
        });
        
        peer.on('error', (error) => {
          console.error("Peer connection error:", error);
          set({ errorMessage: "Connection error" });
          
          // Play failed sound
          get().playCallSound('FAILED', { volume: 0.7 });
          
          get().endCall('error');
        });
        
        // Save peer connection
        set({ peer });
      } catch (mediaError) {
        console.error("Error accessing media devices:", mediaError);
        
        // Stop the outgoing call sound
        get().stopCallSound();
        
        // Play failed sound
        get().playCallSound('FAILED', { volume: 0.7 });
        
        set({ 
          errorMessage: mediaError.name === 'NotAllowedError' 
            ? "Camera/Microphone access denied. Please allow access and try again."
            : "Could not access camera or microphone", 
          callStatus: 'idle' 
        });
        toast.error(mediaError.name === 'NotAllowedError' 
          ? "Camera/Microphone access denied"
          : "Could not access camera or microphone");
      }
    } catch (error) {
      console.error("Error starting call:", error);
      
      // Stop the outgoing call sound
      get().stopCallSound();
      
      // Play failed sound
      get().playCallSound('FAILED', { volume: 0.7 });
      
      set({ 
        errorMessage: error.message || "Could not start call", 
        callStatus: 'idle' 
      });
      toast.error(error.message || "Could not start call");
    }
  },
  
  // Answer an incoming call
  answerCall: async () => {
    try {
      // Check WebRTC support
      if (!get().isWebRTCSupported) {
        toast.error("Video/Audio calls are not supported on this browser");
        get().rejectCall();
        return;
      }

      // Initialize call features if not already done
      if (!get().callFeaturesInitialized) {
        const initialized = get().initializeCallFeature();
        if (!initialized) {
          toast.error("Failed to initialize call features");
          get().rejectCall();
          return;
        }
      }
      
      const { call } = get();
      const socket = useChatStore.getState().socket;
      
      if (!call || !socket) {
        set({ errorMessage: "No incoming call information or socket unavailable" });
        toast.error("Failed to answer call - connection not available");
        get().endCall('error');
        return;
      }
      
      // Stop ringtone
      get().stopCallSound();
      
      // Play call accepted sound
      get().playCallSound('ACCEPTED', { volume: 0.7 });
      
      // Set call status
      set({ callStatus: 'ongoing', errorMessage: null });
      
      try {
        // Get user media based on call type
        const constraints = {
          video: call.callType === 'video' ? { width: 640, height: 480 } : false,
          audio: true
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        set({ 
          localStream: stream,
          isVideoOff: call.callType === 'audio'
        });
        
        // Initialize audio tracks
        get().initializeAudioTracks(stream);
        
        // Create peer connection with browser-specific config
        const peer = new Peer({
          initiator: false,
          trickle: false,
          stream: stream,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' }
            ]
          }
        });
        
        // Handle peer events
        peer.on('signal', (signal) => {
          socket.emit('answerCall', { 
            signal, 
            to: call.from.userId 
          });
        });
        
        peer.on('stream', (remoteStream) => {
          set({ remoteStream });
        });
        
        peer.on('error', (error) => {
          console.error("Peer connection error:", error);
          set({ errorMessage: "Connection error" });
          
          // Play failed sound
          get().playCallSound('FAILED', { volume: 0.7 });
          
          get().endCall('error');
        });
        
        // Signal the peer with the incoming call signal
        peer.signal(call.signal);
        
        // Save peer connection
        set({ peer });
        
        // Start timer for call duration
        get().startCallTimer();
      } catch (mediaError) {
        console.error("Error accessing media devices:", mediaError);
        
        // Play failed sound
        get().playCallSound('FAILED', { volume: 0.7 });
        
        set({ 
          errorMessage: mediaError.name === 'NotAllowedError' 
            ? "Camera/Microphone access denied. Please allow access and try again."
            : "Could not access camera or microphone",
          callStatus: 'idle'
        });
        get().rejectCall(); // Reject the call since we can't answer
        toast.error(mediaError.name === 'NotAllowedError' 
          ? "Camera/Microphone access denied"
          : "Could not access camera or microphone");
      }
    } catch (error) {
      console.error("Error answering call:", error);
      
      // Play failed sound
      get().playCallSound('FAILED', { volume: 0.7 });
      
      set({ 
        errorMessage: error.message || "Could not access media devices", 
        callStatus: 'idle' 
      });
      get().rejectCall(); // Reject the call since we can't answer
      toast.error(error.message || "Could not answer call");
    }
  },
  
  // Reject an incoming call
  rejectCall: () => {
    const { call } = get();
    const socket = useChatStore.getState().socket;
    
    // Stop ringtone
    get().stopCallSound();
    
    // Play rejected sound
    get().playCallSound('REJECTED', { volume: 0.7 });
    
    if (call && socket) {
      socket.emit('rejectCall', { to: call.from.userId });
    }
    
    // Reset call state
    set({
      callStatus: 'idle',
      call: null,
      callType: null
    });
  },
  
  // End an ongoing call
  endCall: (reason = 'ended') => {
    const { 
      peer, 
      localStream, 
      callStatus, 
      call
    } = get();
    const socket = useChatStore.getState().socket;
    
    // Stop any playing call sounds
    get().stopCallSound();
    
    // Play end call sound, unless it was rejected or failed (which already played their own sounds)
    if (reason !== 'rejected' && reason !== 'error' && reason !== 'busy') {
      get().playCallSound('ENDED', { volume: 0.7 });
    }
    
    // Only send end call signal if call was actually in progress
    if (socket && (callStatus === 'ongoing' || callStatus === 'calling')) {
      const receiverId = call?.from?.userId || useChatStore.getState().selectedUser?._id;
      if (receiverId) {
        socket.emit('endCall', { to: receiverId });
      }
    }
    
    // Close peer connection if exists
    if (peer) {
      peer.destroy();
    }
    
    // Stop local media streams
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    // Stop call timer
    get().stopCallTimer();
    
    // Reset call state
    set({
      callStatus: 'idle',
      callType: null,
      localStream: null,
      remoteStream: null,
      peer: null,
      call: null,
      isMuted: false,
      isVideoOff: false,
      isMinimized: false,
      errorMessage: null,
    });
  },
  
  // Toggle mute/unmute
  toggleMute: () => {
    const { localStream, isMuted } = get();
    
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
      
      set({ isMuted: !isMuted });
    }
  },
  
  // Initialize audio tracks when call starts
  initializeAudioTracks: (stream) => {
    if (stream) {
      // Ensure audio tracks are enabled by default
      stream.getAudioTracks().forEach(track => {
        track.enabled = true;
      });
      
      // If this is a video call, ensure video tracks are enabled
      const { callType } = get();
      if (callType === 'video') {
        stream.getVideoTracks().forEach(track => {
          track.enabled = true;
        });
      }
    }
  },
  
  // Toggle video on/off
  toggleVideo: () => {
    const { localStream, isVideoOff, callType } = get();
    
    // Only toggle if this is a video call
    if (callType === 'video' && localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = isVideoOff;
      });
      
      set({ isVideoOff: !isVideoOff });
    }
  },
  
  // Toggle call UI minimized state
  toggleMinimize: () => {
    set(state => ({ isMinimized: !state.isMinimized }));
  },
  
  // Call timer functionality
  callTimerInterval: null,
  
  startCallTimer: () => {
    // Clear any existing timer first
    if (get().callTimerInterval) {
      clearInterval(get().callTimerInterval);
    }
    
    // Reset duration
    set({ callDuration: 0 });
    
    // Start a new timer
    const interval = setInterval(() => {
      set(state => ({ callDuration: state.callDuration + 1 }));
    }, 1000);
    
    set({ callTimerInterval: interval });
  },
  
  stopCallTimer: () => {
    if (get().callTimerInterval) {
      clearInterval(get().callTimerInterval);
      set({ callTimerInterval: null });
    }
  },
  
  // Format call duration for display
  formatCallDuration: () => {
    const duration = get().callDuration;
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
    
    // Format as mm:ss or hh:mm:ss if over an hour
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  }
})); 