import { useRef, useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { Image as ImageIcon, Send, X, Mic, File, StopCircle, Play, Pause, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [attachmentType, setAttachmentType] = useState(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioPreviewRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const { sendMessage, selectedUser, replyTo, setReplyTo } = useChatStore();
  const { authUser } = useAuthStore();

  // Format recording time as mm:ss
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Update recording timer
  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(recordingTimerRef.current);
    }

    return () => clearInterval(recordingTimerRef.current);
  }, [isRecording]);

  // Handle audio preview playback
  useEffect(() => {
    if (audioPreviewRef.current) {
      audioPreviewRef.current.onplay = () => setIsPreviewPlaying(true);
      audioPreviewRef.current.onpause = () => setIsPreviewPlaying(false);
      audioPreviewRef.current.onended = () => setIsPreviewPlaying(false);
    }
  }, [audioPreviewUrl]);

  // Compress image before upload
  const compressImage = (file, maxWidth = 1200, quality = 0.8) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image(); // Use window.Image to ensure we're using the browser's Image constructor
        img.src = event.target.result;
        
        img.onload = () => {
          // Create canvas
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions if needed
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw image on canvas with new dimensions
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to blob with reduced quality
          canvas.toBlob(
            (blob) => {
              resolve(blob);
            },
            'image/jpeg',
            quality
          );
        };
      };
    });
  };

  // Handle file upload
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (limit to 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File size exceeds 10MB limit");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Check file type
    if (file.type.startsWith("image/")) {
      try {
        // Compress image before setting preview
        const compressedImage = await compressImage(file);
        
        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(compressedImage);
        
        // Save the compressed blob for later upload
        setAttachment(compressedImage);
        setAttachmentType("image");
      } catch (error) {
        console.error("Error compressing image:", error);
        // Fallback to original image
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
        setAttachment(file);
        setAttachmentType("image");
      }
    } else if (file.type.startsWith("audio/")) {
      const audio = new Audio(URL.createObjectURL(file));
      audio.onloadedmetadata = () => {
        setAudioDuration(audio.duration);
        setAttachment(file);
        setAttachmentType("voice");
        setAudioPreviewUrl(URL.createObjectURL(file));
      };
    } else {
      // Handle other file types (documents)
      setAttachment(file);
      setAttachmentType("document");
    }
  };

  // Handle voice recording
  const startRecording = async () => {
    try {
      // Reset recording state
      setRecordingTime(0);
      setAudioPreviewUrl(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
        audioBitsPerSecond: 128000 // Lower bitrate for smaller file size
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Start the recording timer
      const startTime = Date.now();
      const MAX_RECORDING_DURATION = 60; // 60 seconds max
      
      const recordingInterval = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        setRecordingTime(elapsedSeconds);
        
        if (elapsedSeconds >= MAX_RECORDING_DURATION) {
          clearInterval(recordingInterval);
          stopRecording();
          toast.info("Maximum recording time reached (60 seconds)");
        }
      }, 1000);

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        clearInterval(recordingInterval);
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        
        // Check blob size
        if (audioBlob.size > 10 * 1024 * 1024) {
          toast.error("Audio file is too large. Please record a shorter message");
          setIsRecording(false);
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        // Calculate actual duration 
        const actualDuration = Math.floor((Date.now() - startTime) / 1000);
        
        // Create URL for preview playback
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioPreviewUrl(audioUrl);
        
        // Store duration on the blob as a property
        const blobWithDuration = new Blob(audioChunksRef.current, { 
          type: "audio/webm" 
        });
        blobWithDuration.duration = actualDuration;
        blobWithDuration.name = "voice_message.webm";
        
        setAttachment(blobWithDuration);
        setAttachmentType("voice");
        setAudioDuration(actualDuration);
        setIsRecording(false);
        stream.getTracks().forEach(track => track.stop());
        
        // Verify the duration value in console
        console.log("Recorded audio duration:", actualDuration);
      };

      mediaRecorder.start(1000); // Collect data in 1-second chunks
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Could not access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const toggleAudioPreview = () => {
    if (audioPreviewRef.current) {
      if (isPreviewPlaying) {
        audioPreviewRef.current.pause();
      } else {
        audioPreviewRef.current.play();
      }
    }
  };

  const removeAttachment = () => {
    setImagePreview(null);
    setAttachment(null);
    setAttachmentType(null);
    setAudioDuration(0);
    setAudioPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Clear replyTo when changing conversations
  useEffect(() => {
    if (replyTo && selectedUser) {
      // Clear reply if we change conversation
      if (replyTo.senderId !== selectedUser._id && replyTo.senderId !== authUser._id) {
        setReplyTo(null);
      }
    }
  }, [selectedUser, replyTo, setReplyTo]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !attachment) return;
    if (!selectedUser || !selectedUser._id) {
      toast.error("No recipient selected");
      return;
    }

    try {
      // Send the message in the background (message will appear instantly in UI)
      sendMessage(
        selectedUser._id,
        text.trim(),
        attachment,
        attachmentType,
        replyTo?._id
      );

      // Clear form immediately after sending
      setText("");
      setImagePreview(null);
      setAttachment(null);
      setAttachmentType(null);
      setAudioDuration(0);
      setAudioPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      // Clear reply after sending
      if (replyTo) {
        setReplyTo(null);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      // Error handling is done in the sendMessage function
    }
  };

  return (
    <div className="p-4 w-full">
      {/* Reply preview */}
      {replyTo && (
        <div className="mb-3 px-3 py-2 bg-base-300/40 rounded-lg flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <div className="flex-1">
            <span className="text-xs font-medium block">
              Replying to {replyTo.senderId === selectedUser._id ? selectedUser.name : 'yourself'}
            </span>
            <span className="text-sm block truncate opacity-75">
              {replyTo.text || (replyTo.type === 'voice' ? 'Voice message' : 'Attachment')}
            </span>
          </div>
          <button
            onClick={() => setReplyTo(null)}
            className="p-1 hover:bg-base-300 rounded-full"
            type="button"
          >
            <X className="size-3" />
          </button>
        </div>
      )}

      {/* Image preview */}
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
            />
            <button
              onClick={removeAttachment}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
              flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      {isRecording && (
        <div className="mb-3 px-3 py-2 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400">
          <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
          <span className="text-sm font-medium">Recording {formatTime(recordingTime)}</span>
        </div>
      )}

      {audioPreviewUrl && !isRecording && attachmentType === "voice" && (
        <div className="mb-3">
          <div className="relative flex items-center gap-2 p-2 bg-base-300 rounded-lg">
            <button
              onClick={toggleAudioPreview}
              className="w-8 h-8 flex items-center justify-center bg-primary text-primary-content rounded-full"
            >
              {isPreviewPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <div className="flex-1">
              <span className="text-sm block">Voice message</span>
              <div className="flex items-center">
                <span className="text-xs text-white font-medium">
                  {formatTime(audioDuration)}
                </span>
                <button
                  onClick={removeAttachment}
                  className="ml-auto p-1 hover:bg-base-200 rounded-full"
                  type="button"
                >
                  <X className="size-3" />
                </button>
              </div>
            </div>
            <audio ref={audioPreviewRef} src={audioPreviewUrl} className="hidden" />
          </div>
        </div>
      )}

      {attachment && attachmentType === "document" && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative flex items-center gap-2 p-2 bg-base-300 rounded-lg">
            <File size={20} />
            <span className="text-sm truncate">
              {attachment.name || "File"}
            </span>
            <button
              onClick={removeAttachment}
              className="p-1 hover:bg-base-200 rounded-full"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <input
            type="file"
            accept="image/*,audio/*,.pdf,.doc,.docx,.txt"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />

          <button
            type="button"
            className={`hidden sm:flex btn btn-circle
                     ${attachment ? "text-emerald-500" : "text-zinc-400"}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <File size={20} />
          </button>

          <button
            type="button"
            className={`btn btn-circle ${isRecording ? "text-error" : "text-zinc-400"}`}
            onClick={isRecording ? stopRecording : startRecording}
          >
            {isRecording ? <StopCircle size={20} /> : <Mic size={20} />}
          </button>
        </div>
        <button
          type="submit"
          className="btn btn-sm btn-circle"
          disabled={!text.trim() && !attachment}
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
