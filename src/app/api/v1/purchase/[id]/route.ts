import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const purchaseRef = doc(db, 'purchases', params.id);
    const purchaseSnap = await getDoc(purchaseRef);

    if (!purchaseSnap.exists()) {
      return NextResponse.json(
        { error: 'Purchase not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      purchase: {
        id: purchaseSnap.id,
        ...purchaseSnap.data()
      }
    });
  } catch (error) {
    console.error('Error fetching purchase:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const purchaseRef = doc(db, 'purchases', params.id);
    const purchaseSnap = await getDoc(purchaseRef);

    if (!purchaseSnap.exists()) {
      return NextResponse.json(
        { error: 'Purchase not found' },
        { status: 404 }
      );
    }

    await deleteDoc(purchaseRef);

    return NextResponse.json({
      message: 'Purchase deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting purchase:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const purchaseRef = doc(db, 'purchases', params.id);
    const purchaseSnap = await getDoc(purchaseRef);

    if (!purchaseSnap.exists()) {
      return NextResponse.json(
        { error: 'Purchase not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, description, items } = body;

    // Validate the request body
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Purchase name is required and must be a string' },
        { status: 400 }
      );
    }

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Description is required and must be a string' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Purchase items are required and must be a non-empty array' },
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

    // Prepare updated purchase object
    const updatedPurchase = {
      name,
      description,
      total_amount,
      items: items.map(item => ({
        ...item,
        total: item.price * item.quantity
      })),
      // Do not update created_at
    };

    await updateDoc(purchaseRef, updatedPurchase);

    // Fetch the updated document
    const updatedSnap = await getDoc(purchaseRef);

    return NextResponse.json({
      message: 'Purchase updated successfully',
      purchase: {
        id: updatedSnap.id,
        ...updatedSnap.data()
      }
    });
  } catch (error) {
    console.error('Error updating purchase:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 