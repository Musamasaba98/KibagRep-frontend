import { useEffect } from "react";
import api from "../services/api";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string;


const registerPush = async () => {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
  if (!VAPID_PUBLIC_KEY) return;

  // Must already have notification permission or prompt for it
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return;

  const reg = await navigator.serviceWorker.ready;
  if (!reg.pushManager) return;

  // Check if already subscribed
  let sub = await reg.pushManager.getSubscription();

  if (!sub) {
    // pushManager.subscribe accepts the base64url string directly
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: VAPID_PUBLIC_KEY,
    });
  }

  // Always send to backend — ensures DB stays in sync even if user reinstalled
  const json = sub.toJSON();
  if (!json.endpoint || !json.keys) return;

  await api.post("/push/subscribe", {
    endpoint: json.endpoint,
    keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
  }).catch(() => {});
};

/**
 * Call this hook in the RepPage layout.
 * On mount it silently requests notification permission and registers the
 * push subscription with the backend. Runs once per session.
 */
const usePushNotifications = () => {
  useEffect(() => {
    // Small delay so the main UI loads first — don't block the rep's first view
    const t = setTimeout(() => { registerPush().catch(() => {}); }, 3000);
    return () => clearTimeout(t);
  }, []);
};

export default usePushNotifications;
