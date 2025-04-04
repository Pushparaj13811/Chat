import { Navigate, Outlet } from "react-router-dom";
import { isAuthenticated } from "../utils/authUtils";
import { useAuthStore } from "../store/useAuthStore";

/**
 * Component that requires authentication to access
 * Redirects to login if not authenticated
 */
export const ProtectedRoute = () => {
  const isAuth = isAuthenticated();
  const { isCheckingAuth } = useAuthStore();
  
  // Don't redirect while checking auth status
  if (isCheckingAuth) {
    return null; // Or return a loading spinner
  }
  
  if (!isAuth) {
    // User is not authenticated, redirect to login
    return <Navigate to="/login" replace />;
  }
  
  // User is authenticated, render the child routes
  return <Outlet />;
};

/**
 * Component that requires guest (not authenticated) status to access
 * Redirects to home if already authenticated
 */
export const GuestRoute = () => {
  const isAuth = isAuthenticated();
  const { isCheckingAuth } = useAuthStore();
  
  // Don't redirect while checking auth status
  if (isCheckingAuth) {
    return null; // Or return a loading spinner
  }
  
  if (isAuth) {
    // User is authenticated, redirect to home
    return <Navigate to="/" replace />;
  }
  
  // User is not authenticated, render the child routes
  return <Outlet />;
}; 