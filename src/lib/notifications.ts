/**
 * Push Notification Utilities
 * 
 * Handles Web Push API: permission requests, subscription management,
 * and notification display. Requires VAPID keys in .env.
 */

// ─── Check Support ────────────────────────────────────────────────
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

// ─── Request Permission ───────────────────────────────────────────
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) {
    console.warn("Push notifications are not supported in this browser.");
    return "denied";
  }

  const permission = await Notification.requestPermission();
  return permission;
}

// ─── Get Push Subscription ────────────────────────────────────────
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;

  const permission = await requestNotificationPermission();
  if (permission !== "granted") return null;

  try {
    const registration = await navigator.serviceWorker.ready;

    // Check for existing subscription
    const existing = await registration.pushManager.getSubscription();
    if (existing) return existing;

    // Create new subscription
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      console.error("VAPID public key is not configured.");
      return null;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as any,
    });

    // Send subscription to backend
    await saveSubscription(subscription);
    return subscription;
  } catch (error) {
    console.error("Failed to subscribe to push:", error);
    return null;
  }
}

// ─── Unsubscribe ──────────────────────────────────────────────────
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      return true;
    }
    return false;
  } catch (error) {
    console.error("Failed to unsubscribe:", error);
    return false;
  }
}

// ─── Get Current Permission Status ───────────────────────────────
export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission;
}

// ─── Show Local Notification ──────────────────────────────────────
export async function showLocalNotification(
  title: string,
  options?: NotificationOptions
): Promise<void> {
  if (!isPushSupported()) return;

  const permission = await requestNotificationPermission();
  if (permission !== "granted") return;

  const registration = await navigator.serviceWorker.ready;
  await registration.showNotification(title, {
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    vibrate: [100, 50, 100],
    ...options,
  } as any);
}

// ─── Helpers ──────────────────────────────────────────────────────

/** Convert VAPID key from base64 to Uint8Array */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/** Send push subscription to the backend for storage */
async function saveSubscription(subscription: PushSubscription): Promise<void> {
  try {
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription.toJSON()),
    });
  } catch (error) {
    console.error("Failed to save subscription:", error);
  }
}
