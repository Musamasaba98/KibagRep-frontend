import { useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { formatDistanceToNow } from "date-fns";
import { FiWifi, FiWifiOff, FiRefreshCw, FiCheck, FiAlertCircle } from "react-icons/fi";
import { flushQueue, setOnline } from "../../store/offlineQueueSlice";

const SyncWidget = () => {
  const dispatch = useDispatch<any>();
  const { queue, lastSyncedAt, syncing, syncError, isOnline } = useSelector(
    (state: any) => state.offlineQueue
  );
  const pendingCount = queue.length;

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline  = () => { dispatch(setOnline(true));  dispatch(flushQueue()); };
    const handleOffline = () => dispatch(setOnline(false));
    window.addEventListener("online",  handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online",  handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [dispatch]);

  // Listen for kibag:log-missed events from Home.tsx
  useEffect(() => {
    // Auto-flush on mount if online and there's a queue
    if (isOnline && pendingCount > 0) dispatch(flushQueue());
  }, []);

  const handleManualSync = useCallback(() => {
    if (isOnline) dispatch(flushQueue());
  }, [dispatch, isOnline]);

  const lastSyncLabel = lastSyncedAt
    ? `${formatDistanceToNow(new Date(lastSyncedAt), { addSuffix: true })}`
    : "Never";

  if (!pendingCount && !syncError && isOnline) {
    // Compact online indicator
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f0fdf4] border border-[#dcfce7]">
        <FiCheck className="w-3 h-3 text-[#16a34a] shrink-0" />
        <span className="text-[10px] font-semibold text-[#16a34a]">
          Synced {lastSyncLabel}
        </span>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200">
        <FiWifiOff className="w-3.5 h-3.5 text-gray-500 shrink-0" />
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-gray-600 leading-none">Offline</p>
          {pendingCount > 0 && (
            <p className="text-[10px] text-gray-400">{pendingCount} action{pendingCount !== 1 ? 's' : ''} queued</p>
          )}
        </div>
      </div>
    );
  }

  if (pendingCount > 0) {
    return (
      <button onClick={handleManualSync} disabled={syncing}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 hover:bg-amber-100 focus-visible:outline-none"
        style={{ transition: 'background-color 0.15s' }}>
        <FiRefreshCw className={`w-3.5 h-3.5 text-amber-600 shrink-0 ${syncing ? 'animate-spin' : ''}`} />
        <div className="min-w-0 text-left">
          <p className="text-[10px] font-bold text-amber-700 leading-none">
            {syncing ? 'Syncing…' : 'Sync Now'}
          </p>
          <p className="text-[10px] text-amber-500">
            {pendingCount} pending upload{pendingCount !== 1 ? 's' : ''}
          </p>
        </div>
      </button>
    );
  }

  if (syncError) {
    return (
      <button onClick={handleManualSync} disabled={syncing}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 hover:bg-red-100 focus-visible:outline-none">
        <FiAlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
        <div className="min-w-0 text-left">
          <p className="text-[10px] font-bold text-red-600 leading-none">Sync Failed</p>
          <p className="text-[10px] text-red-400">Tap to retry</p>
        </div>
      </button>
    );
  }

  return null;
};

export default SyncWidget;
