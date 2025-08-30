import { NextRequest, NextResponse } from 'next/server';
import sequelize from '@/lib/database';
import { QueryTypes } from 'sequelize';

export async function GET(request: NextRequest) {
  try {
    // Test creating a purchase with raw SQL
    const purchaseResult = await sequelize.query(`
      INSERT INTO purchases (id, name, description, total_amount, status, supplier_name, notes, created_at, updated_at)
      VALUES (UUID(), 'Test Purchase SQL', 'Test purchase with raw SQL', 1000, 'completed', 'Test Supplier', 'Test purchase', NOW(), NOW())
    `, { type: QueryTypes.INSERT });
    
    console.log('Purchase insert result:', purchaseResult);
    
    // Get the inserted purchase
    const purchases = await sequelize.query(`
      SELECT * FROM purchases WHERE name = 'Test Purchase SQL' ORDER BY created_at DESC LIMIT 1
    `, { type: QueryTypes.SELECT }) as any[];
    
    console.log('Found purchases:', purchases);
    
    if (purchases.length === 0) {
      throw new Error('Purchase was not created');
    }
    
    const purchase = purchases[0];
    console.log('Purchase found:', purchase);
    
    // Test creating a staff member with raw SQL
    const staffResult = await sequelize.query(`
      INSERT INTO staff (id, name, address, phone, salary, status, created_at, updated_at)
      VALUES (UUID(), 'Test Staff SQL', 'Test Address', CONCAT('+123456789', FLOOR(RAND() * 1000)), 1000, 'active', NOW(), NOW())
    `, { type: QueryTypes.INSERT });
    
    console.log('Staff insert result:', staffResult);
    
    // Get the inserted staff
    const staffMembers = await sequelize.query(`
      SELECT * FROM staff WHERE name = 'Test Staff SQL' ORDER BY created_at DESC LIMIT 1
    `, { type: QueryTypes.SELECT }) as any[];
    
    console.log('Found staff:', staffMembers);
    
    if (staffMembers.length === 0) {
      throw new Error('Staff was not created');
    }
    
    const staff = staffMembers[0];
    console.log('Staff found:', staff);
    
    // Test creating a salary payment with raw SQL
    const salaryPaymentResult = await sequelize.query(`
      INSERT INTO salary_payments (id, staff_id, amount, payment_date, purchase_id, month, year, status, notes, created_at, updated_at)
      VALUES (UUID(), ?, 1000, NOW(), ?, 1, 2024, 'completed', 'Test payment', NOW(), NOW())
    `, { 
      type: QueryTypes.INSERT,
      replacements: [staff.id, purchase.id]
    });
    
    console.log('Salary payment insert result:', salaryPaymentResult);
    
    // Clean up
    await sequelize.query(`DELETE FROM salary_payments WHERE staff_id = ?`, { 
      type: QueryTypes.DELETE,
      replacements: [staff.id]
    });
    await sequelize.query(`DELETE FROM staff WHERE id = ?`, { 
      type: QueryTypes.DELETE,
      replacements: [staff.id]
    });
    await sequelize.query(`DELETE FROM purchases WHERE id = ?`, { 
      type: QueryTypes.DELETE,
      replacements: [purchase.id]
    });
    
    return NextResponse.json({
      success: true,
      message: 'Raw SQL test successful',
      results: {
        purchaseCreated: true,
        staffCreated: true,
        salaryPaymentCreated: true,
        purchaseId: purchase.id,
        staffId: staff.id,
        cleanupSuccessful: true
      }
    });
    
  } catch (error) {
    console.error('Raw SQL test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}
