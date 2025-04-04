import React, { useState } from "react";
import axios from "axios";
import { Mail } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const base_url = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  
  // Auth check is now handled by GuestRoute component

  const handleForgotPassword = async () => {
    setLoading(true);

    // ✅ Validate Email
    if (!email) {
      toast.error("Email is required.");
      setLoading(false);
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error("Please enter a valid email.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${base_url}/api/auth/forgot-password`, { email });
      toast.success(response.data.message || "Password sent to your email.");
    } catch (err) {
      if(err.message){
        toast.error(err.response.data.message)
      }else{
        toast.error("Something went wrong. Please try again.");
      }
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="w-full max-w-md p-6 rounded-lg shadow-md link-primary">
        <h2 className="text-2xl font-bold text-center mb-4">Forgot Password?</h2>

        {/* ✅ Mail Icon and Label in Same Line */}
        <div className="flex items-center gap-2 mb-2">
          <Mail className="h-5 w-5 text-gray-500" />
          <label className="font-medium">Enter your email</label>
        </div>

        <input
          type="email"
          className="input input-bordered w-full mb-4"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <button
          className="btn btn-primary w-full"
          onClick={handleForgotPassword}
          disabled={loading}
        >
          {loading ? "Sending..." : "Get Password"}
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword;
