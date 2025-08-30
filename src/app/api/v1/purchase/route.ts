import { NextRequest, NextResponse } from 'next/server';
import { Purchase, PurchaseItem, User } from '@/lib/models';
import { Op } from 'sequelize';

interface PurchaseItemData {
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  total: number;
}

interface CreatePurchaseRequest {
  name?: string;
  description?: string;
  items: PurchaseItemData[];
  supplier_name?: string;
  purchase_date?: string;
  notes?: string;
}

// GET /api/v1/purchase - List all purchases with pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const status = searchParams.get('status');
    const supplier = searchParams.get('supplier');

    // Build where clause
    const whereClause: any = {};
    if (status) {
      whereClause.status = status;
    }
    if (supplier) {
      whereClause.supplier_name = { [Op.like]: `%${supplier}%` };
    }

    // Get total count
    const totalItems = await Purchase.count({ where: whereClause });
    const totalPages = Math.ceil(totalItems / pageSize);

    // Get purchases with pagination
    const purchases = await Purchase.findAll({
      where: whereClause,
      include: [
        {
          model: PurchaseItem,
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

    const formattedPurchases = purchases.map((purchase: any) => {
      const purchaseData = purchase.toJSON ? purchase.toJSON() : purchase;
      return {
        id: purchaseData.id,
        name: purchaseData.name,
        description: purchaseData.description,
        total_amount: purchaseData.total_amount,
        status: purchaseData.status,
        supplier_name: purchaseData.supplier_name,
        user_id: purchaseData.user_id,
        purchase_date: purchaseData.purchase_date,
        notes: purchaseData.notes,
        created_at: purchaseData.created_at,
        updated_at: purchaseData.updated_at,
        user: purchaseData.user ? {
          id: purchaseData.user.id,
          username: purchaseData.user.username,
          email: purchaseData.user.email
        } : null,
        items: purchaseData.items ? purchaseData.items.map((item: any) => ({
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
      message: 'Purchases retrieved successfully',
      purchases: formattedPurchases,
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
    console.error('Error fetching purchases:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch purchases' },
      { status: 500 }
    );
  }
}

// POST /api/v1/purchase - Create a new purchase
export async function POST(request: NextRequest) {
  try {
    // Get user info from middleware headers
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    console.log('userId', userId);
    console.log('userRole', userRole);

    // Additional authentication check
    if (!userId || !userRole) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: CreatePurchaseRequest = await request.json();
    const { name, description, items, supplier_name, purchase_date, notes } = body;

    // Validate the request body
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Purchase items are required and must be a non-empty array' },
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

    // Validate that user exists if userId is provided
    let validUserId: string | undefined = undefined;
    if (userId) {
      console.log(`Looking for user with ID: ${userId}`);
      const user = await User.findByPk(userId);
      if (!user) {
        console.log(`User with ID ${userId} not found, creating purchase without user_id`);
        validUserId = undefined;
      } else {
        validUserId = userId;
        console.log(`User found: ${user.username} (${user.email}), will create purchase with user_id: ${validUserId}`);
      }
    } else {
      console.log('No userId provided in headers');
    }
    

    // Create purchase with transaction
    const result = await Purchase.sequelize!.transaction(async (t) => {
      // Create purchase data
      const purchaseData: any = {
        name,
        description,
        total_amount,
        status: 'pending',
        supplier_name,
        purchase_date: purchase_date ? new Date(purchase_date) : new Date(),
        notes,
      };
      
      // Only add user_id if it's defined
      if (validUserId) {
        purchaseData.user_id = validUserId;
        console.log(`Adding user_id to purchase: ${validUserId}`);
      } else {
        console.log('No valid user_id, creating purchase without user_id');
      }
      
      console.log('Final purchase data to be created:', JSON.stringify(purchaseData, null, 2));
      
      // Create purchase
      const purchase = await Purchase.create(purchaseData, { transaction: t });
      
      console.log('Purchase created with ID:', purchase.id);
      console.log('Purchase user_id:', purchase.user_id);

      // Create purchase items
      const purchaseItems = items.map(item => ({
        purchase_id: purchase.getDataValue('id'),
        product_id: item.product_id,
        product_name: item.product_name,
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity
      }));

      await PurchaseItem.bulkCreate(purchaseItems, { transaction: t });

      return purchase;
    });

    return NextResponse.json(
      { 
        success: true,
        message: 'Purchase created successfully',
        purchase: {
          id: result.id,
          name: result.name,
          description: result.description,
          total_amount: result.total_amount,
          status: result.status,
          supplier_name: result.supplier_name,
          purchase_date: result.purchase_date,
          user_id: result.user_id,
          notes: result.notes
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating purchase:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create purchase' },
      { status: 500 }
    );
  }
} 