import { NextRequest, NextResponse } from 'next/server';
import { Staff } from '@/lib/models';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;
    const staff = await Staff.findByPk(id);

    if (!staff) {
      return NextResponse.json(
        { success: false, error: 'Staff not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
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
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch staff' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;
    const staff = await Staff.findByPk(id);
    
    if (!staff) {
      return NextResponse.json(
        { success: false, error: 'Staff not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, address, phone, salary, status } = body;

    // Check if phone number already exists (excluding current staff)
    if (phone && phone !== staff.phone) {
      const existingStaff = await Staff.findOne({ where: { phone } });
      if (existingStaff) {
        return NextResponse.json(
          { success: false, error: 'Phone number already exists' },
          { status: 400 }
        );
      }
    }

    // Validate salary if provided
    if (salary !== undefined && (typeof salary !== 'number' || salary <= 0)) {
      return NextResponse.json(
        { success: false, error: 'Salary must be a positive number' },
        { status: 400 }
      );
    }

    // Update staff
    await staff.update({
      name: name || staff.name,
      address: address || staff.address,
      phone: phone || staff.phone,
      salary: salary !== undefined ? salary : staff.salary,
      status: status || staff.status
    });

    return NextResponse.json({
      success: true,
      message: 'Staff updated successfully',
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
    });
  } catch (error) {
    console.error('Error updating staff:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update staff' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;
    const staff = await Staff.findByPk(id);
    
    if (!staff) {
      return NextResponse.json(
        { success: false, error: 'Staff not found' },
        { status: 404 }
      );
    }

    // Delete the staff
    await staff.destroy();

    return NextResponse.json(
      { success: true, message: 'Staff deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting staff:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete staff' },
      { status: 500 }
    );
  }
}
