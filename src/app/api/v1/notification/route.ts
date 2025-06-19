import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    // Get user info from middleware headers
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    // Additional authentication check
    if (!userId || !userRole) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Optional: Check if user has admin role to send notifications
    if (userRole !== 'Admin' && userRole !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { title, body } = await request.json();

    // Validate required fields
    if (!title || !body) {
      return NextResponse.json(
        { success: false, error: 'Title and body are required' },
        { status: 400 }
      );
    }

    // Get all FCM tokens from Firestore
    const tokensSnapshot = await getDocs(collection(db, 'fcm_tokens'));
    const tokens = tokensSnapshot.docs.map(doc => doc.data().token);

    if (tokens.length === 0) {
      return NextResponse.json({ 
        success: true,
        message: 'No devices registered for notifications' 
      });
    }

    // For now, just log the notification since we don't have Firebase Admin SDK
    console.log('Notification would be sent:', {
      title,
      body,
      recipientCount: tokens.length,
      sentBy: userId
    });

    return NextResponse.json({
      success: true,
      message: `Notification logged for ${tokens.length} devices`,
      data: {
        title,
        body,
        recipientCount: tokens.length,
        sentBy: userId
      }
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send notification' },
      { status: 500 }
    );
  }
} 