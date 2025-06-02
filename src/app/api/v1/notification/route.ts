import { NextResponse } from 'next/server';
import { getMessaging } from 'firebase-admin/messaging';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { title, body } = await request.json();

    // Get all FCM tokens from Firestore
    const tokensSnapshot = await adminDb.collection('fcm_tokens').get();
    const tokens = tokensSnapshot.docs.map(doc => doc.data().token);

    if (tokens.length === 0) {
      return NextResponse.json({ message: 'No devices registered for notifications' });
    }

    // Send notification to all devices
    const message = {
      notification: {
        title,
        body,
      },
      tokens,
    };

    const response = await getMessaging().sendEachForMulticast(message);
    
    // Remove invalid tokens
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
        }
      });

      // Remove failed tokens from Firestore
      const batch = adminDb.batch();
      failedTokens.forEach(token => {
        const tokenDoc = tokensSnapshot.docs.find(doc => doc.data().token === token);
        if (tokenDoc) {
          batch.delete(tokenDoc.ref);
        }
      });
      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      message: `Notification sent to ${response.successCount} devices`,
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
} 