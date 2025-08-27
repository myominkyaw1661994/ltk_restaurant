// Simplified notification system without Firebase
export const onMessageListener = () =>
  new Promise((resolve) => {
    // Simplified message listener - can be extended later
    resolve(null);
  });

// Request permission and get notification token
export async function requestNotificationPermission() {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted');
      return 'notification-token'; // Simplified token
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