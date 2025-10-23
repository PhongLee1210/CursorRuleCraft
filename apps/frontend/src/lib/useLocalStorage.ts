import { useCallback, useState } from 'react';

/**
 * Custom useLocalStorage hook that properly handles both string and object values
 * Unlike usehooks-ts useLocalStorage which tries to parse everything as JSON,
 * this hook stores string values directly and handles type conversion safely.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const isStringType = typeof initialValue === 'string';
  // Get initial value from localStorage or use provided initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      // If no item exists, return initial value
      if (item === null) {
        return initialValue;
      }

      // Handle string types vs object types differently
      if (isStringType) {
        // For strings, try JSON parse first, then fallback to plain string
        try {
          const parsed = JSON.parse(item);
          return (typeof parsed === 'string' ? parsed : item) as T;
        } catch {
          return item as T;
        }
      } else {
        // For objects, always use JSON parse
        try {
          return JSON.parse(item) as T;
        } catch {
          return initialValue;
        }
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists to localStorage
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Allow value to be a function so we have the same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value;

        // Save state
        setStoredValue(valueToStore);

        // Save to localStorage
        if (typeof window !== 'undefined') {
          // For objects, stringify them. For strings, store directly.
          const stringValue = isStringType ? String(valueToStore) : JSON.stringify(valueToStore);
          window.localStorage.setItem(key, stringValue);
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue, isStringType]
  );

  return [storedValue, setValue];
}
