/**
 * Authentication utility functions
 */
import { useAuthStore } from "../store/useAuthStore";

/**
 * Check if user is authenticated from the auth store or localStorage
 * @returns {Object|null} The user object or null if not authenticated
 */
export const getAuthUser = () => {
  // First try to get user from the store
  const storeUser = useAuthStore.getState().authUser;
  if (storeUser) return storeUser;
  
  // If not in store, check localStorage as fallback
  try {
    const userString = localStorage.getItem("user");
    if (!userString) return null;
    
    const user = JSON.parse(userString);
    return user;
  } catch (error) {
    console.error("Error parsing user from localStorage:", error);
    // Clear invalid data
    localStorage.removeItem("user");
    return null;
  }
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if user is authenticated, false otherwise
 */
export const isAuthenticated = () => {
  const user = getAuthUser();
  return user !== null;
}; 