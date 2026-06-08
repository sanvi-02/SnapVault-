import { useState, useEffect } from "react";

/**
 * Debounce a value by a given delay.
 * @param {*} value — value to debounce
 * @param {number} delay — delay in ms (default 300)
 * @returns {*} — debounced value
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
