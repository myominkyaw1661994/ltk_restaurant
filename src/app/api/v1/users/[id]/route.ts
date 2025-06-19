import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { hash } from 'bcryptjs';

// GET /api/v1/users/[id] - Get specific user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;
    const userDoc = await getDoc(doc(db, 'users', id));

    if (!userDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    return NextResponse.json({
      success: true,
      data: {
        id: userDoc.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt
      }
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PUT /api/v1/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Optional: Check if user has admin role to update users
    if (userRole !== 'Admin' && userRole !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { name, email, password, role } = body;

    // Validate required fields
    if (!name || !email || !role) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and role are required' },
        { status: 400 }
      );
    }

    const updateData: any = {
      name,
      email,
      role,
      updatedAt: new Date().toISOString()
    };

    // Only hash password if it's provided
    if (password) {
      updateData.password = await hash(password, 12);
    }

    await updateDoc(doc(db, 'users', id), updateData);

    return NextResponse.json({
      success: true,
      message: 'User updated successfully'
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Optional: Check if user has admin role to delete users
    if (userRole !== 'Admin' && userRole !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Prevent deleting own account
    if (id === userId) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    await deleteDoc(doc(db, 'users', id));

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    );
  }
} 