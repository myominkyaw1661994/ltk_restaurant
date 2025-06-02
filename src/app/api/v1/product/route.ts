import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, limit, where, serverTimestamp, Query } from 'firebase/firestore';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const type = searchParams.get('type') || 'all';

    const productsRef = collection(db, 'products');
    let productsQuery: Query = query(productsRef);

    // Add type filter if not 'all'
    if (type !== 'all') {
      productsQuery = query(productsQuery, where('type', '==', type));
    }

    // Get all products for the current type
    const allProductsSnapshot = await getDocs(productsQuery);
    const totalItems = allProductsSnapshot.size;
    const totalPages = Math.ceil(totalItems / pageSize);

    // Calculate start and end indices for pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    // Get paginated products
    const products = allProductsSnapshot.docs
      .slice(startIndex, endIndex)
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate?.() || new Date().toISOString()
      }));

    return NextResponse.json({
      products,
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
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { product_name, price, type } = await request.json();

    if (!product_name || typeof price !== 'number' || !type) {
      return NextResponse.json(
        { error: 'Product name, price, and type are required' },
        { status: 400 }
      );
    }

    if (!['sale', 'purchase'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid product type' },
        { status: 400 }
      );
    }

    const productsRef = collection(db, 'products');
    const newProduct = {
      product_name,
      price,
      type,
      created_at: serverTimestamp()
    };

    const docRef = await addDoc(productsRef, newProduct);

    return NextResponse.json({
      id: docRef.id,
      ...newProduct,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
} 