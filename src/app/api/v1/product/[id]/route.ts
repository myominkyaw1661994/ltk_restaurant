import { NextRequest, NextResponse } from 'next/server';
import { Product } from '@/lib/models';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await Product.findByPk(id, { raw: true });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        product_name: product.product_name,
        price: product.price,
        category: product.category,
        type: product.type,
        created_at: product.created_at,
        updated_at: product.updated_at
      }
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product' },
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

    // // Validate the request body
    // if (!product_name || typeof product_name !== 'string') {
    //   return NextResponse.json(
    //     { success: false, error: 'Product name is required and must be a string' },
    //     { status: 400 }
    //   );
    // }

    // if (!price || typeof price !== 'number' || !Number.isInteger(price)) {
    //   return NextResponse.json(
    //     { success: false, error: 'Price is required and must be an integer' },
    //     { status: 400 }
    //   );
    // }

    // if (!category || typeof category !== 'string') {
    //   return NextResponse.json(
    //     { success: false, error: 'Category is required and must be a string' },
    //     { status: 400 }
    //   );
    // }

    // if (!type || !['sale', 'purchase'].includes(type)) {
    //   return NextResponse.json(
    //     { success: false, error: 'Type is required and must be either "sale" or "purchase"' },
    //     { status: 400 }
    //   );
    // }

    // // Validate category
    // const validCategories = ['food', 'beverage', 'dessert', 'appetizer', 'main-course', 'side-dish', 'snack', 'ingredient', 'other'];
    // if (!validCategories.includes(category)) {
    //   return NextResponse.json(
    //     { success: false, error: 'Invalid category selected' },
    //     { status: 400 }
    //   );
    // }

    // // Validate price
    // if (price < 0) {
    //   return NextResponse.json(
    //     { success: false, error: 'Price must be a positive number' },
    //     { status: 400 }
    //   );
    // }

    const product = await Product.findByPk(id);

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Update the product
    await product.update({
      product_name,
      price,
      category,
      type
    });

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      product: {
        id: product.id,
        product_name: product.product_name,
        price: product.price,
        category: product.category,
        type: product.type,
        created_at: product.created_at,
        updated_at: product.updated_at
      }
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update product' },
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
    const product = await Product.findByPk(id);

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    await product.destroy();

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete product' },
      { status: 500 }
    );
  }
} 