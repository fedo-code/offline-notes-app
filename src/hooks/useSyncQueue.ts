import { useCallback, useEffect, useRef, useState } from "react";
import useLocalStorage from "./useLocalStorage";
import { syncNote } from "../services/syncService";
type InternalSyncAction = { actionId: string; payload: any; retries?: number };

export function useSyncQueue(options?: {
  onSynced?: (action: InternalSyncAction) => void;
  onError?: (action: InternalSyncAction) => void;
}) {
  const [syncQueue, setSyncQueue] = useLocalStorage<InternalSyncAction[]>("syncQueue", []);
  const [failedQueue, setFailedQueue] = useLocalStorage<InternalSyncAction[]>("syncFailed", []);
  const [syncStatus, setSyncStatus] = useState<"synced" | "pending" | "error">("synced");

  const [mswReady, setMswReady] = useState(false);
  const [mswAvailable, setMswAvailable] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);

  const processingRef = useRef(false);
  const MAX_RETRIES = 3;
  const BASE_DELAY_MS = 1000; // 1s base

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    if (typeof window !== "undefined") {
      window.addEventListener("online", onOnline);
      window.addEventListener("offline", onOffline);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online", onOnline);
        window.removeEventListener("offline", onOffline);
      }
    };
  }, []);

  // Start MSW worker (same as before)
  useEffect(() => {
    if (typeof window === "undefined") {
      setMswReady(true);
      return;
    }
    let mounted = true;
    import("../mocks/browser")
      .then(async ({ worker }) => {
        try {
          await worker.start();
          if (mounted) {
            setMswAvailable(true);
            setMswReady(true);
          }
        } catch {
          // ignore start errors
        } finally {
          if (mounted) setMswReady(true);
        }
      })
      .catch(() => {
        if (mounted) {
          setMswAvailable(false);
          setMswReady(true);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  // helper delay
  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

  // Processor effect
  useEffect(() => {
    if (!mswReady) return;
    if (!isOnline) {
      setSyncStatus("pending");
      return;
    }
    if (processingRef.current) return;
    if (!syncQueue || syncQueue.length === 0) {
      const hasError = (failedQueue ?? []).length > 0;
      setSyncStatus(hasError ? "error" : "synced");
      return;
    }

    processingRef.current = true;
    (async () => {
      try {
        // iterate over a snapshot to avoid issues with updates during processing
        const snapshot = [...(syncQueue ?? [])];
        for (const action of snapshot) {
          if (!action) continue;
          let attempts = action.retries ?? 0;
          let done = false;
          while (attempts <= MAX_RETRIES && !done) {
            setSyncStatus("pending");
            const res = await syncNote(action);
            if (res === "synced") {
              // remove from pending queue
              setSyncQueue((prev) => (prev ?? []).filter((a) => a.actionId !== action.actionId));
              options?.onSynced?.(action);
              done = true;
              break;
            } else {
              attempts += 1;
              // persist retries
              setSyncQueue((prev) => (prev ?? []).map((a) => (a.actionId === action.actionId ? { ...a, retries: attempts } : a)));
              if (attempts > MAX_RETRIES) {
                // move to failed queue
                setFailedQueue((prev) => [...(prev ?? []), { ...action, retries: attempts }]);
                setSyncQueue((prev) => (prev ?? []).filter((a) => a.actionId !== action.actionId));
                options?.onError?.(action);
                setSyncStatus("error");
                done = true;
                break;
              } else {
                const backoff = BASE_DELAY_MS * Math.pow(2, attempts - 1);
                await delay(backoff);
                // loop will retry
              }
            }
          }
        }
      } finally {
        processingRef.current = false;
        const hasPending = (syncQueue ?? []).length > 0;
        const hasError = (failedQueue ?? []).length > 0;
        setSyncStatus(hasError ? "error" : hasPending ? "pending" : "synced");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mswReady, isOnline, syncQueue, failedQueue]);

  const enqueueAction = (action: InternalSyncAction) => {
    // ensure retries reset on new enqueue
    const toEnqueue: InternalSyncAction = { ...action, retries: 0 };
    setSyncQueue((prev) => [...(prev ?? []), toEnqueue]);
    setSyncStatus("pending");
  };

  const retryFailed = (actionId: string) => {
    const item = (failedQueue ?? []).find((a) => a.actionId === actionId);
    if (!item) return;
    const toRetry: InternalSyncAction = { ...item, retries: 0 };
    setFailedQueue((prev) => (prev ?? []).filter((a) => a.actionId !== actionId));
    setSyncQueue((prev) => [...(prev ?? []), toRetry]);
    setSyncStatus("pending");
  };

  const clearFailed = (actionId?: string) => {
    if (actionId) {
      setFailedQueue((prev) => (prev ?? []).filter((a) => a.actionId !== actionId));
    } else {
      setFailedQueue([]);
    }
  };

  return {
    syncQueue,
    enqueueAction,
    syncStatus,
    failedQueue,
    retryFailed,
    clearFailed,
    setSyncQueue,
  } as const;
}
// add default export to support default imports
export default useSyncQueue;

