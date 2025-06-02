import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const productRef = doc(db, 'products', params.id);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      product: {
        id: productSnap.id,
        ...productSnap.data()
      }
    });
  } catch (error) {
    console.error('Error fetching product:', error);
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
    const body = await request.json();
    const { product_name, price } = body;

    // Validate the request body
    if (!product_name || typeof product_name !== 'string') {
      return NextResponse.json(
        { error: 'Product name is required and must be a string' },
        { status: 400 }
      );
    }

    if (!price || typeof price !== 'number' || !Number.isInteger(price)) {
      return NextResponse.json(
        { error: 'Price is required and must be an integer' },
        { status: 400 }
      );
    }

    const productRef = doc(db, 'products', params.id);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    await updateDoc(productRef, {
      product_name,
      price,
      updated_at: new Date().toISOString()
    });

    return NextResponse.json({
      message: 'Product updated successfully',
      product: {
        id: params.id,
        product_name,
        price,
        updated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error updating product:', error);
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
    const productRef = doc(db, 'products', params.id);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    await deleteDoc(productRef);

    return NextResponse.json({
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 