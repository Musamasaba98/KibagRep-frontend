import { useEffect, useState, useCallback } from "react";
import { registerOnlineSync, syncQueue, count } from "../lib/offlineQueue";

interface SyncResult { synced: number; failed: number }

export const useOfflineSync = () => {
  const [isOnline,     setIsOnline]     = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing,      setSyncing]      = useState(false);
  const [lastSync,     setLastSync]     = useState<SyncResult | null>(null);

  const refreshCount = useCallback(async () => {
    setPendingCount(await count());
  }, []);

  useEffect(() => {
    refreshCount();

    const onOnline  = () => { setIsOnline(true);  refreshCount(); };
    const onOffline = () =>   setIsOnline(false);

    window.addEventListener("online",  onOnline);
    window.addEventListener("offline", onOffline);

    registerOnlineSync(async (result) => {
      setLastSync(result);
      await refreshCount();
    });

    return () => {
      window.removeEventListener("online",  onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [refreshCount]);

  const sync = useCallback(async () => {
    if (syncing || !isOnline) return;
    setSyncing(true);
    try {
      const result = await syncQueue();
      setLastSync(result);
      await refreshCount();
    } finally {
      setSyncing(false);
    }
  }, [syncing, isOnline, refreshCount]);

  return { isOnline, pendingCount, syncing, lastSync, sync, refreshCount };
};

export default useOfflineSync;
