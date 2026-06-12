// Offline visit queue using IndexedDB
// Stores visit/NCA/pharmacy log payloads when the device is offline,
// then syncs them automatically when connectivity is restored.

import { store } from "../store/store";

const DB_NAME = "kibag_offline";
const DB_VERSION = 2;
const STORE = "queue";

export type QueueItemType = "doctor_visit" | "pharmacy_visit" | "nca" | "daily_report";

export interface QueueItem {
  id: string;
  type: QueueItemType;
  payload: unknown;
  endpoint: string;
  method: "POST" | "PUT";
  created_at: string;
  retries: number;
}

// ── DB open ───────────────────────────────────────────────────────────────────

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("created_at", "created_at", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ── Queue CRUD ────────────────────────────────────────────────────────────────

export async function enqueue(item: Omit<QueueItem, "id" | "created_at" | "retries">): Promise<string> {
  const db = await openDb();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const full: QueueItem = { ...item, id, created_at: new Date().toISOString(), retries: 0 };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).add(full);
    tx.oncomplete = () => resolve(id);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAll(): Promise<QueueItem[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).index("created_at").getAll();
    req.onsuccess = () => resolve(req.result ?? []);
    req.onerror = () => reject(req.error);
  });
}

export async function remove(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function incrementRetry(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const item: QueueItem = getReq.result;
      if (item) store.put({ ...item, retries: item.retries + 1 });
      resolve();
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

export async function count(): Promise<number> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ── Sync ──────────────────────────────────────────────────────────────────────

const MAX_RETRIES = 5;

export async function syncQueue(
  onProgress?: (synced: number, total: number) => void
): Promise<{ synced: number; failed: number }> {
  const items = await getAll();
  if (items.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;
  const eligible = items.filter(i => i.retries < MAX_RETRIES);

  for (const item of eligible) {
    try {
      const token = store.getState().auth?.token ?? "";
      if (!token) {
        // Not authenticated — skip this item, don't burn retries
        continue;
      }
      const res = await fetch(item.endpoint, {
        method: item.method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(item.payload),
      });
      if (res.ok) {
        await remove(item.id);
        synced++;
      } else if (res.status === 401) {
        // Token expired — stop syncing, leave items intact for next session
        break;
      } else {
        await incrementRetry(item.id);
        failed++;
      }
    } catch {
      await incrementRetry(item.id);
      failed++;
    }
    onProgress?.(synced, eligible.length);
  }
  return { synced, failed };
}

// ── Online listener ───────────────────────────────────────────────────────────

let syncRegistered = false;

export function registerOnlineSync(
  onSync?: (result: { synced: number; failed: number }) => void
) {
  if (syncRegistered) return;
  syncRegistered = true;
  window.addEventListener("online", async () => {
    const result = await syncQueue();
    if (result.synced > 0 || result.failed > 0) onSync?.(result);
  });
}
