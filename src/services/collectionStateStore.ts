type Entry = { value: unknown; listeners: Set<() => void> };
const entries = new Map<string, Entry>();

function entry<T>(key: string, initial: T, persist: boolean): Entry {
  let result = entries.get(key);
  if (!result) {
    let value = initial;
    if (persist) {
      try {
        const saved = sessionStorage.getItem(key);
        if (saved !== null) value = JSON.parse(saved) as T;
      } catch { /* Use the initial value if storage is unavailable. */ }
    }
    result = { value, listeners: new Set() };
    entries.set(key, result);
  }
  return result;
}

export function readCollectionState<T>(key: string, initial: T, persist = true): T {
  return entry(key, initial, persist).value as T;
}

export function subscribeCollectionState(key: string, listener: () => void) {
  const current = entries.get(key);
  if (!current) throw new Error('Collection state must be initialized before subscribing.');
  current.listeners.add(listener);
  return () => { current.listeners.delete(listener); };
}

export function updateCollectionState<T>(key: string, initial: T, next: T | ((value: T) => T), persist = true) {
  const current = entry(key, initial, persist);
  current.value = typeof next === 'function' ? (next as (value: T) => T)(current.value as T) : next;
  if (persist) {
    try { sessionStorage.setItem(key, JSON.stringify(current.value)); } catch { /* Keep in-memory progress. */ }
  }
  current.listeners.forEach(listener => listener());
}
