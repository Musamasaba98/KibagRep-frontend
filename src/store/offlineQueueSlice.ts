import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import api from "../services/api";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type QueuedActionType =
  | "LOG_VISIT"
  | "LOG_NCA"
  | "LOG_MISSED"
  | "LOG_COMPETITOR"
  | "LOG_STOCK";

interface QueuedAction {
  id: string;          // client-generated uuid
  type: QueuedActionType;
  endpoint: string;    // POST /field-doctor/add-doctor-activity etc.
  payload: unknown;
  queued_at: string;   // ISO timestamp
  retries: number;
}

interface OfflineQueueState {
  queue: QueuedAction[];
  lastSyncedAt: string | null;   // ISO timestamp
  syncing: boolean;
  syncError: string | null;
  isOnline: boolean;
}

const initialState: OfflineQueueState = {
  queue: [],
  lastSyncedAt: null,
  syncing: false,
  syncError: null,
  isOnline: navigator.onLine,
};

// ─── Slice ─────────────────────────────────────────────────────────────────────

const offlineQueueSlice = createSlice({
  name: "offlineQueue",
  initialState,
  reducers: {
    enqueue(state, action: PayloadAction<Omit<QueuedAction, "retries">>) {
      state.queue.push({ ...action.payload, retries: 0 });
    },
    dequeue(state, action: PayloadAction<string>) {
      state.queue = state.queue.filter((a) => a.id !== action.payload);
    },
    incrementRetry(state, action: PayloadAction<string>) {
      const item = state.queue.find((a) => a.id === action.payload);
      if (item) item.retries++;
    },
    setSyncing(state, action: PayloadAction<boolean>) {
      state.syncing = action.payload;
    },
    setSyncError(state, action: PayloadAction<string | null>) {
      state.syncError = action.payload;
    },
    markSynced(state) {
      state.lastSyncedAt = new Date().toISOString();
      state.syncError = null;
    },
    setOnline(state, action: PayloadAction<boolean>) {
      state.isOnline = action.payload;
    },
  },
});

export const {
  enqueue,
  dequeue,
  incrementRetry,
  setSyncing,
  setSyncError,
  markSynced,
  setOnline,
} = offlineQueueSlice.actions;

export default offlineQueueSlice.reducer;

// ─── Thunk: flush queue ────────────────────────────────────────────────────────

export const flushQueue = () => async (dispatch: any, getState: any) => {
  const { queue, syncing } = getState().offlineQueue as OfflineQueueState;
  if (syncing || queue.length === 0) return;

  dispatch(setSyncing(true));
  dispatch(setSyncError(null));

  let anyFailed = false;
  for (const item of queue) {
    try {
      await api.post(item.endpoint, item.payload);
      dispatch(dequeue(item.id));
    } catch {
      dispatch(incrementRetry(item.id));
      anyFailed = true;
      // Stop on first failure — preserve order
      break;
    }
  }

  if (!anyFailed) {
    dispatch(markSynced());
  } else {
    dispatch(setSyncError("Some items failed to sync — will retry when online"));
  }
  dispatch(setSyncing(false));
};
