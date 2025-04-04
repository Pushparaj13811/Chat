import { useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { toast } from "react-hot-toast";
import { X } from "lucide-react";

const EditMessageModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messageId, setMessageId] = useState(null);
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { editMessage } = useChatStore();

  useEffect(() => {
    // Listen for the editMessage event
    const handleEditMessageEvent = (event) => {
      const { messageId, text } = event.detail;
      setMessageId(messageId);
      setText(text);
      setIsOpen(true);
    };

    window.addEventListener("editMessage", handleEditMessageEvent);

    return () => {
      window.removeEventListener("editMessage", handleEditMessageEvent);
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setMessageId(null);
    setText("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!text.trim()) {
      toast.error("Message cannot be empty");
      return;
    }

    setIsSubmitting(true);
    try {
      await editMessage(messageId, text.trim());
      handleClose();
      toast.success("Message updated");
    } catch (error) {
      console.error("Error editing message:", error);
      toast.error("Failed to edit message");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-base-100 rounded-lg p-4 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Edit Message</h3>
          <button 
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-base-200"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="textarea textarea-bordered w-full h-24 mb-4"
            placeholder="Edit your message..."
            autoFocus
          />
          
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-sm btn-ghost"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-sm btn-primary"
              disabled={isSubmitting || !text.trim()}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMessageModal; 