import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
      ref: "Message",
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
      ref: "Message",
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
    status: {
      type: String,
      enum: ["sent", "unsent", "delivered", "seen"],
      default: "sent",
    },
    seenAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
