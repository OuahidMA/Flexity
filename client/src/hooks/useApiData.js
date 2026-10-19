/**
 * Declarative GET-data hook for dashboard pages.
 *
 * Wraps the authenticated `request` helper, exposes `{ data, loading, error,
 * refresh, setData }`, and cancels in-flight requests on unmount or when the
 * path changes. `setData` lets pages apply optimistic updates after mutations.
 */
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

/**
 * Fetch and track a single API resource.
 *
 * @param {string|null} path - Endpoint to GET; null/invalid skips fetching.
 * @param {{ enabled?: boolean }} [options] - Set `enabled` false to defer the
 *   request (e.g. an edit form waiting for its route param).
 * @returns {{
 *   data: any,
 *   loading: boolean,
 *   error: Error|null,
 *   refresh: () => void,
 *   setData: React.Dispatch<React.SetStateAction<any>>,
 * }} Data state plus a manual refresh trigger and local cache setter.
 */
export function useApiData(path, { enabled = true } = {}) {
  const { request } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(enabled && path));
  const [error, setError] = useState(null);
  // Bumped by `refresh`; included in the effect deps to re-run the request.
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!enabled || !path) return undefined;

    // AbortController cancels the network call; `cancelled` guards state updates
    // from responses that resolve after cleanup.
    const controller = new AbortController();
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await request(path, { signal: controller.signal });
        if (!cancelled) setData(result);
      } catch (requestError) {
        if (cancelled || requestError.name === "AbortError") return;
        setError(requestError);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [path, request, enabled, version]);

  /**
   * Re-run the current request without changing the path. Existing data stays
   * visible while the new request is in flight.
   */
  const refresh = useCallback(() => {
    setVersion((current) => current + 1);
  }, []);

  return {
    data,
    loading: enabled && path ? loading : false,
    error,
    refresh,
    setData,
  };
}

export default useApiData;
