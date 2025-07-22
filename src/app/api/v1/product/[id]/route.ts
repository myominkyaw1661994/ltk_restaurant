import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productRef = doc(db, 'products', id);
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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { product_name, price, category, type } = body;

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

    if (!category || typeof category !== 'string') {
      return NextResponse.json(
        { error: 'Category is required and must be a string' },
        { status: 400 }
      );
    }

    if (!type || !['sale', 'purchase'].includes(type)) {
      return NextResponse.json(
        { error: 'Type is required and must be either "sale" or "purchase"' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['food', 'beverage', 'dessert', 'appetizer', 'main-course', 'side-dish', 'snack', 'ingredient', 'other'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category selected' },
        { status: 400 }
      );
    }

    const productRef = doc(db, 'products', id);
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
      category,
      type,
      updated_at: new Date().toISOString()
    });

    return NextResponse.json({
      message: 'Product updated successfully',
      product: {
        id: id,
        product_name,
        price,
        category,
        type,
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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productRef = doc(db, 'products', id);
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