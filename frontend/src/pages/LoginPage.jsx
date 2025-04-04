import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import AuthImagePattern from "../components/AuthImagePattern";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock, Mail, MessageSquare } from "lucide-react";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const { login, isLoggingIn } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    login(formData);
  };

  return (
    <div className="h-screen grid lg:grid-cols-2">
      {/* Left Side - Form */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <div
                className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20
              transition-colors"
              >
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mt-2">Welcome Back</h1>
              <p className="text-base-content/60">Sign in to your account</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Email</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-base-content/40" />
                </div>
                <input
                  type="email"
                  className={`input input-bordered w-full pl-10`}
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Password</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-base-content/40" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  className={`input input-bordered w-full pl-10`}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />

                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-base-content/40" />
                  ) : (
                    <Eye className="h-5 w-5 text-base-content/40" />
                  )}
                </button>
              </div>
            </div>

            <div className="text-right mt-2">
              <Link to="/forgot-password" className="link link-primary">
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading...
                </>
              ) : (
                "Sign in"
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
                  alt="Sign in with Google"
                  className="w-full h-full object-cover rounded-full border border-gray-300 hover:shadow-md transition"
                />
              </a>
              <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/auth/facebook`} className="w-12 h-12" title="Facebook">
                <img
                  src="/images/facebook-icon.png"
                  alt="Sign in with Facebook"
                  className="w-full h-full object-cover rounded-full border border-gray-300 hover:shadow-md transition"
                />
              </a>
              <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/auth/github`} className="w-12 h-12" title="Github">
                <img
                  src="/images/github-icon.png"
                  alt="Sign in with GitHub"
                  className="w-full h-full object-cover rounded-full border border-gray-300 hover:shadow-md transition"
                />
              </a>
            </div>
          </form>

          <div className="text-center">
            <p className="text-base-content/60">
              Don&apos;t have an account?{" "}
              <Link to="/signup" className="link link-primary">
                Create account
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

      {/* Right Side - Image/Pattern */}
      <AuthImagePattern
        title={"Welcome back!"}
        subtitle={
          "Sign in to continue your conversations and catch up with your messages."
        }
      />
    </div>
  );
};
export default LoginPage;
