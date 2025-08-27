import { NextRequest, NextResponse } from 'next/server';
import { Sale, SaleItem, User } from '@/lib/models';
import { sendNotification } from '@/lib/notification';
import { Op } from 'sequelize';

interface SaleItemData {
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  total: number;
}

interface CreateSaleRequest {
  items: SaleItemData[];
  customer_name?: string;
  table_number?: string;
  notes?: string;
}

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

    const body: CreateSaleRequest = await request.json();
    const { items, customer_name, table_number, notes } = body;

    // Validate the request body
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Sale items are required and must be a non-empty array' },
        { status: 400 }
      );
    }

    // Validate each item
    for (const item of items) {
      if (!item.product_id || !item.product_name || !item.price || !item.quantity) {
        return NextResponse.json(
          { success: false, error: 'Each item must have product_id, product_name, price, and quantity' },
          { status: 400 }
        );
      }

      if (typeof item.price !== 'number' || typeof item.quantity !== 'number') {
        return NextResponse.json(
          { success: false, error: 'Price and quantity must be numbers' },
          { status: 400 }
        );
      }
    }

    // Calculate total amount
    const total_amount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Create sale with transaction
    const result = await Sale.sequelize!.transaction(async (t) => {
      // Create sale
      const sale = await Sale.create({
        total_amount,
        status: 'pending',
        customer_name,
        table_number,
        notes,
        user_id: userId
      }, { transaction: t });

      // Create sale items
      const saleItems = items.map(item => ({
        sale_id: sale.id,
        product_id: item.product_id,
        product_name: item.product_name,
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity
      }));

      await SaleItem.bulkCreate(saleItems, { transaction: t });

      return sale;
    });

    // Send notification
    await sendNotification(
      'New Sale Created',
      `Sale #${result.id} has been created with total amount of ${total_amount} MMK`
    );

    return NextResponse.json(
      { 
        success: true,
        message: 'Sale created successfully',
        sale: {
          id: result.id,
          total_amount: result.total_amount,
          status: result.status,
          customer_name: result.customer_name,
          table_number: result.table_number,
          notes: result.notes,
          created_at: result.created_at
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating sale:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create sale' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const status = searchParams.get('status');
    const table_number = searchParams.get('table_number');
    const customer_name = searchParams.get('customer_name');

    console.log("page", page)

    console.log('Fetching sales with pagination:', { page, pageSize, status });

    // Build where clause
    const whereClause: any = {};
    if (status) {
      whereClause.status = status;
    }
    if (table_number) {
      whereClause.table_number = table_number;
    }
    if (customer_name) {
      whereClause.customer_name = { [Op.like]: `%${customer_name}%` };
    }

    try {
      // Get total count
      const totalItems = await Sale.count({ where: whereClause });
      const totalPages = Math.ceil(totalItems / pageSize);

      // Get sales with pagination
      const sales = await Sale.findAll({
        where: whereClause,
        include: [
          {
            model: SaleItem,
            as: 'items',
            attributes: ['id', 'product_id', 'product_name', 'price', 'quantity', 'total']
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email']
          }
        ],
        order: [['created_at', 'DESC']],
        limit: pageSize,
        offset: (page - 1) * pageSize,
      });

      const formattedSales = sales.map(sale => ({
        id: sale.id,
        total_amount: sale.total_amount,
        status: sale.status,
        customer_name: sale.customer_name,
        table_number: sale.table_number,
        notes: sale.notes,
        created_at: sale.created_at,
        updated_at: sale.updated_at,
        user: sale.user ? {
          id: sale.user.id,
          username: sale.user.username,
          email: sale.user.email
        } : null,
        items: sale.items?.map(item => ({
          id: item.id,
          product_id: item.product_id,
          product_name: item.product_name,
          price: item.price,
          quantity: item.quantity,
          total: item.total
        })) || []
      }));

      return NextResponse.json({
        success: true,
        message: 'Sales retrieved successfully',
        sales: formattedSales,
        pagination: {
          currentPage: page,
          pageSize,
          totalItems,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      });
    } catch (firestoreError) {
      console.error('Database error:', firestoreError);
      return NextResponse.json(
        { success: false, error: 'Database error', details: firestoreError instanceof Error ? firestoreError.message : 'Unknown error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in sales API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 