import { useEffect, useState, useCallback } from "react";
import { FiWifi, FiWifiOff, FiRefreshCw, FiCheckCircle } from "react-icons/fi";
import { count, syncQueue, registerOnlineSync } from "../../lib/offlineQueue";

const OfflineSyncBadge = () => {
  const [online, setOnline]       = useState(navigator.onLine);
  const [pending, setPending]     = useState(0);
  const [syncing, setSyncing]     = useState(false);
  const [justSynced, setJustSynced] = useState(false);

  const refreshCount = useCallback(async () => {
    const n = await count();
    setPending(n);
  }, []);

  useEffect(() => {
    refreshCount();

    const onOnline  = () => { setOnline(true);  refreshCount(); };
    const onOffline = () => setOnline(false);

    window.addEventListener("online",  onOnline);
    window.addEventListener("offline", onOffline);

    // Register background auto-sync on reconnect
    registerOnlineSync(async ({ synced }) => {
      if (synced > 0) {
        setJustSynced(true);
        setTimeout(() => setJustSynced(false), 3000);
      }
      refreshCount();
    });

    // Poll queue count every 10s (catches items added by other components)
    const interval = setInterval(refreshCount, 10_000);
    return () => {
      window.removeEventListener("online",  onOnline);
      window.removeEventListener("offline", onOffline);
      clearInterval(interval);
    };
  }, [refreshCount]);

  const handleManualSync = async () => {
    if (!online || syncing || pending === 0) return;
    setSyncing(true);
    const { synced } = await syncQueue();
    await refreshCount();
    setSyncing(false);
    if (synced > 0) {
      setJustSynced(true);
      setTimeout(() => setJustSynced(false), 3000);
    }
  };

  // Nothing to show when online and no pending items
  if (online && pending === 0 && !justSynced) return null;

  if (justSynced) {
    return (
      <div className="flex items-center gap-1.5 text-[#16a34a] text-xs font-semibold px-2 py-1 rounded-lg bg-[#f0fdf4]">
        <FiCheckCircle className="w-3.5 h-3.5" />
        Synced
      </div>
    );
  }

  if (!online) {
    return (
      <div className="flex items-center gap-1.5 text-amber-600 text-xs font-semibold px-2 py-1 rounded-lg bg-amber-50">
        <FiWifiOff className="w-3.5 h-3.5" />
        Offline{pending > 0 ? ` · ${pending} queued` : ""}
      </div>
    );
  }

  // Online but pending items need syncing
  return (
    <button
      onClick={handleManualSync}
      disabled={syncing}
      className="flex items-center gap-1.5 text-sky-600 text-xs font-semibold px-2 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 disabled:opacity-60"
      style={{ transition: "background-color 0.15s" }}
      title="Tap to sync pending visits"
    >
      {syncing
        ? <FiRefreshCw className="w-3.5 h-3.5 animate-spin" />
        : <FiWifi className="w-3.5 h-3.5" />
      }
      {syncing ? "Syncing…" : `${pending} pending`}
    </button>
  );
};

export default OfflineSyncBadge;
