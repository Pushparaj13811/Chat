import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Eye, EyeOff, Loader2, Lock, Mail, MessageSquare, User, KeyRound } from "lucide-react";
import { Link } from "react-router-dom";

import AuthImagePattern from "../components/AuthImagePattern";
import toast from "react-hot-toast";

const SignUpPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1); // Step 1: Signup form, Step 2: OTP verification
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [otp, setOtp] = useState("");

  const { sendOTP, verifyOTP, isSendingOTP, isVerifyingOTP, pendingEmail } = useAuthStore();

  const validateForm = () => {
    if (!formData.fullName.trim()) return toast.error("Full name is required");
    if (!formData.email.trim()) return toast.error("Email is required");
    if (!/\S+@\S+\.\S+/.test(formData.email)) return toast.error("Invalid email format");
    if (!formData.password) return toast.error("Password is required");
    if (formData.password.length < 6) return toast.error("Password must be at least 6 characters");

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (step === 1) {
      // Step 1: Send OTP
      const isValid = validateForm();
      if (isValid === true) {
        try {
          await sendOTP(formData);
          setStep(2);
        } catch (error) {
          console.error("Error sending OTP:", error);
        }
      }
    } else {
      // Step 2: Verify OTP
      if (!otp) {
        return toast.error("Please enter the verification code");
      }

      try {
        await verifyOTP({ email: formData.email, otp });
        // Successful verification will automatically log the user in
      } catch (error) {
        console.error("Error verifying OTP:", error);
      }
    }
  };

  // Render OTP verification step
  if (step === 2) {
    return (
      <div className="min-h-screen grid lg:grid-cols-2">
        {/* left side */}
        <div className="flex flex-col justify-center items-center p-6 sm:p-12">
          <div className="w-full max-w-md space-y-8">
            {/* LOGO */}
            <div className="text-center mb-8">
              <div className="flex flex-col items-center gap-2 group">
                <div
                  className="size-12 rounded-xl bg-primary/10 flex items-center justify-center 
                  group-hover:bg-primary/20 transition-colors"
                >
                  <MessageSquare className="size-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold mt-2">Verify Your Email</h1>
                <p className="text-base-content/60">
                  Enter the verification code sent to {formData.email}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Verification Code</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="size-5 text-base-content/40" />
                  </div>
                  <input
                    type="text"
                    className="input input-bordered w-full pl-10"
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-full" disabled={isVerifyingOTP}>
                {isVerifyingOTP ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Create Account"
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  className="link link-primary"
                  onClick={async () => {
                    try {
                      await sendOTP(formData);
                      toast.success("A new verification code has been sent");
                    } catch (error) {
                      console.error("Error resending OTP:", error);
                    }
                  }}
                  disabled={isSendingOTP}
                >
                  {isSendingOTP ? "Sending..." : "Resend verification code"}
                </button>
              </div>
            </form>

            <div className="text-center">
              <button
                onClick={() => setStep(1)}
                className="link link-primary"
              >
                Back to signup
              </button>
            </div>
          </div>
        </div>

        {/* right side */}
        <AuthImagePattern
          title="Almost there!"
          subtitle="Verify your email to secure your account and get started."
        />
      </div>
    );
  }

  // Render signup form (step 1)
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* left side */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* LOGO */}
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <div
                className="size-12 rounded-xl bg-primary/10 flex items-center justify-center 
              group-hover:bg-primary/20 transition-colors"
              >
                <MessageSquare className="size-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mt-2">Create Account</h1>
              <p className="text-base-content/60">Get started with your free account</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Full Name</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="size-5 text-base-content/40" />
                </div>
                <input
                  type="text"
                  className={`input input-bordered w-full pl-10`}
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Email</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="size-5 text-base-content/40" />
                </div>
                <input
                  type="email"
                  className={`input input-bordered w-full pl-10`}
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Password</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="size-5 text-base-content/40" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  className={`input input-bordered w-full pl-10`}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="size-5 text-base-content/40" />
                  ) : (
                    <Eye className="size-5 text-base-content/40" />
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={isSendingOTP}>
              {isSendingOTP ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Sending Verification...
                </>
              ) : (
                "Continue"
              )}
            </button>
            
            <div className="flex items-center my-4">
              <div className="w-full border-t"></div>
              <p className="px-4 text-base-content/60">or</p>
              <div className="w-full border-t"></div>
            </div>
            <div className="flex justify-center gap-4">
              <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/auth/google`} className="w-12 h-12" title="Google">
                <img
                  src="/images/google-icon.png"
                  alt="Sign up with Google"
                  className="w-full h-full object-cover rounded-full border border-gray-300 hover:shadow-md transition"
                />
              </a>
              <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/auth/facebook`} className="w-12 h-12" title="Facebook">
                <img
                  src="/images/facebook-icon.png"
                  alt="Sign up with Facebook"
                  className="w-full h-full object-cover rounded-full border border-gray-300 hover:shadow-md transition"
                />
              </a>
              <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/auth/github`} className="w-12 h-12" title="Github">
                <img
                  src="/images/github-icon.png"
                  alt="Sign up with GitHub"
                  className="w-full h-full object-cover rounded-full border border-gray-300 hover:shadow-md transition"
                />
              </a>
            </div>
          </form>

          <div className="text-center">
            <p className="text-base-content/60">
              Already have an account?{" "}
              <Link to="/login" className="link link-primary">
                Sign in
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center text-sm">
            <Link to="/terms" className=" link-primary hover:underline mr-4">
              Terms & Conditions
            </Link>
            <Link to="/privacy" className=" link-primary hover:underline mr-4">
              Privacy Policy
            </Link>
            <Link to="/about" className=" link-primary hover:underline mr-4">
              About Us
            </Link>
            <Link to="/developers" className=" link-primary hover:underline">
              Developers
            </Link>
          </div>
        </div>
      </div>

      {/* right side */}
      <AuthImagePattern
        title="Join our community"
        subtitle="Connect with friends, share moments, and stay in touch with your loved ones."
      />
    </div>
  );
};
export default SignUpPage;
