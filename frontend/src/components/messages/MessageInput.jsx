import { useState, useRef } from "react";
import { BsSend } from "react-icons/bs";
import { IoImageOutline } from "react-icons/io5";
import { RiCloseLine } from "react-icons/ri";
import { useMessagesContext } from "../../context/MessagesContext";

const MessageInput = ({ setMessages }) => {
  const [message, setMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const imageInputRef = useRef(null);
  
  const { selectedConversation, sendMessage, replyTo, setReplyTo } = useMessagesContext();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedConversation) return;
    if (message === "" && !selectedFile) return;

    setIsLoading(true);

    let imageToSend = null;
    if (selectedFile) {
      imageToSend = await convertFileToBase64(selectedFile);
    }

    try {
      const data = await sendMessage(
        selectedConversation._id, 
        message, 
        imageToSend,
        replyTo?.id
      );
      setMessages((prev) => [...prev, data]);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setMessage("");
      setSelectedFile(null);
      setSelectedImage(null);
      setReplyTo(null);
      setIsLoading(false);
    }
  };

  const handleImageClick = () => {
    imageInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return alert("Please select an image file");
    }

    if (file.size > 1024 * 1024 * 5) {
      return alert("Please select an image smaller than 5MB");
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCancelReply = () => {
    setReplyTo(null);
  };

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center">
      {replyTo && (
        <div className="bg-gray-100 dark:bg-gray-700 w-full p-2 rounded-t-md flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-blue-500 font-semibold flex items-center">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path>
              </svg>
              Replying to {replyTo.senderName}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-md">
              {replyTo.text}
            </span>
          </div>
          <button 
            type="button" 
            onClick={handleCancelReply}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <RiCloseLine size={20} />
          </button>
        </div>
      )}
      
      {selectedImage && (
        <div className="relative w-full">
          <img
            src={selectedImage}
            alt="Selected"
            className="w-full h-48 object-contain"
          />
          <button
            type="button"
            onClick={() => {
              setSelectedFile(null);
              setSelectedImage(null);
            }}
            className="absolute top-1 right-1 bg-gray-800 bg-opacity-50 rounded-full p-1 text-white"
          >
            <RiCloseLine size={20} />
          </button>
        </div>
      )}
      
      <div className="w-full px-4 py-3 bg-white dark:bg-gray-800 rounded-md flex items-center gap-2">
        <button
          type="button"
          onClick={handleImageClick}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <IoImageOutline size={24} />
        </button>
        
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          ref={imageInputRef}
          className="hidden"
        />
        
        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 bg-transparent outline-none text-gray-600 dark:text-gray-300 placeholder-gray-400"
        />
        
        <button
          type="submit"
          disabled={isLoading}
          className={`text-blue-500 hover:text-blue-600 ${
            isLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <BsSend size={20} />
        </button>
      </div>
    </form>
  );
};

export default MessageInput; 