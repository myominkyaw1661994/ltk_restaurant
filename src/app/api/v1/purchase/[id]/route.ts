import { NextRequest, NextResponse } from 'next/server';
import { Purchase, PurchaseItem, User } from '@/lib/models';
import sequelize from '@/lib/database';

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
    const { name, description, supplier_name, status, notes, items } = body;

    // Start a transaction to ensure data consistency
    const transaction = await sequelize.transaction();

    try {
      // Update purchase
      await purchase.update({
        name: name || null,
        description: description || null,
        supplier_name: supplier_name || null,
        status,
        notes: notes || null
      }, { transaction });

      let totalAmount = 0;

      // Handle purchase items
      if (items && Array.isArray(items)) {
        // Get existing items for this purchase
        const existingItems = await PurchaseItem.findAll({
          where: { purchase_id: id },
          transaction
        });

        // Process each item in the request
        for (const itemData of items) {
          const { id: itemId, product_id, product_name, price, quantity } = itemData;
          const itemTotal = price * quantity;
          totalAmount += itemTotal;

          if (itemId) {
            // Update existing item
            const existingItem = existingItems.find(item => (item as any).id === itemId);
            if (existingItem) {
              await existingItem.update({
                product_id,
                product_name,
                price,
                quantity,
                total: itemTotal
              }, { transaction });
            } else {
              throw new Error(`Purchase item with ID ${itemId} not found`);
            }
          } else {
            // Create new item
            await PurchaseItem.create({
              purchase_id: id,
              product_id,
              product_name,
              price,
              quantity,
              total: itemTotal
            }, { transaction });
          }
        }

        // Remove items that are no longer in the request
        const requestedItemIds = items.filter((item: any) => item.id).map((item: any) => item.id);
        const itemsToDelete = existingItems.filter(item => !requestedItemIds.includes((item as any).id));
        
        if (itemsToDelete.length > 0) {
          await PurchaseItem.destroy({
            where: {
              id: itemsToDelete.map(item => (item as any).id)
            },
            transaction
          });
        }
      }

      // Update purchase total amount
      await purchase.update({
        total_amount: totalAmount
      }, { transaction });

      // Commit the transaction
      await transaction.commit();

      // Fetch updated purchase with items
      const updatedPurchase = await Purchase.findByPk(id, {
        include: [
          {
            model: PurchaseItem,
            as: 'items',
            attributes: ['id', 'product_id', 'product_name', 'price', 'quantity', 'total']
          }
        ]
      });

      const purchaseData = (updatedPurchase as any).toJSON?.() || updatedPurchase;

      return NextResponse.json({
        success: true,
        message: 'Purchase and items updated successfully',
        purchase: {
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
          items: purchaseData.items ? purchaseData.items.map((item: any) => ({
            id: item.id,
            product_id: item.product_id,
            product_name: item.product_name,
            price: item.price,
            quantity: item.quantity,
            total: item.total
          })) : []
        }
      });

    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      throw error;
    }

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

    // Start a transaction to ensure data consistency
    const transaction = await sequelize.transaction();

    try {
      // Delete purchase items first (due to foreign key constraint)
      await PurchaseItem.destroy({ 
        where: { purchase_id: id },
        transaction 
      });
      
      // Delete the purchase
      await purchase.destroy({ transaction });

      // Commit the transaction
      await transaction.commit();

      return NextResponse.json(
        { success: true, message: 'Purchase and all associated items deleted successfully' },
        { status: 200 }
      );
    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error deleting purchase:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete purchase' },
      { status: 500 }
    );
  }
} 