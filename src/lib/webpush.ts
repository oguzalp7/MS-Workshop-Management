import webpush from "web-push";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (!vapidPublicKey || !vapidPrivateKey) {
  console.warn("VAPID keys are not fully configured in environment variables.");
} else {
  webpush.setVapidDetails(
    "mailto:oguz@la-vittoria.uk", // Update with your contact email
    vapidPublicKey,
    vapidPrivateKey
  );
}

export async function sendPushNotification(subscription: any, payload: { title: string; body: string; url?: string }) {
  if (!subscription) return;

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify(payload)
    );
    return { success: true };
  } catch (error: any) {
    console.error("Error sending push notification:", error);
    if (error.statusCode === 410 || error.statusCode === 404) {
      // Subscription has expired or is no longer valid
      return { success: false, error: "expired" };
    }
    return { success: false, error: error.message };
  }
}

export default webpush;
