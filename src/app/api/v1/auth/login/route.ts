import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { compare } from 'bcryptjs';
import { jwtUtils, JWTPayload } from '@/lib/jwt';

// POST /api/v1/auth/login - Login with username and password
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Validate required fields
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Find user by username
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('name', '==', username));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    // Verify password
    const isPasswordValid = await compare(password, userData.password);
    
    if (isPasswordValid) {
      // Generate JWT token
      const payload: JWTPayload = {
        userId: userDoc.id,
        name: userData.name,
        role: userData.role,
        email: userData.email
      };

      const token = await jwtUtils.generateToken(payload);
      console.log(token);

      return NextResponse.json({
        success: true,
        message: 'Authentication successful',
        data: {
          token,
          user: {
            id: userDoc.id,
            name: userData.name,
            role: userData.role,
            email: userData.email
          }
        }
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to authenticate' },
      { status: 500 }
    );
  }
} 