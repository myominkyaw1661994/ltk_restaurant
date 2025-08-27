import { NextRequest, NextResponse } from 'next/server';
import { Product } from '@/lib/models';
import { Op } from 'sequelize';

export async function GET(request: NextRequest) {
  try {
    // Get user info from middleware headers
    // const userId = request.headers.get('x-user-id');
    // const userRole = request.headers.get('x-user-role');

    // // Additional authentication check
    // if (!userId || !userRole) {
    //   return NextResponse.json(
    //     { success: false, error: 'Authentication required' },
    //     { status: 401 }
    //   );
    // }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const type = searchParams.get('type') || 'all';
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    // Build where clause
    const whereClause: any = {};
    if (type !== 'all') {
      whereClause.type = type;
    }
    if (category) {
      whereClause.category = category;
    }
    if (search) {
      whereClause.product_name = { [Op.like]: `%${search}%` };
    }

    // Get total count
    const totalItems = await Product.count({ where: whereClause });
    const totalPages = Math.ceil(totalItems / pageSize);

    // Get products with pagination
    const products = await Product.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: pageSize,
      offset: (page - 1) * pageSize,
      raw: true,
    });


    const formattedProducts = products.map(product => ({
      id: product.id,
      product_name: product.product_name,
      price: product.price,
      category: product.category,
      type: product.type,
      created_at: product.created_at,
      updated_at: product.updated_at
    }));

    return NextResponse.json({
      success: true,
      products: formattedProducts,
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
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user info from middleware headers
    // const userId = request.headers.get('x-user-id');
    // const userRole = request.headers.get('x-user-role');

    // // Additional authentication check
    // if (!userId || !userRole) {
    //   return NextResponse.json(
    //     { success: false, error: 'Authentication required' },
    //     { status: 401 }
    //   );
    // }

    // Optional: Check if user has appropriate role to create products
    // if (userRole !== 'Admin' && userRole !== 'admin' && userRole !== 'Manager' && userRole !== 'manager') {
    //   return NextResponse.json(
    //     { success: false, error: 'Insufficient permissions' },
    //     { status: 403 }
    //   );
    // }

    const { product_name, price, type, category } = await request.json();

    if (!product_name || typeof price !== 'number' || !type || !category) {
      return NextResponse.json(
        { success: false, error: 'Product name, price, type, and category are required' },
        { status: 400 }
      );
    }

    // Validate type
    if (!['sale', 'purchase'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Type must be either "sale" or "purchase"' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['food', 'beverage', 'dessert', 'appetizer', 'main-course', 'side-dish', 'snack', 'ingredient', 'other'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { success: false, error: 'Invalid category selected' },
        { status: 400 }
      );
    }

    // Validate price
    if (price < 0) {
      return NextResponse.json(
        { success: false, error: 'Price must be a positive number' },
        { status: 400 }
      );
    }

    // Create product
    const product = await Product.create({
      product_name: product_name.trim(),
      price,
      type,
      category
    });

    return NextResponse.json({
      success: true,
      message: 'Product created successfully',
      data: {
        id: product.id,
        product_name: product.product_name,
        price: product.price,
        type: product.type,
        category: product.category,
        created_at: product.created_at,
        updated_at: product.updated_at
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create product' },
      { status: 500 }
    );
  }
} 