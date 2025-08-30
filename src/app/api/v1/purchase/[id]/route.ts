import { NextRequest, NextResponse } from 'next/server';
import { Purchase, PurchaseItem, User } from '@/lib/models';

// Extend the Purchase interface to include the items association
interface PurchaseWithItems extends Purchase {
  items?: PurchaseItem[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const purchase = await Purchase.findByPk(id, {
      include: [
        {
          model: PurchaseItem,
          as: 'items',
          attributes: ['id', 'product_id', 'product_name', 'price', 'quantity', 'total']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'role']
        }
      ]
    });

    if (!purchase) {
      return NextResponse.json(
        { success: false, error: 'Purchase not found' },
        { status: 404 }
      );
    }

    console.log('purchase', purchase);

    const purchaseData = (purchase as any).toJSON?.() || purchase;

    const formattedPurchase = {
      id: purchaseData.id,
      name: purchaseData.name,
      description: purchaseData.description,
      total_amount: purchaseData.total_amount,
      status: purchaseData.status,
      supplier_name: purchaseData.supplier_name,
      user_id: purchaseData.user_id,
      purchase_date: purchaseData.purchase_date,
      notes: purchaseData.notes,
      created_at: purchaseData.created_at,
      updated_at: purchaseData.updated_at,
      user: purchaseData.user ? {
        id: purchaseData.user.id,
        username: purchaseData.user.username,
        email: purchaseData.user.email,
        role: purchaseData.user.role
      } : null,
      items: purchaseData.items ? purchaseData.items.map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        price: item.price,
        quantity: item.quantity,
        total: item.total
      })) : []
    };

    return NextResponse.json({
      success: true,
      purchase: formattedPurchase
    });
  } catch (error) {
    console.error('Error fetching purchase:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch purchase' },
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
    const purchase = await Purchase.findByPk(id);
    
    if (!purchase) {
      return NextResponse.json(
        { success: false, error: 'Purchase not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, description, supplier_name, status, notes } = body;

    // Validate status
    if (!status || !['pending', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Status is required and must be pending, completed, or cancelled' },
        { status: 400 }
      );
    }

    // Update purchase
    await purchase.update({
      name: name || null,
      description: description || null,
      supplier_name: supplier_name || null,
      status,
      notes: notes || null
    });

    return NextResponse.json({
      success: true,
      message: 'Purchase updated successfully',
      purchase: {
        id: purchase.id,
        name: purchase.name,
        description: purchase.description,
        total_amount: purchase.total_amount,
        status: purchase.status,
        supplier_name: purchase.supplier_name,
        user_id: purchase.user_id,
        purchase_date: purchase.purchase_date,
        notes: purchase.notes,
        created_at: purchase.created_at,
        updated_at: purchase.updated_at
      }
    });
  } catch (error) {
    console.error('Error updating purchase:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update purchase' },
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
    const purchase = await Purchase.findByPk(id);
    
    if (!purchase) {
      return NextResponse.json(
        { success: false, error: 'Purchase not found' },
        { status: 404 }
      );
    }

    if (purchase.status !== 'completed') {
      return NextResponse.json(
        { success: false, error: 'Only completed purchases can be deleted' },
        { status: 400 }
      );
    }

    // Delete purchase items first (due to foreign key constraint)
    await PurchaseItem.destroy({ where: { purchase_id: id } });
    
    // Delete the purchase
    await purchase.destroy();

    return NextResponse.json(
      { success: true, message: 'Purchase deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting purchase:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete purchase' },
      { status: 500 }
    );
  }
} 