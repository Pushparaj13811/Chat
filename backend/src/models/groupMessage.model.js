import mongoose from "mongoose";

const groupMessageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    text: {
      type: String,
    },
    // Fields for different types of attachments
    type: {
      type: String,
      enum: ["text", "image", "voice", "document"],
      default: "text"
    },
    image: {
      type: String,
    },
    attachment: {
      type: String,
    },
    fileName: {
      type: String,
    },
    duration: {
      type: Number,
    },
    reactions: {
      type: Map,
      of: {
        type: Array,
        default: [],
      },
      default: new Map(),
    },
    // Fields for forwarded messages
    isForwarded: {
      type: Boolean,
      default: false,
    },
    originalMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GroupMessage",
    },
    originalSenderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    originalSenderName: {
      type: String,
    },
    // Fields for reply functionality
    isReply: {
      type: Boolean,
      default: false,
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GroupMessage",
    },
    // Fields for edit functionality
    isEdited: {
      type: Boolean,
      default: false,
    },
    editHistory: [
      {
        text: String,
        editedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Fields for delete functionality
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Fields for pin functionality
    isPinned: {
      type: Boolean,
      default: false
    },
    pinnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    pinnedAt: {
      type: Date
    },
    // Fields for message status tracking
    readBy: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      readAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  { timestamps: true }
);

const GroupMessage = mongoose.model("GroupMessage", groupMessageSchema);

export default GroupMessage; 