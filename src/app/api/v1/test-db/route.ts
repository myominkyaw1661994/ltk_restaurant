import { NextRequest, NextResponse } from 'next/server';
import { Staff, SalaryPayment, Purchase } from '@/lib/models';
import sequelize from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    await sequelize.authenticate();
    
    // Check if tables exist by trying to count records
    const staffCount = await Staff.count();
    const purchaseCount = await Purchase.count();
    const salaryPaymentCount = await SalaryPayment.count();
    
    // Test creating a simple purchase
    const testPurchase = await Purchase.create({
      name: 'Test Purchase',
      description: 'Test purchase for database verification',
      total_amount: 1000,
      status: 'completed',
      supplier_name: 'Test Supplier',
      notes: 'Test purchase'
    });
    
    console.log('Test purchase created:', testPurchase);
    console.log('Test purchase ID:', (testPurchase as any).id);
    console.log('Test purchase ID type:', typeof (testPurchase as any).id);
    
    // Create a test staff member first
    const testStaff = await Staff.create({
      name: 'Test Staff',
      address: 'Test Address',
      phone: `+123456789${Date.now() % 1000}`, // Unique phone number (3 digits)
      salary: 1000,
      status: 'active'
    });
    
    // Test creating a salary payment
    const salaryPaymentData = {
      staff_id: (testStaff as any).id,
      amount: 1000,
      payment_date: new Date(),
      purchase_id: (testPurchase as any).id,
      month: 1,
      year: 2024,
      status: 'completed' as const,
      notes: 'Test payment'
    };
    
    console.log('Salary payment data:', salaryPaymentData);
    console.log('Purchase ID being used:', (testPurchase as any).id);
    
    const testSalaryPayment = await SalaryPayment.create(salaryPaymentData);
    
    // Clean up test data
    await testSalaryPayment.destroy();
    await testStaff.destroy();
    
    // Clean up test data
    await testSalaryPayment.destroy();
    await testPurchase.destroy();
    
    return NextResponse.json({
      success: true,
      message: 'Database tables are working correctly',
      tableCounts: {
        staff: staffCount,
        purchases: purchaseCount,
        salaryPayments: salaryPaymentCount
      },
      testResults: {
        purchaseCreated: !!(testPurchase as any).id,
        salaryPaymentCreated: !!(testSalaryPayment as any).id,
        cleanupSuccessful: true
      }
    });
    
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}
