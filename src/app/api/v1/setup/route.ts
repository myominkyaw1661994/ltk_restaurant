import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/lib/models';
import { hash } from 'bcryptjs';

// POST /api/v1/setup - Create default admin user if not exists
export async function POST(request: NextRequest) {
  try {
    console.log('Setup endpoint called - checking for default admin user');

    // Default admin user credentials
    const defaultAdmin = {
      username: 'admin',
      email: 'admin@restaurant.com',
      password: 'admin123',
      role: 'Admin' as const
    };

    // Check if default admin user already exists
    const existingAdmin = await User.findOne({
      where: {
        email: defaultAdmin.email
      }
    });

    if (existingAdmin) {
      console.log('Default admin user already exists');
      return NextResponse.json({
        success: true,
        message: 'Default admin user already exists',
      });
    }

    console.log('Default admin user not found, creating...');

    // Hash the password
    const hashedPassword = await hash(defaultAdmin.password, 12);

    // Create user
    await User.create({
      username: defaultAdmin.username,
      email: defaultAdmin.email,
      password: hashedPassword,
      role: defaultAdmin.role
    });

    console.log('Default admin user created successfully');

    return NextResponse.json({
      success: true,
      message: 'Default admin user created successfully',
      data: {
        username: defaultAdmin.username,
        email: defaultAdmin.email,
        role: defaultAdmin.role
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error in setup endpoint:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to setup default admin user',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/v1/setup - Check if default admin user exists
export async function GET(request: NextRequest) {
  try {
    console.log('Checking for default admin user');

    const existingAdmin = await User.findOne({
      where: {
        email: 'admin@restaurant.com'
      },
      attributes: ['id', 'username', 'email', 'role', 'created_at']
    });

    const exists = !!existingAdmin;

    return NextResponse.json({
      success: true,
      data: {
        defaultAdminExists: exists,
        message: exists ? 'Default admin user exists' : 'Default admin user does not exist',
        credentials: exists ? {
          username: existingAdmin.username,
          email: existingAdmin.email,
          role: existingAdmin.role,
          created_at: existingAdmin.created_at
        } : null
      }
    });

  } catch (error) {
    console.error('Error checking default admin user:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check default admin user',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 