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
      id: latestSale.id,
      total_amount: latestSale.total_amount,
      status: latestSale.status,
      customer_name: latestSale.customer_name,
      table_number: latestSale.table_number,
      notes: latestSale.notes,
      created_at: latestSale.created_at,
      updated_at: latestSale.updated_at,
      items: latestSale.items?.map((item: SaleItem) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        price: item.price,
        quantity: item.quantity,
        total: item.total
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