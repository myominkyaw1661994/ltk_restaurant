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

    const formattedPurchases = purchases.map(purchase => ({
      id: purchase.id,
      total_amount: purchase.total_amount,
      status: purchase.status,
      supplier_name: purchase.supplier_name,
      purchase_date: purchase.purchase_date,
      notes: purchase.notes,
      created_at: purchase.created_at,
      updated_at: purchase.updated_at,
      user: purchase.user ? {
        id: purchase.user.id,
        username: purchase.user.username,
        email: purchase.user.email
      } : null,
      items: purchase.items?.map(item => ({
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

    // Additional authentication check
    if (!userId || !userRole) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: CreatePurchaseRequest = await request.json();
    const { items, supplier_name, purchase_date, notes } = body;

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

    // Create purchase with transaction
    const result = await Purchase.sequelize!.transaction(async (t) => {
      // Create purchase
      const purchase = await Purchase.create({
        total_amount,
        status: 'pending',
        supplier_name,
        purchase_date: purchase_date ? new Date(purchase_date) : new Date(),
        notes,
        user_id: userId
      }, { transaction: t });

      // Create purchase items
      const purchaseItems = items.map(item => ({
        purchase_id: purchase.id,
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
          total_amount: result.total_amount,
          status: result.status,
          supplier_name: result.supplier_name,
          purchase_date: result.purchase_date,
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