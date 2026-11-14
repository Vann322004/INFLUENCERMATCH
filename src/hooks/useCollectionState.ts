import { useRef, useState, type SetStateAction } from 'react';
import { getAuthSessionId } from '../services/authSession';

// Write when state changes, including requests that finish after leaving the page.
export function useCollectionState<T>(name: string, initial: T) {
  const key = `im_collection:${getAuthSessionId()}:${name}`;
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = sessionStorage.getItem(key);
      return saved === null ? initial : JSON.parse(saved) as T;
    } catch { return initial; }
  });
  const current = useRef(value);
  const update = (next: SetStateAction<T>) => {
    const result = typeof next === 'function' ? (next as (value: T) => T)(current.current) : next;
    current.current = result;
    try { sessionStorage.setItem(key, JSON.stringify(result)); } catch { /* Storage may be full or disabled. */ }
    setValue(result);
  };
  return [value, update] as const;
}
