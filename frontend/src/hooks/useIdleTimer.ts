import { useEffect, useRef } from 'react';

interface UseIdleTimerOptions {
  timeout: number; // in milliseconds
  onIdle: () => void;
  events?: string[];
}

/**
 * Hook to detect user inactivity
 * @param timeout - Time in milliseconds before considering user idle
 * @param onIdle - Callback function to execute when user is idle
 * @param events - Array of events to listen to (default: mousemove, keydown, scroll, click)
 */
export const useIdleTimer = ({ timeout, onIdle, events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'] }: UseIdleTimerOptions) => {
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const resetTimer = () => {
      // Clear existing timeout
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }

      // Set new timeout
      timeoutIdRef.current = setTimeout(() => {
        onIdle();
      }, timeout);
    };

    // Initialize timer
    resetTimer();

    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    // Cleanup
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [timeout, onIdle, events]);
};
