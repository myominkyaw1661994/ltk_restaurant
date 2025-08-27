import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/lib/models';
import { hash } from 'bcryptjs';
import { Op } from 'sequelize';

// GET /api/v1/users - Get all users
export async function GET(request: NextRequest) {
  try {
    // // Get user info from middleware headers
    // const userId = request.headers.get('x-user-id');
    // const userRole = request.headers.get('x-user-role');
    // const userName = request.headers.get('x-user-name');

    // // Additional authentication check
    // if (!userId || !userRole || !userName) {
    //   return NextResponse.json(
    //     { success: false, error: 'Authentication required' },
    //     { status: 401 }
    //   );
    // }

    // console.log('Authenticated user:', { userId, userRole, userName });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search');
    const role = searchParams.get('role');

    // Build where clause
    const whereClause: any = {};
    if (search) {
      whereClause[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }
    if (role) {
      whereClause.role = role;
    }

    // Get total count
    const totalItems = await User.count({ where: whereClause });
    const totalPages = Math.ceil(totalItems / pageSize);

    // Get users with pagination
    const users = await User.findAll({
      where: whereClause,
      attributes: { exclude: ['password'] }, // Don't return passwords
      order: [['created_at', 'DESC']],
      limit: pageSize,
      offset: (page - 1) * pageSize,
      raw: true,
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
      pagination: {
        currentPage: page,
        pageSize,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
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
    // const userId = request.headers.get('x-user-id');
    // const userRole = request.headers.get('x-user-role');

    // // Additional authentication check
    // if (!userId || !userRole) {
    //   return NextResponse.json(
    //     { success: false, error: 'Authentication required' },
    //     { status: 401 }
    //   );
    // }

    // // Optional: Check if user has admin role to create users
    // if (userRole !== 'Admin' && userRole !== 'admin') {
    //   return NextResponse.json(
    //     { success: false, error: 'Insufficient permissions' },
    //     { status: 403 }
    //   );
    // }

    // console.log('Creating user - authenticated as:', { userId, userRole });

    const body = await request.json();
    const { username, email, password, role } = body;

    // Validate required fields
    if (!username || !email || !password || !role) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate role
    // if (!['Admin', 'Manager', 'Staff'].includes(role)) {
    //   return NextResponse.json(
    //     { success: false, error: 'Invalid role. Must be Admin, Manager, or Staff' },
    //     { status: 400 }
    //   );
    // }

    // Check if user already exists
    const existingUser = await User.findOne({
      raw: true,
      where: {
        [Op.or]: [
          { email },
          { username }
        ]
      }
    });
    
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User with this email or username already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create user
    const user = await User.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role
    }, { raw: true });


    // Return user data without password
    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at
    };

    return NextResponse.json({
      success: true,
      data: userResponse,
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