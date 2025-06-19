import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, query, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { hash } from 'bcryptjs';

// GET /api/v1/users - Get all users
export async function GET(request: NextRequest) {
  try {
    // Get user info from middleware headers
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    const userName = request.headers.get('x-user-name');

    // Additional authentication check
    if (!userId || !userRole || !userName) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('Authenticated user:', { userId, userRole, userName });

    const querySnapshot = await getDocs(collection(db, 'users'));
    const users = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/v1/users - Create new user
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

    // Optional: Check if user has admin role to create users
    if (userRole !== 'Admin' && userRole !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    console.log('Creating user - authenticated as:', { userId, userRole });

    const body = await request.json();
    const { name, email, password, role } = body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const existingUser = await getDocs(q);
    
    if (!existingUser.empty) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Store user data in Firestore
    const userData = {
      name,
      email,
      password: hashedPassword,
      role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, 'users'), userData);

    // Return user data without password
    const { password: _, ...userWithoutPassword } = userData;

    return NextResponse.json({
      success: true,
      data: { id: docRef.id, ...userWithoutPassword },
      message: 'User created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    );
  }
} 