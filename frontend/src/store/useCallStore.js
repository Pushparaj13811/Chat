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
    socket.off("callFailed");
    socket.off("signalingConflict");
    
    // Set global flag to track if this browser tab has an active call
    window._hasActiveCall = window._hasActiveCall || false;
    
    // Handle signaling conflicts (when both sides act as initiators)
    socket.on("signalingConflict", (data) => {
      console.log("Received signaling conflict notification:", data);
      
      const { peer, call } = get();
      if (!peer || !call) {
        console.log("No active peer or call to handle conflict");
        return;
      }
      
      // Determine which side should be the initiator based on user IDs
      // Use a deterministic approach to avoid both sides trying to be the same role
      const { authUser } = useAuthStore.getState();
      if (!authUser) return;
      
      const myId = authUser._id;
      const otherId = data.from;
      
      // Use lexicographical comparison of IDs to decide who's the initiator
      // This ensures both sides make the same decision
      const shouldBeInitiator = myId < otherId;
      
      console.log(`Resolving signaling conflict: My ID: ${myId}, Other ID: ${otherId}, I should be initiator: ${shouldBeInitiator}`);
      
      // If the peer's current initiator state doesn't match what it should be,
      // destroy it and create a new one with the correct role
      if (peer._initiator !== shouldBeInitiator) {
        console.log(`Recreating peer with initiator=${shouldBeInitiator}`);
        
        // Destroy the current peer
        peer.destroy();
        
        // Create a new peer with the correct initiator role
        setTimeout(() => {
          try {
            const stream = get().localStream;
            if (!stream) {
              console.error("No local stream available for peer recreation");
              get().endCall('error');
              return;
            }
            
            const newPeer = new Peer({
              initiator: shouldBeInitiator,
              trickle: false,
              stream: stream,
              config: {
                iceServers: [
                  { urls: 'stun:stun.l.google.com:19302' },
                  { urls: 'stun:global.stun.twilio.com:3478' },
                  {
                    urls: 'turn:numb.viagenie.ca',
                    credential: 'muazkh',
                    username: 'webrtc@live.com'
                  },
                  {
                    urls: 'turn:turn.anyfirewall.com:443?transport=tcp',
                    credential: 'webrtc',
                    username: 'webrtc'
                  }
                ],
                iceCandidatePoolSize: 10,
                sdpSemantics: 'unified-plan'
              }
            });
            
            // Set up event handlers
            newPeer.on('signal', (signal) => {
              console.log(`New peer generated signal: ${signal.type}`);
              
              if (shouldBeInitiator && signal.type === 'offer') {
                // Send offer to the other peer
                socket.emit('callUser', {
                  userToCall: otherId,
                  signal,
                  from: {
                    userId: myId,
                    name: authUser.fullName,
                    profilePic: authUser.profilePic
                  },
                  callType: get().callType,
                  isReconnect: true
                });
              } else if (!shouldBeInitiator && signal.type === 'answer') {
                // Send answer to the other peer
                socket.emit('answerCall', { 
                  signal, 
                  to: otherId,
                  isReconnect: true
                });
              }
            });
            
            newPeer.on('stream', (remoteStream) => {
              set({ remoteStream });
            });
            
            newPeer.on('error', (error) => {
              console.error("Peer connection error during conflict resolution:", error);
              get().endCall('error');
            });
            
            // If we're not the initiator and we received an offer in the conflict data, signal it
            if (!shouldBeInitiator && data.signal && data.signal.type === 'offer') {
              newPeer.signal(data.signal);
            }
            
            // Save the new peer
            set({ peer: newPeer });
            
          } catch (error) {
            console.error("Error recreating peer during conflict resolution:", error);
            get().endCall('error');
          }
        }, 500);
      }
    });
    
    // Handle call failure messages
    socket.on("callFailed", ({ reason, message }) => {
      console.log(`Call failed: ${reason} - ${message}`);
      
      // Stop outgoing call sound
      get().stopCallSound();
      
      // Play error sound
      get().playCallSound('FAILED', { volume: 0.7 });
      
      // Show appropriate message based on reason
      if (reason === "self_call") {
        toast.error("You cannot call yourself on another session");
      } else if (reason === "user_offline") {
        toast.error("User is offline");
      } else {
        toast.error(message || "Call failed");
      }
      
      // End the call attempt
      get().endCall('error');
    });
    
    // Listen for incoming calls
    socket.on("incomingCall", (data) => {
      const { from, callType, signal } = data;
      
      console.log("Received incoming call from:", from.userId, "type:", callType);
      
      // Reject call if WebRTC is not supported
      if (!get().isWebRTCSupported) {
        socket.emit("rejectCall", { to: from.userId });
        toast.error("Video/Audio calls are not supported on this browser");
        return;
      }
      
      // Get current user and ongoing call status
      const { authUser } = useAuthStore.getState();
      const { callStatus, localStream } = get();
      
      // Check if media devices are already in use by checking stream status
      const checkForMediaDeviceAvailability = async () => {
        try {
          // Quick test to see if we can access media devices
          const testConstraints = {
            audio: true,
            video: callType === 'video'
          };
          
          // Try to get a test stream
          const testStream = await navigator.mediaDevices.getUserMedia(testConstraints);
          
          // If successful, we can release the test stream right away
          testStream.getTracks().forEach(track => track.stop());
          
          // Media is available, we can receive the call
          return true;
        } catch (error) {
          console.error("Media device availability check failed:", error);
          return false;
        }
      };
      
      // If user is already in a call or media devices are in use, send busy signal
      if (callStatus === 'ongoing' || callStatus === 'calling' || callStatus === 'ringing') {
        console.log("Sending busy signal - already in a call");
        socket.emit("callBusy", { to: from.userId });
        return;
      }
      
      // Check if we can access media devices
      checkForMediaDeviceAvailability().then(available => {
        if (!available) {
          console.log("Sending busy signal - media devices unavailable");
          socket.emit("callBusy", { to: from.userId });
          return;
        }
        
        // Media is available, we can proceed with the call
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
      
      // Check if any tab/window on this browser already has an active call
      if (window._hasActiveCall) {
        console.log("Another tab already has an active call");
        toast.error("You already have an active call in another tab");
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
      
      // If trying to call self (which can happen with multiple tabs), block it
      if (authUser && userId === authUser._id) {
        toast.error("You cannot call yourself");
        return;
      }
      
      if (!socket || !userId || !authUser) {
        set({ errorMessage: "Missing required information for call" });
        toast.error("Cannot start call - socket connection not available");
        return;
      }
      
      // Set the global flag to indicate this browser has an active call
      window._hasActiveCall = true;
      
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
              { urls: 'stun:global.stun.twilio.com:3478' },
              {
                urls: 'turn:numb.viagenie.ca',
                credential: 'muazkh',
                username: 'webrtc@live.com'
              },
              {
                urls: 'turn:turn.anyfirewall.com:443?transport=tcp',
                credential: 'webrtc',
                username: 'webrtc'
              }
            ],
            iceCandidatePoolSize: 10,
            sdpSemantics: 'unified-plan'
          },
          sdpTransform: (sdp) => {
            // This helps with firewall/NAT traversal
            return sdp.replace(/a=ice-options:trickle\s\n/g, 'a=ice-options:trickle\na=setup:actpass\n');
          }
        });
        
        // Add connection monitoring
        let connectionTimeout = null;
        peer.on('connect', () => {
          console.log("Peer connection established successfully");
          // Clear any pending timeouts
          if (connectionTimeout) {
            clearTimeout(connectionTimeout);
            connectionTimeout = null;
          }
        });

        // Set a timeout for connection establishment
        connectionTimeout = setTimeout(() => {
          console.log("Peer connection timed out, attempting fallback");
          // Try to reconnect with TCP-only and relay-only options
          if (peer && !peer.destroyed) {
            peer.destroy();
            
            // Create a new peer with more restrictive but reliable options
            const fallbackPeer = new Peer({
              initiator: true,
              trickle: false,
              stream: stream,
              config: {
                iceServers: [
                  {
                    urls: 'turn:turn.anyfirewall.com:443?transport=tcp',
                    credential: 'webrtc',
                    username: 'webrtc'
                  },
                  {
                    urls: 'turn:numb.viagenie.ca:443?transport=tcp',
                    credential: 'muazkh',
                    username: 'webrtc@live.com'
                  }
                ],
                iceTransportPolicy: 'relay' // Force using TURN servers
              }
            });
            
            // Copy over the event handlers to the new peer
            fallbackPeer.on('signal', (signal) => {
              socket.emit('callUser', {
                userToCall: userId,
                signal,
                from: {
                  userId: authUser._id,
                  name: authUser.fullName,
                  profilePic: authUser.profilePic
                },
                callType,
                isFallback: true
              });
            });
            
            fallbackPeer.on('stream', (remoteStream) => {
              set({ remoteStream });
            });
            
            fallbackPeer.on('error', (error) => {
              console.error("Fallback peer connection error:", error);
            });
            
            set({ peer: fallbackPeer });
          }
        }, 15000); // 15 seconds timeout

        // Handle ICE candidates for debugging
        peer.on('iceStateChange', (state) => {
          console.log(`ICE state changed to: ${state}`);
          
          // Report state to server for debugging
          if (socket && socket.connected) {
            socket.emit("webrtcState", {
              state: "ice",
              details: { state, timestamp: new Date().toISOString() }
            });
          }
          
          // If we fail to connect, log detailed info
          if (state === 'disconnected' || state === 'failed' || state === 'closed') {
            console.error(`ICE connection failed with state: ${state}`);
            
            // Check if we have the fallback connection
            if (!peer._fallbackAttempted && state === 'failed') {
              console.log("Will attempt fallback connection soon...");
              peer._fallbackAttempted = true;
            }
          }
        });

        peer.on('iceCandidate', (candidate) => {
          // Only log important candidates (skipping the numerous host candidates)
          if (candidate.candidate.includes('typ relay') || candidate.candidate.includes('typ srflx')) {
            console.log(`Generated ICE candidate: ${candidate.candidate}`);
            
            // Report to server for debugging
            if (socket && socket.connected && userId) {
              socket.emit("iceCandidate", {
                to: userId,
                candidate,
                type: 'local'
              });
            }
          }
        });

        // Add signal event handler before connecting
        socket.on("iceCandidate", (data) => {
          if (data.from === userId && peer && !peer.destroyed) {
            console.log(`Received remote ICE candidate: ${data.candidate.candidate}`);
            try {
              peer.signal(data.candidate);
            } catch (error) {
              console.error("Error adding remote ICE candidate:", error);
            }
          }
        });

        // Handle peer events
        peer.on('signal', (signal) => {
          console.log("Generated signal for peer connection", signal.type);
          
          // Track offer/answer state to avoid duplicate signaling
          if (!peer._sentSignal || signal.type === 'offer') {
            peer._sentSignal = true;
            
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
          } else {
            console.log("Skipping duplicate signal emission");
          }
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
      // Reset global flag on error
      window._hasActiveCall = false;
      
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
      
      // Check if any tab/window on this browser already has an active call
      if (window._hasActiveCall) {
        console.log("Another tab already has an active call");
        toast.error("You already have an active call in another tab");
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
      
      // Set the global flag to indicate this browser has an active call
      window._hasActiveCall = true;
      
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
              { urls: 'stun:global.stun.twilio.com:3478' },
              {
                urls: 'turn:numb.viagenie.ca',
                credential: 'muazkh',
                username: 'webrtc@live.com'
              },
              {
                urls: 'turn:turn.anyfirewall.com:443?transport=tcp',
                credential: 'webrtc',
                username: 'webrtc'
              }
            ],
            iceCandidatePoolSize: 10,
            sdpSemantics: 'unified-plan'
          },
          sdpTransform: (sdp) => {
            // This helps with firewall/NAT traversal
            return sdp.replace(/a=ice-options:trickle\s\n/g, 'a=ice-options:trickle\na=setup:actpass\n');
          }
        });
        
        // Signal the incoming call data
        peer.signal(call.signal);
        
        // Add connection monitoring for the answering side
        let answerConnectionTimeout = null;
        peer.on('connect', () => {
          console.log("Answer peer connection established successfully");
          // Clear any pending timeouts
          if (answerConnectionTimeout) {
            clearTimeout(answerConnectionTimeout);
            answerConnectionTimeout = null;
          }
        });

        // Set a timeout for connection establishment
        answerConnectionTimeout = setTimeout(() => {
          console.log("Answer peer connection timed out, attempting fallback");
          // Try to reconnect with TCP-only and relay-only options
          if (peer && !peer.destroyed) {
            peer.destroy();
            
            // Create a new peer with more restrictive but reliable options
            const fallbackPeer = new Peer({
              initiator: false,
              trickle: false,
              stream: stream,
              config: {
                iceServers: [
                  {
                    urls: 'turn:turn.anyfirewall.com:443?transport=tcp',
                    credential: 'webrtc',
                    username: 'webrtc'
                  },
                  {
                    urls: 'turn:numb.viagenie.ca:443?transport=tcp',
                    credential: 'muazkh',
                    username: 'webrtc@live.com'
                  }
                ],
                iceTransportPolicy: 'relay' // Force using TURN servers
              }
            });
            
            // Signal the incoming call data to the fallback peer
            fallbackPeer.signal(call.signal);
            
            // Copy over the event handlers to the new peer
            fallbackPeer.on('signal', (signal) => {
              socket.emit('answerCall', { 
                signal, 
                to: call.from.userId,
                isFallback: true
              });
            });
            
            fallbackPeer.on('stream', (remoteStream) => {
              set({ remoteStream });
            });
            
            fallbackPeer.on('error', (error) => {
              console.error("Fallback answer peer connection error:", error);
            });
            
            set({ peer: fallbackPeer });
          }
        }, 15000); // 15 seconds timeout

        // Handle peer events
        peer.on('signal', (signal) => {
          console.log("Generated answer signal for peer connection", signal.type);
          
          // Only send the answer signal once
          if (!peer._sentAnswer && signal.type === 'answer') {
            peer._sentAnswer = true;
            
            socket.emit('answerCall', { 
              signal, 
              to: call.from.userId 
            });
          } else if (signal.type === 'offer') {
            console.warn("Received offer when expecting to generate answer - signaling conflict");
            
            // Handle the case where both peers generate offers (two initiators)
            // This can happen with same-device calls or timing issues
            if (peer && !peer.destroyed) {
              // Use a flag to keep track of the resolution state
              if (!window._resolvingSignalingConflict) {
                window._resolvingSignalingConflict = true;
                
                console.log("Resolving signaling conflict - destroying peer and recreating as non-initiator");
                
                // Store the signal data for later
                const conflictSignal = signal;
                
                // Destroy current peer connection
                peer.destroy();
                
                // Wait a moment to ensure proper cleanup
                setTimeout(() => {
                  try {
                    // Create a new peer with non-initiator role
                    const newPeer = new Peer({
                      initiator: false,
                      trickle: false,
                      stream: get().localStream,
                      config: peer._config || {
                        iceServers: [
                          { urls: 'stun:stun.l.google.com:19302' },
                          { urls: 'stun:global.stun.twilio.com:3478' },
                          {
                            urls: 'turn:numb.viagenie.ca',
                            credential: 'muazkh',
                            username: 'webrtc@live.com'
                          }
                        ]
                      }
                    });
                    
                    // Handle the original call signal
                    newPeer.signal(call.signal);
                    
                    // Set up event handlers for the new peer
                    newPeer.on('signal', (newSignal) => {
                      if (newSignal.type === 'answer') {
                        socket.emit('answerCall', { 
                          signal: newSignal, 
                          to: call.from.userId 
                        });
                      }
                    });
                    
                    newPeer.on('stream', (remoteStream) => {
                      set({ remoteStream });
                    });
                    
                    newPeer.on('error', (error) => {
                      console.error("Peer connection error:", error);
                      set({ errorMessage: "Connection error" });
                      get().playCallSound('FAILED', { volume: 0.7 });
                      get().endCall('error');
                    });
                    
                    // Save the new peer
                    set({ peer: newPeer });
                    
                    window._resolvingSignalingConflict = false;
                  } catch (error) {
                    console.error("Error recreating peer after conflict:", error);
                    window._resolvingSignalingConflict = false;
                    get().endCall('error');
                  }
                }, 500);
              }
            }
          }
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
      // Reset global flag on error
      window._hasActiveCall = false;
      
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
    
    // Reset global active call flag
    if (window._hasActiveCall) {
      window._hasActiveCall = false;
      console.log("Reset global active call flag");
    }
    
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
    
    // Stop local media streams - IMPORTANT for multiple accounts on same device
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopping track: ${track.kind} with ID ${track.id}`);
      });
    }
    
    // Force garbage collection to help release camera resources
    setTimeout(() => {
      console.log("Performing cleanup after call end");
      // Force null assignment to help with garbage collection
      set({
        localStream: null,
        remoteStream: null,
        peer: null,
      });
    }, 100);
    
    // Stop call timer
    get().stopCallTimer();
    
    // Reset call state
    set({
      callStatus: 'idle',
      callType: null,
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