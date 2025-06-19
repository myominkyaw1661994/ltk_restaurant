import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const saleRef = doc(db, 'sales', id);
    
    // Check if sale exists and is completed
    const saleDoc = await getDoc(saleRef);
    if (!saleDoc.exists()) {
      return NextResponse.json(
        { error: 'Sale not found' },
        { status: 404 }
      );
    }

    const saleData = saleDoc.data();
    if (saleData.status !== 'completed') {
      return NextResponse.json(
        { error: 'Only completed sales can be deleted' },
        { status: 400 }
      );
    }

    // Delete the sale
    await deleteDoc(saleRef);

    return NextResponse.json(
      { message: 'Sale deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting sale:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const saleRef = doc(db, 'sales', id);
    const saleDoc = await getDoc(saleRef);
    if (!saleDoc.exists()) {
      return NextResponse.json(
        { error: 'Sale not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({
      sale: {
        id: saleDoc.id,
        ...saleDoc.data()
      }
    });
  } catch (error) {
    console.error('Error fetching sale:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const saleRef = doc(db, 'sales', id);
    const saleDoc = await getDoc(saleRef);
    if (!saleDoc.exists()) {
      return NextResponse.json(
        { error: 'Sale not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { customer_name, table_number, status, notes, items } = body;

    // Validate required fields
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Sale items are required and must be a non-empty array' },
        { status: 400 }
      );
    }
    if (!status || typeof status !== 'string') {
      return NextResponse.json(
        { error: 'Status is required and must be a string' },
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

    // Prepare updated sale object
    const updatedSale = {
      customer_name: customer_name || '',
      table_number: table_number || '',
      status,
      notes: notes || '',
      items: items.map(item => ({
        ...item,
        total: item.price * item.quantity
      })),
      total_amount,
      updated_at: new Date().toISOString()
    };

    await updateDoc(saleRef, updatedSale);

    // Fetch the updated document
    const updatedSnap = await getDoc(saleRef);

    return NextResponse.json({
      message: 'Sale updated successfully',
      sale: {
        id: updatedSnap.id,
        ...updatedSnap.data()
      }
    });
  } catch (error) {
    console.error('Error updating sale:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 