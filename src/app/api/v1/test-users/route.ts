import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/lib/models';

// GET /api/v1/test-users - Test endpoint to see user data structure
export async function GET(request: NextRequest) {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'role', 'created_at', 'updated_at']
    });
    
    const formattedUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at
    }));

    return NextResponse.json({
      success: true,
      data: formattedUsers,
      message: 'Raw user data for debugging',
      count: formattedUsers.length
    });
  } catch (error) {
    console.error('Error in test-users:', error);
    return NextResponse.json(
      { success: false, error: 'Test failed', details: error },
      { status: 500 }
    );
  }
} 