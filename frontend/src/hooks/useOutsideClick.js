import { useEffect } from "react";

/**
 * A hook that triggers a callback when a click occurs outside of the specified ref
 * @param {React.RefObject} ref - The ref object that wraps the element to monitor for outside clicks
 * @param {Function} callback - The callback function to trigger when an outside click is detected
 */
export const useOutsideClick = (ref, callback) => {
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, callback]);
}; 