import { NextRequest, NextResponse } from 'next/server';
import { Sale, SaleItem } from '@/lib/models';
import { Op } from 'sequelize';

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

    // Get the latest sale for the specified table with pending status
    const latestSale = await Sale.findOne({
      where: {
        table_number: tableNumber,
        status: 'pending'
      },
      order: [['created_at', 'DESC']],
      include: [
        {
          model: SaleItem,
          as: 'items',
          attributes: ['id', 'product_id', 'product_name', 'price', 'quantity', 'total']
        }
      ]
    });

    if (!latestSale) {
      return NextResponse.json({
        success: true,
        message: 'No pending sale found for the specified table',
        sale: null
      });
    }

    // Format the response
    const sale = {
      id: latestSale.get('id'),
      total_amount: latestSale.get('total_amount'),
      discount: latestSale.get('discount') || 0,
      status: latestSale.get('status'),
      customer_name: latestSale.get('customer_name'),
      table_number: latestSale.get('table_number'),
      notes: latestSale.get('notes'),
      created_at: latestSale.get('created_at'),
      updated_at: latestSale.get('updated_at'),
      items: (latestSale.get('items') as any[])?.map((item: any) => ({
        product_id: item.get('product_id'),
        product_name: item.get('product_name'),
        price: item.get('price'),
        quantity: item.get('quantity'),
        total: item.get('total')
      })) || []
    };

    return NextResponse.json({
      success: true,
      message: 'Latest pending sale retrieved successfully',
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