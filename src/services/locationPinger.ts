// GPS breadcrumb pinger — runs in background while rep is using the app.
// Captures a position every INTERVAL_MS and batches them to the backend.
// Uses a separate IndexedDB store so pings survive offline just like visits.

const DB_NAME    = "kibag_offline";
const DB_VERSION = 2; // bump to trigger onupgradeneeded for new store
const PING_STORE = "location_pings";

const INTERVAL_MS   = 45_000;  // 45 seconds between pings
const BATCH_EVERY   = 4;       // sync after this many pings (≈ 3 min)
const WORK_START_H  = 6;       // don't ping before 6am
const WORK_END_H    = 20;      // don't ping after 8pm

interface Ping {
  lat:         number;
  lng:         number;
  accuracy:    number | null;
  recorded_at: string; // ISO
}

// ─── IndexedDB helpers ────────────────────────────────────────────────────────

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(PING_STORE)) {
        db.createObjectStore(PING_STORE, { autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror  = () => reject(req.error);
  });
}

async function storePing(ping: Ping): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(PING_STORE, "readwrite");
    tx.objectStore(PING_STORE).add(ping);
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}

async function getPendingPings(): Promise<{ key: IDBValidKey; ping: Ping }[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx      = db.transaction(PING_STORE, "readonly");
    const store   = tx.objectStore(PING_STORE);
    const results: { key: IDBValidKey; ping: Ping }[] = [];
    const cursor  = store.openCursor();
    cursor.onsuccess = (e) => {
      const c = (e.target as IDBRequest<IDBCursorWithValue>).result;
      if (c) { results.push({ key: c.key, ping: c.value }); c.continue(); }
      else resolve(results);
    };
    cursor.onerror = () => reject(cursor.error);
  });
}

async function removePings(keys: IDBValidKey[]): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(PING_STORE, "readwrite");
    const store = tx.objectStore(PING_STORE);
    keys.forEach(k => store.delete(k));
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}

// ─── Sync pending pings to backend ───────────────────────────────────────────

async function syncPings(baseUrl: string, token: string): Promise<void> {
  const pending = await getPendingPings();
  if (pending.length === 0) return;

  try {
    const res = await fetch(`${baseUrl}/api/location/batch`, {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:  `Bearer ${token}`,
      },
      body: JSON.stringify({ pings: pending.map(p => p.ping) }),
    });
    if (res.ok) await removePings(pending.map(p => p.key));
  } catch {
    // Offline — leave pings in store for next sync
  }
}

// ─── Pinger class ────────────────────────────────────────────────────────────

class LocationPinger {
  private timerId:    ReturnType<typeof setInterval> | null = null;
  private pingCount:  number = 0;
  private baseUrl:    string = "";
  private getToken:   () => string = () => "";

  start(baseUrl: string, getToken: () => string) {
    if (this.timerId !== null) return; // already running
    this.baseUrl  = baseUrl;
    this.getToken = getToken;

    this.capture(); // immediate first ping
    this.timerId = setInterval(() => this.capture(), INTERVAL_MS);

    window.addEventListener("online", this.onOnline);
  }

  stop() {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    window.removeEventListener("online", this.onOnline);
  }

  private onOnline = () => {
    const token = this.getToken();
    if (token) syncPings(this.baseUrl, token);
  };

  private async capture() {
    const h = new Date().getHours();
    if (h < WORK_START_H || h >= WORK_END_H) return;

    if (!("geolocation" in navigator)) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const ping: Ping = {
          lat:         pos.coords.latitude,
          lng:         pos.coords.longitude,
          accuracy:    pos.coords.accuracy ?? null,
          recorded_at: new Date().toISOString(),
        };
        await storePing(ping);
        this.pingCount++;

        // Batch-sync every BATCH_EVERY pings if online
        if (this.pingCount % BATCH_EVERY === 0) {
          const token = this.getToken();
          if (token && navigator.onLine) syncPings(this.baseUrl, token);
        }
      },
      () => { /* permission denied or unavailable — skip silently */ },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 30_000 },
    );
  }
}

export const locationPinger = new LocationPinger();
