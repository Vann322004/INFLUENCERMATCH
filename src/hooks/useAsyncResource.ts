import { useCallback, useEffect, useRef, useState } from 'react';
import type { CacheHit } from '../services/requestCache';

type Fetcher<T> = (() => Promise<T>) & { peek?: () => CacheHit<T> | undefined; invalidate?: () => void };
export type AsyncResource<T> = {
  status: 'loading' | 'success' | 'error'; data: T | null; error: string | null; reload: () => Promise<void>;
};

export function useAsyncResource<T>(fetcher: Fetcher<T>, enabled = true): AsyncResource<T> {
  const generation = useRef(0);
  const [state, setState] = useState<{
    fetcher: Fetcher<T>; status: AsyncResource<T>['status']; data: T | null; error: string | null;
  }>(() => {
    const hit = enabled ? fetcher.peek?.() : undefined;
    return { fetcher, status: hit ? 'success' : 'loading', data: hit ? hit.value : null, error: null };
  });

  const load = useCallback(async (force: boolean) => {
    if (!enabled) return;
    const current = ++generation.current;
    if (force) fetcher.invalidate?.();
    const hit = fetcher.peek?.();
    if (hit) {
      setState({ fetcher, status: 'success', data: hit.value, error: null });
      return;
    }
    setState({ fetcher, status: 'loading', data: null, error: null });
    try {
      const data = await fetcher();
      if (current === generation.current) setState({ fetcher, status: 'success', data, error: null });
    } catch (error) {
      if (current === generation.current) setState({ fetcher, status: 'error', data: null,
        error: error instanceof Error ? error.message : 'Không thể tải dữ liệu.' });
    }
  }, [fetcher, enabled]);

  const reload = useCallback(() => load(true), [load]);
  useEffect(() => {
    void load(false);
    return () => { generation.current++; };
  }, [load]);

  if (!enabled) return { status: 'loading', data: null, error: null, reload };
  if (state.fetcher !== fetcher) {
    const hit = fetcher.peek?.();
    return { status: hit ? 'success' : 'loading', data: hit ? hit.value : null, error: null, reload };
  }
  return { status: state.status, data: state.data, error: state.error, reload };
}
