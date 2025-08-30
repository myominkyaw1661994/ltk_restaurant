import { NextRequest, NextResponse } from 'next/server';
import { Staff, SalaryPayment, Purchase } from '@/lib/models';
import sequelize from '@/lib/database';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get user info from middleware headers
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    // Additional authentication check
    if (!userId || !userRole) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const staff = await Staff.findByPk(id);
    
    if (!staff) {
      return NextResponse.json(
        { success: false, error: 'Staff not found' },
        { status: 404 }
      );
    }

    if ((staff as any).status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Only active staff can receive salary payments' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { paymentDate, notes } = body;

    // Use provided payment date or current date
    const paymentDateObj = paymentDate ? new Date(paymentDate) : new Date();
    const month = paymentDateObj.getMonth() + 1; // 1-12
    const year = paymentDateObj.getFullYear();

    // Check if salary already paid for this month
    const existingPayment = await SalaryPayment.findOne({
      where: {
        staff_id: id,
        month,
        year
      }
    });

          if (existingPayment) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Salary already paid for ${year}-${month.toString().padStart(2, '0')}`,
            existingPayment: {
              id: (existingPayment as any).id,
              amount: (existingPayment as any).amount,
              payment_date: (existingPayment as any).payment_date,
              status: (existingPayment as any).status
            }
          },
          { status: 400 }
        );
      }

    // Start transaction
    const transaction = await sequelize.transaction();

    try {
      console.log('Creating purchase record with data:', {
        name: `Salary Payment - ${(staff as any).name}`,
        description: `Salary payment for ${(staff as any).name}`,
        total_amount: Math.round(Number((staff as any).salary)),
        status: 'completed',
        supplier_name: (staff as any).name,
        purchase_date: paymentDateObj,
        notes: notes || `Monthly salary payment for ${(staff as any).name}`,
        user_id: userId
      });

      // Create purchase record for salary payment using raw SQL
      let purchaseId;
      try {
        const purchaseData = {
          name: `Salary Payment - ${(staff as any).name}`,
          description: `Salary payment for ${(staff as any).name}`,
          total_amount: Math.round(Number((staff as any).salary)), // Convert to integer
          status: 'completed',
          supplier_name: (staff as any).name,
          purchase_date: paymentDateObj,
          notes: notes || `Monthly salary payment for ${(staff as any).name}`,
          user_id: userId
        };
        
        console.log('Attempting to create purchase with data:', purchaseData);
        
        // Use raw SQL to create purchase
        const purchaseResult = await sequelize.query(`
          INSERT INTO purchases (id, name, description, total_amount, status, supplier_name, purchase_date, notes, user_id, created_at, updated_at)
          VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, { 
          type: 'INSERT' as any,
          replacements: [
            purchaseData.name,
            purchaseData.description,
            purchaseData.total_amount,
            purchaseData.status,
            purchaseData.supplier_name,
            purchaseData.purchase_date,
            purchaseData.notes,
            purchaseData.user_id
          ],
          transaction
        });
        
        console.log('Purchase insert result:', purchaseResult);
        
        // Get the created purchase ID
        const purchases = await sequelize.query(`
          SELECT id FROM purchases WHERE name = ? ORDER BY created_at DESC LIMIT 1
        `, { 
          type: 'SELECT' as any,
          replacements: [purchaseData.name],
          transaction
        }) as any[];
        
        if (purchases.length === 0) {
          throw new Error('Purchase was created but could not retrieve ID');
        }
        
        purchaseId = purchases[0].id;
        console.log('Purchase created successfully with ID:', purchaseId);
        
      } catch (purchaseError) {
        console.error('Error creating purchase:', purchaseError);
        console.error('Purchase error details:', JSON.stringify(purchaseError, null, 2));
        throw new Error(`Failed to create purchase: ${purchaseError}`);
      }

              console.log('Creating salary payment record with data:', {
          staff_id: id,
          amount: (staff as any).salary,
          payment_date: paymentDateObj,
          purchase_id: purchaseId,
          month,
          year,
          status: 'completed',
          notes
        });

        // Create salary payment record
        let salaryPayment;
        try {
          // Ensure purchase_id is available
          if (!purchaseId) {
            throw new Error('Purchase ID is missing - cannot create salary payment');
          }
          
          const salaryPaymentData = {
            staff_id: id,
            amount: (staff as any).salary,
            payment_date: paymentDateObj,
            purchase_id: purchaseId,
            month,
            year,
            status: 'completed' as const,
            notes
          };
        
        console.log('Salary payment data to create:', salaryPaymentData);
        
        salaryPayment = await SalaryPayment.create(salaryPaymentData, { transaction });
        
        console.log('Salary payment created successfully:', (salaryPayment as any).id);
      } catch (salaryError) {
        console.error('Error creating salary payment:', salaryError);
        console.error('Salary payment data that failed:', {
          staff_id: id,
          amount: (staff as any).salary,
          payment_date: paymentDateObj,
          purchase_id: purchaseId,
          month,
          year,
          status: 'completed',
          notes
        });
        throw new Error(`Failed to create salary payment: ${salaryError}`);
      }

      // Commit transaction
      await transaction.commit();

      return NextResponse.json({
        success: true,
        message: 'Salary payment processed successfully',
        salaryPayment: {
          id: (salaryPayment as any).id,
          staff_id: (salaryPayment as any).staff_id,
          amount: (salaryPayment as any).amount,
          payment_date: (salaryPayment as any).payment_date,
          month: (salaryPayment as any).month,
          year: (salaryPayment as any).year,
          status: (salaryPayment as any).status,
          notes: (salaryPayment as any).notes,
          purchase_id: (salaryPayment as any).purchase_id
        },
        purchase: {
          id: purchaseId,
          name: `Salary Payment - ${(staff as any).name}`,
          description: `Salary payment for ${(staff as any).name}`,
          total_amount: Math.round(Number((staff as any).salary)),
          status: 'completed'
        }
      }, { status: 201 });

    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Error processing salary payment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process salary payment' },
      { status: 500 }
    );
  }
}
