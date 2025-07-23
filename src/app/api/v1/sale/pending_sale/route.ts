import { NextRequest, NextResponse } from 'next/server';
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tableNumber = searchParams.get("table_number");

    // Validate required parameters
    if (!tableNumber) {
      return NextResponse.json(
        { success: false, error: 'Table number is required' },
        { status: 400 }
      );
    }

    // Build query to get the latest sale for the specified table and status
    const salesRef = collection(db, 'sales');
    const q = query(
      salesRef,
      where('table_number', '==', tableNumber),
      where('status', '==', 'pending'),
      orderBy('created_at', 'desc'),
      limit(1)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return NextResponse.json({
        success: true,
        message: 'No sale found for the specified table and status',
        sale: null
      });
    }
    console.log("snapshot", snapshot)   

    // Get the latest sale (first document due to desc ordering)
    const latestSaleDoc = snapshot.docs[0];
    const saleData = latestSaleDoc.data();
    const sale = {
      id: latestSaleDoc.id,
      ...saleData
    };

    return NextResponse.json({
      success: true,
      message: 'Latest sale retrieved successfully',
      sale
    });

  } catch (error) {
    console.error('Error fetching latest sale:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch latest sale' },
      { status: 500 }
    );
  }
}