import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, getCountFromServer } from 'firebase/firestore';

interface PurchaseItem {
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  total: number;
}

interface Purchase {
  name: string;
  description: string;
  total_amount: number;
  items: PurchaseItem[];
  created_at: string;
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

    // Optional: Check if user has appropriate role to create purchases
    if (userRole !== 'Admin' && userRole !== 'admin' && userRole !== 'Manager' && userRole !== 'manager') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, items } = body;

    // Validate the request body
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Purchase name is required and must be a string' },
        { status: 400 }
      );
    }

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Description is required and must be a string' },
        { status: 400 }
      );
    }

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

    // Create purchase object
    const purchase: Purchase = {
      name,
      description,
      total_amount,
      items: items.map(item => ({
        ...item,
        total: item.price * item.quantity
      })),
      created_at: new Date().toISOString()
    };

    // Add to Firestore
    const purchasesRef = collection(db, 'purchases');
    const docRef = await addDoc(purchasesRef, purchase);

    return NextResponse.json(
      { 
        success: true,
        message: 'Purchase created successfully',
        purchase: {
          id: docRef.id,
          ...purchase
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating purchase:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
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

    console.log('Fetching purchases with pagination:', { page, pageSize });

    const purchasesRef = collection(db, 'purchases');
    
    // Build query
    let q = query(purchasesRef, orderBy('created_at', 'desc'));

    // Get total count
    const totalCountSnapshot = await getCountFromServer(q);
    const totalItems = totalCountSnapshot.data().count;
    const totalPages = Math.ceil(totalItems / pageSize);

    // Get all documents up to the current page
    const allDocsSnapshot = await getDocs(q);
    
    // Get the documents for the current page
    const skip = (page - 1) * pageSize;
    const pageDocs = allDocsSnapshot.docs.slice(skip, skip + pageSize);

    const purchases = pageDocs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      message: 'Purchases retrieved successfully',
      purchases,
      pagination: {
        currentPage: page,
        pageSize,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching purchases:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 