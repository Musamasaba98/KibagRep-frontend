import { useEffect, useState, useCallback, useRef } from "react";
import { syncQueue, count } from "../lib/offlineQueue";

interface SyncResult { synced: number; failed: number }

export const useOfflineSync = () => {
  const [isOnline,     setIsOnline]     = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing,      setSyncing]      = useState(false);
  const [lastSync,     setLastSync]     = useState<SyncResult | null>(null);

  // Ref prevents concurrent syncs without needing syncing in the dep array
  const syncingRef = useRef(false);

  const refreshCount = useCallback(async () => {
    try { setPendingCount(await count()); } catch {}
  }, []);

  const sync = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setSyncing(true);
    try {
      const result = await syncQueue();
      setLastSync(result);
      await refreshCount();
    } catch {}
    finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }, [refreshCount]);

  useEffect(() => {
    refreshCount();

    // Register listeners fresh on every mount so the callback is never stale.
    // The previous registerOnlineSync pattern used a module-level flag that
    // prevented re-registration after unmount/remount, leaving a dead callback.
    const onOnline = () => {
      setIsOnline(true);
      refreshCount();
      sync();           // auto-sync the moment connectivity is restored
    };
    const onOffline = () => setIsOnline(false);

    window.addEventListener("online",  onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online",  onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [refreshCount, sync]);

  return { isOnline, pendingCount, syncing, lastSync, sync, refreshCount };
};

export default useOfflineSync;
