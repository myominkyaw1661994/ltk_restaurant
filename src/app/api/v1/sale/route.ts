import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, limit, startAfter, getCountFromServer, DocumentSnapshot, where } from 'firebase/firestore';
import { sendNotification } from '@/lib/notification';

interface SaleItem {
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  total: number;
}

interface Sale {
  items: SaleItem[];
  total_amount: number;
  created_at: string;
  status: 'pending' | 'completed' | 'cancelled';
  customer_name?: string;
  table_number?: string;
  notes?: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, customer_name, table_number, notes } = body;

    // Validate the request body
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Sale items are required and must be a non-empty array' },
        { status: 400 }
      );
    }

    // Validate each item
    for (const item of items) {
      if (!item.product_id || !item.product_name || !item.price || !item.quantity) {
        return NextResponse.json(
          { error: 'Each item must have product_id, product_name, price, and quantity' },
          { status: 400 }
        );
      }

      if (typeof item.price !== 'number' || typeof item.quantity !== 'number') {
        return NextResponse.json(
          { error: 'Price and quantity must be numbers' },
          { status: 400 }
        );
      }
    }

    // Calculate total amount
    const total_amount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Create sale object
    const sale: Sale = {
      items: items.map(item => ({
        ...item,
        total: item.price * item.quantity
      })),
      total_amount,
      created_at: new Date().toISOString(),
      status: 'pending',
      customer_name,
      table_number,
      notes
    };

    // Add to Firestore
    const salesRef = collection(db, 'sales');
    const docRef = await addDoc(salesRef, sale);

    // Send notification
    await sendNotification(
      'New Sale Created',
      `Sale #${docRef.id} has been created with total amount of ${total_amount} MMK`
    );

    return NextResponse.json(
      { 
        message: 'Sale created successfully',
        sale: {
          id: docRef.id,
          ...sale
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating sale:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const status = searchParams.get('status');

    console.log('Fetching sales with pagination:', { page, pageSize, status });

    const salesRef = collection(db, 'sales');
    
    // Build query
    let q = query(salesRef, orderBy('created_at', 'desc'));
    
    // Add status filter if provided
    if (status) {
      q = query(q, where('status', '==', status));
    }

    try {
      // Get total count
      const totalCountSnapshot = await getCountFromServer(q);
      const totalItems = totalCountSnapshot.data().count;
      const totalPages = Math.ceil(totalItems / pageSize);

      // Get all documents up to the current page
      const allDocsSnapshot = await getDocs(q);
      
      // Get the documents for the current page
      const skip = (page - 1) * pageSize;
      const pageDocs = allDocsSnapshot.docs.slice(skip, skip + pageSize);

      const sales = pageDocs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return NextResponse.json({
        message: 'Sales retrieved successfully',
        sales,
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
      console.error('Firestore error:', firestoreError);
      return NextResponse.json(
        { error: 'Database error', details: firestoreError instanceof Error ? firestoreError.message : 'Unknown error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in sales API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 