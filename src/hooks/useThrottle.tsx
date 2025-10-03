import { useEffect, useRef, useState } from 'react';

/**
 * Throttle hook to limit how often a value can update
 * Useful for scroll events, resize events, etc.
 */
export function useThrottle<T>(value: T, interval: number = 500): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastExecuted = useRef<number>(Date.now());

  useEffect(() => {
    if (Date.now() >= lastExecuted.current + interval) {
      lastExecuted.current = Date.now();
      setThrottledValue(value);
    } else {
      const timerId = setTimeout(() => {
        lastExecuted.current = Date.now();
        setThrottledValue(value);
      }, interval);

      return () => clearTimeout(timerId);
    }
  }, [value, interval]);

  return throttledValue;
}

/**
 * Throttle callback function
 */
export function useThrottleCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500
): T {
  const lastRan = useRef(Date.now());

  return ((...args) => {
    if (Date.now() - lastRan.current >= delay) {
      callback(...args);
      lastRan.current = Date.now();
    }
  }) as T;
}