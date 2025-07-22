import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { hash } from 'bcryptjs';

// POST /api/v1/setup - Create default admin user if not exists
export async function POST(request: NextRequest) {
  try {
    console.log('Setup endpoint called - checking for default admin user');

    // Default admin user credentials
    const defaultAdmin = {
      name: 'admin',
      email: 'admin@restaurant.com',
      password: 'admin123',
      role: 'Admin'
    };

    // Check if default admin user already exists
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('name', '==', defaultAdmin.name));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      console.log('Default admin user already exists');
      return NextResponse.json({
        success: true,
        message: 'Default admin user already exists',
      });
    }

    console.log('Default admin user not found, creating...');

    // Hash the password
    const hashedPassword = await hash(defaultAdmin.password, 12);

    // Create user data
    const userData = {
      name: defaultAdmin.name,
      email: defaultAdmin.email,
      password: hashedPassword,
      role: defaultAdmin.role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Add user to Firestore
    const docRef = await addDoc(collection(db, 'users'), userData);

    console.log('Default admin user created successfully');

    return NextResponse.json({
      success: true,
      message: 'Default admin user created successfully',
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

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('name', '==', 'admin'));
    const querySnapshot = await getDocs(q);

    const exists = !querySnapshot.empty;

    return NextResponse.json({
      success: true,
      data: {
        defaultAdminExists: exists,
        message: exists ? 'Default admin user exists' : 'Default admin user does not exist',
        credentials: exists ? {
          username: 'admin',
          email: 'admin@restaurant.com',
          role: 'Admin'
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