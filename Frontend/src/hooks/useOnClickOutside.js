import { useEffect } from "react";

/**
 * Hook to close a component (modal, dropdown, etc.) when
 * user clicks outside or presses Escape.
 *
 * @param {React.RefObject} ref - The ref to the element you want to detect outside clicks for.
 * @param {Function} onClose - Callback to close the component.
 */
export function useOnClickOutside(ref, onClose) {
  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        onClose();
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [ref, onClose]);
}
