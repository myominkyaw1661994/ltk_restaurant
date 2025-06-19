import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

// GET /api/v1/test-users - Test endpoint to see user data structure
export async function GET(request: NextRequest) {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      data: users,
      message: 'Raw user data for debugging',
      count: users.length
    });
  } catch (error) {
    console.error('Error in test-users:', error);
    return NextResponse.json(
      { success: false, error: 'Test failed', details: error },
      { status: 500 }
    );
  }
} 