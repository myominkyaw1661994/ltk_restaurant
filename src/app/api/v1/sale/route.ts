import { NextRequest, NextResponse } from 'next/server';
import { Sale, SaleItem, User, Product } from '@/lib/models';
import { sendNotification } from '@/lib/notification';
import { Op } from 'sequelize';
import sequelize from '@/lib/database';

// Function to generate unique sale number
const generateSaleNo = async (): Promise<string> => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const datePrefix = `${year}${month}${day}`;
  
  // Get the count of sales for today
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  
  const todaySalesCount = await Sale.count({
    where: {
      created_at: {
        [Op.gte]: startOfDay,
        [Op.lt]: endOfDay
      }
    }
  });
  
  const sequenceNumber = String(todaySalesCount + 1).padStart(3, '0');
  return `SALE-${datePrefix}-${sequenceNumber}`;
};

interface SaleItemData {
  id: string;
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
  discount?: number;
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
    const { items, customer_name, table_number, notes, discount = 0 } = body;

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

    // Validate that all products exist
    const productIds = items.map(item => item.product_id);
    const existingProducts = await Product.findAll({
      where: { id: { [Op.in]: productIds } }
    });

    console.log("existingProducts", existingProducts)
    
    if (existingProducts.length !== productIds.length) {
      const existingProductIds = existingProducts.map(p => p.id);
      const missingProductIds = productIds.filter(id => !existingProductIds.includes(id));
      console.log('Missing product IDs:', missingProductIds);
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Some products do not exist',
          missingProductIds,
          requestedProductIds: productIds,
          foundProductIds: existingProductIds
        },
        { status: 400 }
      );
    }

    // Calculate total amount
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total_amount = Math.max(0, subtotal - (discount || 0));

    // Validate that user exists if userId is provided
    let validUserId: string | undefined = undefined;
    if (userId) {
      const user = await User.findByPk(userId);
      if (!user) {
        console.log(`User with ID ${userId} not found, creating sale without user_id`);
        validUserId = undefined;
      } else {
        validUserId = userId;
      }
    }

    // Generate unique sale number
    const sale_no = await generateSaleNo();
    
    // Create sale first
    const saleData: any = {
      sale_no,
      total_amount,
      discount: discount || 0,
      status: 'pending' as const,
      customer_name,
      table_number,
      notes,
    };
    
    // Only add user_id if it's defined
    if (validUserId) {
      saleData.user_id = validUserId;
    }
    
    let sale: any;
    try {
      // Use Sequelize model for sale creation
      sale = await Sale.create(saleData);
      
      
    } catch (createError) {
      console.error('Sale creation failed:', createError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Sale creation failed',
          details: createError instanceof Error ? createError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
    
    // Validate sale was created properly
    if (!sale || !sale.id) {
      console.error('Sale creation failed - no ID returned');
      console.error('Sale object:', sale);
      console.error('Sale object type:', typeof sale);
      console.error('Sale object keys:', Object.keys(sale || {}));
      return NextResponse.json(
        { success: false, error: 'Sale creation failed - no ID returned' },
        { status: 500 }
      );
    }

    // Create sale items
    const saleItems = items.map(item => ({
      sale_id: sale.id,
      product_id: item.product_id,
      product_name: item.product_name,
      price: item.price,
      quantity: item.quantity,
      total: item.price * item.quantity
    }));

    console.log('Creating sale items:', saleItems);

    // Create sale items one by one using Sequelize model
    const createdItems = [];
    for (const item of saleItems) {
      try {
        console.log('Creating item with sale_id:', item.sale_id);
        console.log('Item data:', JSON.stringify(item, null, 2));
        
        const createdItem = await SaleItem.create(item);
        console.log('Item created successfully:', (createdItem as any).id);
        createdItems.push(createdItem);
      } catch (itemError) {
        console.error('Error creating sale item:', itemError);
        console.error('Item data that failed:', JSON.stringify(item, null, 2));
        
        // Delete the sale since items couldn't be created
        try {
          await sale.destroy();
          console.log('Sale deleted due to item creation failure');
        } catch (deleteError) {
          console.error('Failed to delete sale:', deleteError);
        }
        
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to create sale items',
            details: itemError instanceof Error ? itemError.message : 'Unknown error'
          },
          { status: 500 }
        );
      }
    }
    
    // Fetch the created sale with items for response
    const saleWithItems = await Sale.findByPk(sale.id, {
      include: [
        {
          model: SaleItem,
          as: 'items',
          attributes: ['id', 'product_id', 'product_name', 'price', 'quantity', 'total']
        }
      ]
    });

    const saleResponseData = (saleWithItems as any).toJSON?.() || saleWithItems;

    return NextResponse.json(
      { 
        success: true,
        message: 'Sale created successfully',
        sale: {
          id: saleResponseData.id,
          sale_no: saleResponseData.sale_no,
          total_amount: saleResponseData.total_amount,
          discount: saleResponseData.discount || 0,
          status: saleResponseData.status,
          customer_name: saleResponseData.customer_name,
          table_number: saleResponseData.table_number,
          notes: saleResponseData.notes,
          created_at: saleResponseData.created_at,
          items: saleResponseData.items ? saleResponseData.items.map((item: any) => ({
            id: item.id,
            product_id: item.product_id,
            product_name: item.product_name,
            price: item.price,
            quantity: item.quantity,
            total: item.total
          })) : []
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
    const table_number = searchParams.get('table_number');
    const customer_name = searchParams.get('customer_name');

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
        offset: (page - 1) * pageSize
      });

      console.log("sales", sales)

      const formattedSales = sales.map((sale: any) => {
        const saleData = sale.toJSON ? sale.toJSON() : sale;
        
        return {
          id: saleData.id,
          sale_no: saleData.sale_no,
          total_amount: saleData.total_amount,
          discount: saleData.discount || 0,
          status: saleData.status,
          customer_name: saleData.customer_name,
          table_number: saleData.table_number,
          notes: saleData.notes,
          created_at: saleData.created_at,
          updated_at: saleData.updated_at,
          user: saleData.user ? {
            id: saleData.user.id,
            username: saleData.user.username,
            email: saleData.user.email
          } : null,
          items: saleData.items ? saleData.items.map((item: any) => ({
            id: item.id,
            product_id: item.product_id,
            product_name: item.product_name,
            price: item.price,
            quantity: item.quantity,
            total: item.total
          })) : []
        };
      });

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