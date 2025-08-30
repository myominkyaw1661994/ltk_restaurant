import { NextRequest, NextResponse } from 'next/server';
import { Staff, SalaryPayment, Purchase } from '@/lib/models';
import sequelize from '@/lib/database';
import { QueryTypes } from 'sequelize';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { paymentDate, notes } = body;

    // Use provided payment date or current date
    const paymentDateObj = paymentDate ? new Date(paymentDate) : new Date();
    const month = paymentDateObj.getMonth() + 1; // 1-12
    const year = paymentDateObj.getFullYear();

    // Get all active staff
    const activeStaff = await Staff.findAll({
      where: { status: 'active' }
    });

    if (activeStaff.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No active staff found' },
        { status: 400 }
      );
    }

    // Start transaction
    const transaction = await sequelize.transaction();

    try {
      const results = {
        successful: [] as any[],
        skipped: [] as any[],
        failed: [] as any[]
      };

      // Process each staff member
      for (const staff of activeStaff) {
        try {
          // Check if salary already paid for this month
          const existingPayment = await SalaryPayment.findOne({
            where: {
              staff_id: (staff as any).id,
              month,
              year
            },
            transaction
          });

          if (existingPayment) {
            results.skipped.push({
              staff_id: (staff as any).id,
              staff_name: (staff as any).name,
              reason: `Salary already paid for ${year}-${month.toString().padStart(2, '0')}`
            });
            continue;
          }

          // Create purchase record for salary payment using raw SQL
          let purchaseId;
          try {
            const purchaseData = {
              name: `Salary Payment - ${(staff as any).name}`,
              description: `Salary payment for ${(staff as any).name}`,
              total_amount: Math.round(Number((staff as any).salary)),
              status: 'completed',
              supplier_name: (staff as any).name,
              purchase_date: paymentDateObj,
              notes: notes || `Monthly salary payment for ${(staff as any).name}`,
              user_id: userId
            };

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
          } catch (purchaseError) {
            console.error(`Error creating purchase for staff ${(staff as any).id}:`, purchaseError);
            throw new Error(`Failed to create purchase: ${purchaseError}`);
          }

          // Create salary payment record
          const salaryPayment = await SalaryPayment.create({
            staff_id: (staff as any).id,
            amount: (staff as any).salary,
            payment_date: paymentDateObj,
            purchase_id: purchaseId,
            month,
            year,
            status: 'completed' as const,
            notes
          }, { transaction });

          results.successful.push({
            staff_id: (staff as any).id,
            staff_name: (staff as any).name,
            amount: (staff as any).salary,
            salary_payment_id: (salaryPayment as any).id,
            purchase_id: purchaseId
          });

        } catch (error) {
          console.error(`Error processing salary for staff ${(staff as any).id}:`, error);
          results.failed.push({
            staff_id: (staff as any).id,
            staff_name: (staff as any).name,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Commit transaction
      await transaction.commit();

      const totalProcessed = results.successful.length + results.skipped.length + results.failed.length;
      const totalAmount = results.successful.reduce((sum, item) => sum + item.amount, 0);

      return NextResponse.json({
        success: true,
        message: `Bulk salary payment processed. ${results.successful.length} successful, ${results.skipped.length} skipped, ${results.failed.length} failed`,
        summary: {
          totalStaff: totalProcessed,
          successful: results.successful.length,
          skipped: results.skipped.length,
          failed: results.failed.length,
          totalAmount
        },
        results
      }, { status: 200 });

    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Error processing bulk salary payments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process bulk salary payments' },
      { status: 500 }
    );
  }
}
