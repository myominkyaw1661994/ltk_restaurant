import { NextRequest, NextResponse } from 'next/server';
import { Staff, SalaryPayment, Purchase } from '@/lib/models';
import { Op } from 'sequelize';
import sequelize from '@/lib/database';

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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const status = searchParams.get('status');

    // Build where clause
    const whereClause: any = { staff_id: id };
    if (year) {
      whereClause.year = parseInt(year);
    }
    if (month) {
      whereClause.month = parseInt(month);
    }
    if (status) {
      whereClause.status = status;
    }

    try {
      // Get total count
      const totalItems = await SalaryPayment.count({ where: whereClause });
      const totalPages = Math.ceil(totalItems / pageSize);

      // Get salary payments with pagination
      const salaryPayments = await SalaryPayment.findAll({
        where: whereClause,
        include: [
          {
            model: Purchase,
            as: 'purchase',
            attributes: ['id', 'name', 'description', 'total_amount', 'status', 'created_at']
          }
        ],
        order: [['payment_date', 'DESC']],
        limit: pageSize,
        offset: (page - 1) * pageSize
      });

      const formattedPayments = salaryPayments.map((payment: any) => ({
        id: payment.get('id'),
        staff_id: payment.get('staff_id'),
        amount: payment.get('amount'),
        payment_date: payment.get('payment_date'),
        month: payment.get('month'),
        year: payment.get('year'),
        status: payment.get('status'),
        notes: payment.get('notes'),
        created_at: payment.get('created_at'),
        updated_at: payment.get('updated_at'),
        purchase: payment.purchase ? {
          id: payment.purchase.get('id'),
          name: payment.purchase.get('name'),
          description: payment.purchase.get('description'),
          total_amount: payment.purchase.get('total_amount'),
          status: payment.purchase.get('status'),
          created_at: payment.purchase.get('created_at')
        } : null
      }));

      // Calculate summary statistics
      const totalPaid = salaryPayments.reduce((sum, payment) => sum + Number(payment.get('amount')), 0);
      const averagePayment = salaryPayments.length > 0 ? totalPaid / salaryPayments.length : 0;

      // Get payment statistics by year
      const yearlyStats = await SalaryPayment.findAll({
        where: { staff_id: id },
        attributes: [
          'year',
          [sequelize.fn('COUNT', sequelize.col('id')), 'payment_count'],
          [sequelize.fn('SUM', sequelize.col('amount')), 'total_amount']
        ],
        group: ['year'],
        order: [['year', 'DESC']]
      });

      return NextResponse.json({
        success: true,
        message: 'Salary history retrieved successfully',
        staff: {
          id: staff.get('id'),
          name: staff.get('name'),
          current_salary: staff.get('salary'),
          status: staff.get('status')
        },
        salaryPayments: formattedPayments,
        summary: {
          totalPayments: totalItems,
          totalPaid,
          averagePayment,
          yearlyStats: yearlyStats.map((stat: any) => ({
            year: stat.year,
            payment_count: Number(stat.getDataValue('payment_count')),
            total_amount: Number(stat.getDataValue('total_amount'))
          }))
        },
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
    console.error('Error fetching salary history:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
