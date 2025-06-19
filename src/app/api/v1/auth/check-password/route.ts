import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { compare } from 'bcryptjs';
import { jwtUtils, JWTPayload } from '@/lib/jwt';

// POST /api/v1/auth/check-password - Check user password and return JWT token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, password } = body;

    // Validate required fields
    if (!userId || !password) {
      return NextResponse.json(
        { success: false, error: 'User ID and password are required' },
        { status: 400 }
      );
    }

    // Get user from Firestore
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

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
    console.error('Error checking password:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check password' },
      { status: 500 }
    );
  }
} 