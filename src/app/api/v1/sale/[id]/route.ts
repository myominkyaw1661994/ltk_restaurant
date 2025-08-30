import { NextRequest, NextResponse } from 'next/server';
import { Sale, SaleItem, sequelize } from '@/lib/models';

// Extend the Sale interface to include the items association
interface SaleWithItems {
  id: string;
  sale_no: string;
  total_amount: number;
  discount: number;
  status: 'pending' | 'completed' | 'cancelled';
  customer_name?: string;
  table_number?: string;
  notes?: string;
  user_id?: string;
  created_at?: Date;
  updated_at?: Date;
  items?: any[];
}

// Validation constants
const VALID_STATUSES = ['pending', 'completed', 'cancelled'] as const;
const SALE_ITEM_ATTRIBUTES = ['id', 'product_id', 'product_name', 'price', 'quantity', 'total'];

// Helper function to format sale data
const formatSaleData = (sale: any) => ({
  id: sale.id,
  sale_no: sale.sale_no,
  total_amount: sale.total_amount,
  discount: sale.discount || 0,
  status: sale.status,
  customer_name: sale.customer_name,
  table_number: sale.table_number,
  notes: sale.notes,
  created_at: sale.created_at,
  updated_at: sale.updated_at,
  items: sale.items?.map((item: any) => ({
    id: item.id,
    product_id: item.product_id,
    product_name: item.product_name,
    price: item.price,
    quantity: item.quantity,
    total: item.total
  })) || []
});

// Helper function to validate sale items
const validateSaleItems = (items: any[]): string | null => {
  if (!items?.length) {
    return 'Sale items are required and must be a non-empty array';
  }
  
  for (const item of items) {
    if (!item.product_name || !item.price || !item.quantity) {
      return 'Each item must have product_name, price, and quantity';
    }
  }
  
  return null;
};

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = await params;
    const sale = await Sale.findByPk(id, { transaction });
    
    if (!sale) {
      await transaction.rollback();
      return NextResponse.json({ success: false, error: 'Sale not found' }, { status: 404 });
    }
    
    await sale.destroy({ transaction });
    await SaleItem.destroy({ where: { sale_id: id }, transaction });
    await transaction.commit();
    
    return NextResponse.json({ success: true, message: 'Sale deleted successfully' });
  } catch (error) {
    await transaction.rollback();
    console.error('Error deleting sale:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete sale' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sale = await Sale.findByPk(id, {
      include: [{
        model: SaleItem,
        as: 'items',
        attributes: SALE_ITEM_ATTRIBUTES,
      }]
    });

    if (!sale) {
      return NextResponse.json(
        { success: false, error: 'Sale not found' },
        { status: 404 }
      );
    }

    const saleData = (sale as any).toJSON?.() || sale;
    const formattedSale = formatSaleData(saleData);

    return NextResponse.json({ success: true, sale: formattedSale });
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
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = await params;
    const sale = await Sale.findByPk(id, { transaction });
    
    if (!sale) {
      await transaction.rollback();
      return NextResponse.json(
        { success: false, error: 'Sale not found' },
        { status: 404 }
      );
    }

    const { customer_name, table_number, status, notes, items } = await request.json();

    // Validate status
    if (!status || !VALID_STATUSES.includes(status)) {
      await transaction.rollback();
      return NextResponse.json(
        { success: false, error: `Status is required and must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate items
    const itemsValidationError = validateSaleItems(items);
    if (itemsValidationError) {
      await transaction.rollback();
      return NextResponse.json({ success: false, error: itemsValidationError }, { status: 400 });
    }

    // Process sale items and calculate total
    let totalAmount = 0;
    const itemOperations = items.map(async (item: any) => {
      const itemTotal = (item.price || 0) * (item.quantity || 0);
      totalAmount += itemTotal;
      
      const itemData = {
        product_name: item.product_name,
        price: item.price,
        quantity: item.quantity,
        total: itemTotal
      };

      if (!item.id) {
        return SaleItem.create({
          sale_id: id,
          product_id: item.product_id || null,
          ...itemData
        }, { transaction });
      } else {
        return SaleItem.update(itemData, { 
          where: { sale_id: id, id: item.id },
          transaction 
        });
      }
    });

    // Execute all item operations concurrently
    await Promise.all(itemOperations);

    // Update sale with recalculated total
    await sale.update({
      customer_name: customer_name || null,
      table_number: table_number || null,
      status,
      notes: notes || null,
      total_amount: totalAmount
    }, { transaction });

    await transaction.commit();

    // Fetch and return updated sale
    const updatedSale = await Sale.findByPk(id, {
      include: [{
        model: SaleItem,
        as: 'items',
        attributes: SALE_ITEM_ATTRIBUTES
      }]
    }) as any;

    return NextResponse.json({
      success: true,
      message: 'Sale updated successfully',
      sale: formatSaleData(updatedSale)
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating sale:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update sale' },
      { status: 500 }
    );
  }
}