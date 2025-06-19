import { NextRequest, NextResponse } from 'next/server';

// GET /api/v1/test - Test endpoint to verify JWT authentication
export async function GET(request: NextRequest) {
  try {
    // Get user info from middleware headers
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    const userName = request.headers.get('x-user-name');

    return NextResponse.json({
      success: true,
      message: 'JWT authentication is working!',
      data: {
        authenticated: true,
        userId,
        userRole,
        userName,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json(
      { success: false, error: 'Test endpoint failed' },
      { status: 500 }
    );
  }
} 