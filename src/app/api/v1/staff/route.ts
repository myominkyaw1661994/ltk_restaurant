import { NextRequest, NextResponse } from 'next/server';
import { Staff } from '@/lib/models';
import { Op } from 'sequelize';

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

    const body = await request.json();
    const { name, address, phone, salary, status = 'active' } = body;

    // Validate required fields
    if (!name || !address || !phone || salary === undefined) {
      return NextResponse.json(
        { success: false, error: 'Name, address, phone, and salary are required' },
        { status: 400 }
      );
    }

    // Validate salary
    if (typeof salary !== 'number' || salary <= 0) {
      return NextResponse.json(
        { success: false, error: 'Salary must be a positive number' },
        { status: 400 }
      );
    }

    // Check if phone number already exists
    const existingStaff = await Staff.findOne({ where: { phone } });
    if (existingStaff) {
      return NextResponse.json(
        { success: false, error: 'Phone number already exists' },
        { status: 400 }
      );
    }
    console.log('Staff', name, address, phone, salary, status);

    // Create staff
    const staff = await Staff.create({
      name,
      address,
      phone,
      salary,
      status
    });

    return NextResponse.json({
      success: true,
      message: 'Staff created successfully',
      staff: {
        id: staff.id,
        name: staff.name,
        address: staff.address,
        phone: staff.phone,
        salary: staff.salary,
        status: staff.status,
        created_at: staff.created_at,
        updated_at: staff.updated_at
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating staff:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create staff' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build where clause
    const whereClause: any = {};
    if (status) {
      whereClause.status = status;
    }
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { address: { [Op.like]: `%${search}%` } }
      ];
    }

    try {
      // Get total count
      const totalItems = await Staff.count({ where: whereClause });
      const totalPages = Math.ceil(totalItems / pageSize);

      // Get staff with pagination
      const staff = await Staff.findAll({
        where: whereClause,
        order: [['created_at', 'DESC']],
        limit: pageSize,
        offset: (page - 1) * pageSize
      });

      const formattedStaff = staff.map((member: any) => ({
        id: member.id,
        name: member.name,
        address: member.address,
        phone: member.phone,
        salary: member.salary,
        status: member.status,
        created_at: member.created_at,
        updated_at: member.updated_at
      }));

      return NextResponse.json({
        success: true,
        message: 'Staff retrieved successfully',
        staff: formattedStaff,
        pagination: {
          currentPage: page,
          pageSize,
          totalItems,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      });
    } catch (databaseError) {
      console.error('Database error:', databaseError);
      return NextResponse.json(
        { success: false, error: 'Database error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in staff API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
