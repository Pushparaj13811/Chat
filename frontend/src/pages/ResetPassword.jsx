import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Lock, KeyRound, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token"); // Extract token from query params
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const base_url = import.meta.env.VITE_API_URL;

    // Auth check is now handled by GuestRoute component

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!token) {
            toast.error("Invalid or missing token.");
            setLoading(false);
            return;
        }

        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters long.");
            setLoading(false);
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match.");
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${base_url}/api/auth/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword }),
            });

            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }

            const data = await response.json();
            toast.success(data.message || "Password reset successful!");
            
            // Redirect to login page after 2 seconds
            setTimeout(() => {
                navigate("/login");
            }, 2000);
        } catch (error) {
            console.error("Reset password error:", error);
            toast.error("Failed to reset password. The link may be expired or invalid.");
        }

        setLoading(false);
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-base-200">
            <div className="w-full max-w-md p-6 rounded-lg shadow-md bg-base-100">
                <h2 className="text-2xl font-bold text-center mb-4">Reset Your Password</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <KeyRound className="h-5 w-5 text-gray-500" />
                            <label className="font-medium">New Password</label>
                        </div>
                        <input
                            type="password"
                            className="input input-bordered w-full"
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                    </div>
                    
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Lock className="h-5 w-5 text-gray-500" />
                            <label className="font-medium">Confirm Password</label>
                        </div>
                        <input
                            type="password"
                            className="input input-bordered w-full"
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    
                    <button
                        type="submit"
                        className="btn btn-primary w-full"
                        disabled={loading}
                    >
                        {loading ? "Processing..." : "Reset Password"}
                    </button>
                    
                    <div className="text-center">
                        <a 
                            href="/login" 
                            className="flex items-center justify-center gap-1 text-primary hover:underline"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Login
                        </a>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
