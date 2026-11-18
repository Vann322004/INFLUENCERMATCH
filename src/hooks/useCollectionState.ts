import { useCallback, useSyncExternalStore, type SetStateAction } from 'react';
import { getAuthSessionId } from '../services/authSession';
import { readCollectionState, subscribeCollectionState, updateCollectionState } from '../services/collectionStateStore';

// Write when state changes, including requests that finish after leaving the page.
export function useCollectionState<T>(name: string, initial: T, persist = true) {
  const key = `im_collection:${getAuthSessionId()}:${name}`;
  const snapshot = () => readCollectionState(key, initial, persist);
  const subscribe = useCallback((listener: () => void) => subscribeCollectionState(key, listener), [key]);
  const value = useSyncExternalStore(subscribe, snapshot);
  const update = (next: SetStateAction<T>) => updateCollectionState(key, initial, next, persist);
  return [value, update] as const;
}
