"use client";

import { useEffect, useState } from "react";

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPush() {
  console.log("Push subscription started...");
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.error("Push not supported");
    throw new Error("Push messaging is not supported in your browser.");
  }

  // Ensure we have a registration
  let registration = await navigator.serviceWorker.getRegistration("/sw.js");
  
  if (!registration) {
    console.log("No registration found, attempting fresh registration...");
    try {
      registration = await navigator.serviceWorker.register("/sw.js");
    } catch (e) {
      console.error("Manual registration failed:", e);
      throw new Error(`Registration failed: ${e instanceof Error ? e.message : 'Unknown'}`);
    }
  }

  // FORCE RESET if stuck (optional, but good for debugging)
  if (registration && !registration.active && !registration.installing && !registration.waiting) {
     console.log("Registration exists but is dead. Unregistering and retrying...");
     await registration.unregister();
     registration = await navigator.serviceWorker.register("/sw.js");
  }

  // Wait for it to be active
  console.log("Checking worker status...");
  let retryCount = 0;
  while (!registration.active && retryCount < 10) {
    console.log(`Worker not active yet (status: ${registration.installing ? 'installing' : registration.waiting ? 'waiting' : 'unknown'}), waiting 500ms...`);
    await new Promise(r => setTimeout(r, 500));
    registration = await navigator.serviceWorker.getRegistration("/sw.js") || registration;
    retryCount++;
  }

  if (!registration.active) {
    throw new Error("Service Worker could not be activated.");
  }

  console.log("Service worker active and ready.");
  
  // 1. Request Permission
  console.log("Requesting notification permission...");
  const permission = await Notification.requestPermission();
  console.log("Permission status:", permission);
  if (permission !== "granted") {
    throw new Error("Notification permission not granted.");
  }

  // 2. Subscribe to Push
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  console.log("VAPID Key available:", !!vapidPublicKey);
  if (!vapidPublicKey) {
    throw new Error("VAPID public key not found.");
  }

  console.log("Creating push subscription...");
  // Use the active registration to subscribe
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });
  console.log("Subscription created:", !!subscription);

  // 3. Send subscription to server
  console.log("Sending subscription to server...");
  const response = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    console.error("Server subscription error:", errorData);
    throw new Error(errorData.error || "Server failed to save subscription");
  }

  console.log("Subscription synced successfully!");
  return subscription;
}

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      console.log("Registering Service Worker...");
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registered successfully:", registration.scope);
          // Force immediate activation if waiting
          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        })
        .catch((error) => {
          console.error("SW registration failed:", error);
        });
    }
  }, []);

  return null;
}
