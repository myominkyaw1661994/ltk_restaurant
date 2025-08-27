import { NextRequest, NextResponse } from 'next/server';
import { Sale, SaleItem } from '@/lib/models';

// Extend the Sale interface to include the items association
interface SaleWithItems extends Sale {
  items?: SaleItem[];
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sale = await Sale.findByPk(id);
    
    if (!sale) {
      return NextResponse.json(
        { success: false, error: 'Sale not found' },
        { status: 404 }
      );
    }

    if (sale.status !== 'completed') {
      return NextResponse.json(
        { success: false, error: 'Only completed sales can be deleted' },
        { status: 400 }
      );
    }

    // Delete sale items first (due to foreign key constraint)
    await SaleItem.destroy({ where: { sale_id: id } });
    
    // Delete the sale
    await sale.destroy();

    return NextResponse.json(
      { success: true, message: 'Sale deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting sale:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete sale' },
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
    const sale = await Sale.findByPk(id, {
      include: [
        {
          model: SaleItem,
          as: 'items',
          attributes: ['id', 'product_id', 'product_name', 'price', 'quantity', 'total']
        }
      ]
    }) as SaleWithItems;

    if (!sale) {
      return NextResponse.json(
        { success: false, error: 'Sale not found' },
        { status: 404 }
      );
    }

    const formattedSale = {
      id: sale.id,
      total_amount: sale.total_amount,
      status: sale.status,
      customer_name: sale.customer_name,
      table_number: sale.table_number,
      notes: sale.notes,
      created_at: sale.created_at,
      updated_at: sale.updated_at,
      items: sale.items?.map((item: SaleItem) => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        price: item.price,
        quantity: item.quantity,
        total: item.total
      })) || []
    };

    return NextResponse.json({
      success: true,
      sale: formattedSale
    });
  } catch (error) {
    console.error('Error fetching sale:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sale' },
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
    const sale = await Sale.findByPk(id);
    
    if (!sale) {
      return NextResponse.json(
        { success: false, error: 'Sale not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { customer_name, table_number, status, notes } = body;

    // Validate status
    if (!status || !['pending', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Status is required and must be pending, completed, or cancelled' },
        { status: 400 }
      );
    }

    // Update sale
    await sale.update({
      customer_name: customer_name || null,
      table_number: table_number || null,
      status,
      notes: notes || null
    });

    return NextResponse.json({
      success: true,
      message: 'Sale updated successfully',
      sale: {
        id: sale.id,
        total_amount: sale.total_amount,
        status: sale.status,
        customer_name: sale.customer_name,
        table_number: sale.table_number,
        notes: sale.notes,
        created_at: sale.created_at,
        updated_at: sale.updated_at
      }
    });
  } catch (error) {
    console.error('Error updating sale:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update sale' },
      { status: 500 }
    );
  }
} 