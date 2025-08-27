import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/lib/models';
import { compare } from 'bcryptjs';
import { jwtUtils, JWTPayload } from '@/lib/jwt';
import { Op } from 'sequelize';

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

    // Find user by username or email
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { username },
          { email: username }
        ]
      },
      raw: true
    });



    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify password
    const isPasswordValid = await compare(password, user.password);
    
    if (isPasswordValid) {
      // Generate JWT token
      const payload: JWTPayload = {
        userId: user.id,
        name: user.username,
        role: user.role,
        email: user.email
      };

      const token = await jwtUtils.generateToken(payload);

      return NextResponse.json({
        success: true,
        message: 'Authentication successful',
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
            email: user.email
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