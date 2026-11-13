import { useCallback, useEffect, useRef, useState } from 'react';

export type DashboardResource<T> = {
  status: 'loading' | 'success' | 'error';
  data: T | null;
  error: string | null;
  reload: () => Promise<void>;
};

export function useDashboardResource<T>(fetcher: () => Promise<T>): DashboardResource<T> {
  const generation = useRef(0);
  const [state, setState] = useState<{
    fetcher: typeof fetcher; status: DashboardResource<T>['status']; data: T | null; error: string | null;
  }>({ fetcher, status: 'loading', data: null, error: null });
  const reload = useCallback(async () => {
    const current = ++generation.current;
    setState({ fetcher, status: 'loading', data: null, error: null });
    try {
      const data = await fetcher();
      if (current === generation.current) setState({ fetcher, status: 'success', data, error: null });
    } catch (error) {
      if (current === generation.current) setState({ fetcher, status: 'error', data: null,
        error: error instanceof Error ? error.message : 'Không thể tải dữ liệu.' });
    }
  }, [fetcher]);

  useEffect(() => {
    void reload();
    return () => { generation.current++; };
  }, [reload]);

  return state.fetcher === fetcher ? { ...state, reload } : { status: 'loading', data: null, error: null, reload };
}
