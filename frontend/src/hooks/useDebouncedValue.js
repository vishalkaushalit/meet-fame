import { useEffect, useState } from 'react';

// Keep typing immediate while delaying network requests until input settles.
export default function useDebouncedValue(value, delay = 250) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      return setDebouncedValue(value);
    }, delay);
    return () => {
      return clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
