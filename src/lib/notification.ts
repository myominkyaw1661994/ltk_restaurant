import { getMessaging, getToken, onMessage, MessagePayload } from 'firebase/messaging';
import { app } from './firebase';
import { db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

// Handle incoming messages when app is in foreground
export const onMessageListener = () =>
  new Promise((resolve) => {
    const messaging = getMessaging(app);
    onMessage(messaging, (payload: MessagePayload) => {
      resolve(payload);
    });
  });

// Request permission and get FCM token
export async function requestNotificationPermission() {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const messaging = getMessaging(app);
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
      });

      // Store token in Firestore
      await setDoc(doc(db, 'fcm_tokens', token), {
        token,
        created_at: new Date().toISOString()
      });

      return token;
    }
    return null;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return null;
  }
}

// Send notification to all devices
export async function sendNotification(title: string, body: string) {
  try {
    const response = await fetch('/api/v1/notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, body }),
    });

    if (!response.ok) {
      throw new Error('Failed to send notification');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending notification:', error);
    // Don't throw the error, just log it
    return null;
  }
} 