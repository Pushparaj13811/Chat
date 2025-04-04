import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { axiosInstance } from '../lib/axios';

const OAuthSuccessPage = () => {
  const navigate = useNavigate();
  const { authUser, handleOAuthLogin } = useAuthStore();
  const [error, setError] = useState(null);
  const [statusError, setStatusError] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // If user is already authenticated, redirect to home
    if (authUser) {
      navigate('/');
      return;
    }
    
    const handleOAuthRedirect = async () => {
      try {
        setLoading(true);
        
        // Check if error is directly passed in URL
        const params = new URLSearchParams(window.location.search);
        const urlError = params.get('error');
        const errorMessage = params.get('message');
        
        // Handle direct error redirects
        if (urlError) {
          if (urlError === 'account_blocked' || urlError === 'account_suspended') {
            setStatusError({
              type: urlError,
              message: errorMessage || (urlError === 'account_blocked' 
                ? 'Your account has been blocked due to violation of our terms of service' 
                : 'Your account has been temporarily suspended')
            });
            
            // Redirect to login with proper error params after 3 seconds
            setTimeout(() => {
              navigate(`/login?error=${urlError}&message=${encodeURIComponent(errorMessage || '')}`);
            }, 10000);
            return;
          }
          
          setError(errorMessage || 'Authentication failed');
          toast.error(errorMessage || 'Authentication failed');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        
        // Get token from URL query params
        const token = params.get('token');
        
        if (!token) {
          setError('Authentication failed. No token received.');
          toast.error('Authentication failed. No token received.');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        
        // Store token in localStorage and set axios default header
        localStorage.setItem('token', token);
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Fetch user data
        const response = await axiosInstance.get('/api/auth/check', {
          headers: {
            Authorization: `Bearer ${token}`
          },
          withCredentials: true
        });
        
        if (!response.data) {
          throw new Error('Failed to retrieve user data');
        }
        
        // Check if user account is blocked or suspended
        if (response.data.status === 'blocked' || response.data.status === 'suspended') {
          const statusType = response.data.status;
          const errorMsg = statusType === 'blocked'
            ? 'Your account has been blocked due to violation of our terms of service'
            : 'Your account has been temporarily suspended';
            
          setStatusError({
            type: statusType,
            message: errorMsg
          });
          
          // Clean up any invalid tokens
          localStorage.removeItem('token');
          delete axiosInstance.defaults.headers.common['Authorization'];
          
          // Redirect to login with proper error params after 3 seconds
          setTimeout(() => {
            navigate(`/login?error=account_${statusType}&message=${encodeURIComponent(errorMsg)}`);
          }, 3000);
          return;
        }
        
        // Use the store method to handle login
        const success = await handleOAuthLogin(response.data, token);
        
        if (success) {
          toast.success('Successfully signed in!');
          navigate('/');
        } else {
          throw new Error('Failed to complete authentication');
        }
      } catch (error) {
        console.error('OAuth redirect error:', error);
        
        // Check if error message indicates account status issues
        const errorMessage = error.response?.data?.message || error.message || 'Authentication failed';
        
        if (errorMessage.includes('blocked')) {
          setStatusError({
            type: 'blocked',
            message: 'Your account has been blocked due to violation of our terms of service'
          });
          setTimeout(() => {
            navigate('/login?error=account_blocked&message=' + encodeURIComponent(errorMessage));
          }, 3000);
        } else if (errorMessage.includes('suspended')) {
          setStatusError({
            type: 'suspended',
            message: 'Your account has been temporarily suspended'
          });
          setTimeout(() => {
            navigate('/login?error=account_suspended&message=' + encodeURIComponent(errorMessage));
          }, 3000);
        } else {
          setError('Authentication failed. Please try again.');
          toast.error('Authentication failed. Please try again.');
          setTimeout(() => navigate('/login'), 2000);
        }
        
        // Clean up any invalid tokens
        localStorage.removeItem('token');
        delete axiosInstance.defaults.headers.common['Authorization'];
      } finally {
        setLoading(false);
      }
    };
    
    handleOAuthRedirect();
  }, [authUser, handleOAuthLogin, navigate]);
  
  if (statusError) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-center px-4">
        <div className={`bg-${statusError.type === 'blocked' ? 'error' : 'warning'}/10 p-6 rounded-lg mb-4`}>
          <AlertCircle className={`w-12 h-12 mx-auto mb-4 text-${statusError.type === 'blocked' ? 'error' : 'warning'}`} />
          <h2 className="text-xl font-bold mb-2">Account {statusError.type}</h2>
          <p className="text-base-content font-medium mb-4">{statusError.message}</p>
          <p className="text-base-content/60">
            Please contact our support team at support@chatapp.com for assistance
          </p>
        </div>
        <p className="text-base-content/60 mt-4">Redirecting you to login...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-center px-4">
        <div className="bg-error/10 p-4 rounded-lg mb-4">
          <p className="text-error font-medium">{error}</p>
        </div>
        <p className="text-base-content/60 mt-2">Redirecting you to login...</p>
      </div>
    );
  }
  
  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
      <h2 className="text-xl font-medium mt-4">Authenticating...</h2>
      <p className="text-base-content/60 mt-2">Please wait while we complete the sign-in process</p>
    </div>
  );
};

export default OAuthSuccessPage; 