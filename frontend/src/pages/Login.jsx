import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login } from "../redux/actions/authActions";
import { toast } from "react-hot-toast";
import axios from "axios";
import { Eye, EyeOff, Google, Facebook, Github, AlertCircle, AlertTriangle } from "lucide-react";
import { Loader2 } from "lucide-react";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [accountStatus, setAccountStatus] = useState(null);
  const emailRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  useEffect(() => {
    if (emailRef.current) {
      emailRef.current.focus();
    }
    
    // Check for OAuth errors in URL parameters
    const query = new URLSearchParams(location.search);
    const error = query.get('error');
    const message = query.get('message');
    
    if (error) {
      if (error === 'account_blocked') {
        setAccountStatus({
          status: 'blocked',
          message: message || 'Your account has been blocked due to violation of our terms of service',
          supportMessage: 'Please contact our support team at support@chatapp.com for assistance'
        });
      } else if (error === 'account_suspended') {
        setAccountStatus({
          status: 'suspended',
          message: message || 'Your account has been temporarily suspended',
          supportMessage: 'Please contact our support team at support@chatapp.com to resolve this issue'
        });
      } else if (error === 'oauth_error' && message) {
        // Check message content for blocked/suspended indicators
        if (message.includes('blocked')) {
          setAccountStatus({
            status: 'blocked',
            message: 'Your account has been blocked due to violation of our terms of service',
            supportMessage: 'Please contact our support team at support@chatapp.com for assistance'
          });
        } else if (message.includes('suspended')) {
          setAccountStatus({
            status: 'suspended',
            message: 'Your account has been temporarily suspended',
            supportMessage: 'Please contact our support team at support@chatapp.com to resolve this issue'
          });
        } else {
          toast.error(message);
        }
      } else if (message) {
        toast.error(message);
      } else {
        toast.error('Authentication failed. Please try again.');
      }
    }
  }, [location]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear any account status error when user starts typing
    if (accountStatus) {
      setAccountStatus(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setAccountStatus(null);
      const res = await axios.post("/api/auth/login", formData);
      
      const data = res.data;
      localStorage.setItem("chat-user", JSON.stringify(data));
      dispatch(login(data));
      toast.success("Login successful!");
      navigate("/");
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Login failed";
      toast.error(errorMessage);
      
      // Special handling for account status issues
      if (error.response?.status === 403) {
        setAccountStatus({
          status: error.response.data.status,
          message: error.response.data.message,
          supportMessage: error.response.data.supportMessage
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderStatusIcon = (status) => {
    if (status === 'suspended') {
      return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
    } else {
      return <AlertCircle className="w-6 h-6 text-red-500" />;
    }
  };

  return (
    <div className="h-screen flex justify-center items-center bg-c1 p-4">
      <div className="flex flex-col items-center">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold mb-2">Welcome back!</h1>
            <p className="text-gray-300">Sign in to continue</p>
          </div>
          
          {accountStatus && (
            <div className={`alert ${
              accountStatus.status === 'suspended' ? 'alert-warning' : 'alert-error'
            } mb-6`}>
              <div className="flex">
                {renderStatusIcon(accountStatus.status)}
                <div className="ml-3">
                  <h3 className="font-bold text-lg">Account {accountStatus.status}</h3>
                  <div className="text-sm mb-2">{accountStatus.message}</div>
                  <div className="text-xs">{accountStatus.supportMessage}</div>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                className="w-full p-3 rounded-md border border-gray-600 bg-c2 text-white focus:border-blue-500 focus:outline-none"
                placeholder="Enter your email"
                ref={emailRef}
                required
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>

            {/* Password field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className="w-full p-3 rounded-md border border-gray-600 bg-c2 text-white focus:border-blue-500 focus:outline-none"
                  placeholder="Enter your password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              <div className="mt-1 text-right">
                <Link
                  to="/forgot-password"
                  className="text-sm text-blue-500 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 py-3 rounded-md text-white font-medium hover:from-indigo-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center justify-center"
              disabled={isLoading || accountStatus?.status === 'blocked'}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>

            {/* Oauth Buttons */}
            <div className="flex flex-col space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-c1 text-gray-400">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <a
                  href="/api/auth/google"
                  className={`w-full flex justify-center py-2.5 px-4 border border-gray-600 rounded-md shadow-sm bg-c2 text-sm font-medium text-gray-300 hover:bg-gray-700 ${
                    accountStatus?.status === 'blocked' ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
                  }`}
                  onClick={(e) => {
                    if (accountStatus?.status === 'blocked') {
                      e.preventDefault();
                      toast.error("Your account is blocked. OAuth login is not available.");
                    }
                  }}
                >
                  <Google className="h-5 w-5" />
                </a>
                <a
                  href="/api/auth/facebook"
                  className={`w-full flex justify-center py-2.5 px-4 border border-gray-600 rounded-md shadow-sm bg-c2 text-sm font-medium text-gray-300 hover:bg-gray-700 ${
                    accountStatus?.status === 'blocked' ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
                  }`}
                  onClick={(e) => {
                    if (accountStatus?.status === 'blocked') {
                      e.preventDefault();
                      toast.error("Your account is blocked. OAuth login is not available.");
                    }
                  }}
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a
                  href="/api/auth/github"
                  className={`w-full flex justify-center py-2.5 px-4 border border-gray-600 rounded-md shadow-sm bg-c2 text-sm font-medium text-gray-300 hover:bg-gray-700 ${
                    accountStatus?.status === 'blocked' ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
                  }`}
                  onClick={(e) => {
                    if (accountStatus?.status === 'blocked') {
                      e.preventDefault();
                      toast.error("Your account is blocked. OAuth login is not available.");
                    }
                  }}
                >
                  <Github className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Registration link */}
            <div className="text-center mt-6">
              <p className="text-gray-400">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="text-blue-500 hover:underline font-medium"
                >
                  Create Account
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login; 