import { NextRequest, NextResponse } from 'next/server';
import { Purchase } from '@/lib/models';
import sequelize from '@/lib/database';
import { QueryTypes } from 'sequelize';

export async function GET(request: NextRequest) {
  try {
    // Check if purchases table exists
    const tables = await sequelize.query(
      "SHOW TABLES LIKE 'purchases'",
      { type: QueryTypes.SELECT }
    ) as any[];
    
    if (tables.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Purchases table does not exist'
      }, { status: 500 });
    }
    
    // Check table structure
    const columns = await sequelize.query(
      "DESCRIBE purchases",
      { type: QueryTypes.SELECT }
    ) as any[];
    
    console.log('Purchases table columns:', columns);
    
    // Try to create a simple purchase
    const testPurchase = await Purchase.create({
      name: 'Test Purchase',
      description: 'Test purchase for debugging',
      total_amount: 1000,
      status: 'completed',
      supplier_name: 'Test Supplier',
      notes: 'Test purchase'
    });
    
    console.log('Test purchase created:', testPurchase);
    console.log('Test purchase ID:', (testPurchase as any).id);
    
    // Clean up
    await testPurchase.destroy();
    
    return NextResponse.json({
      success: true,
      message: 'Purchase creation test successful',
      tableExists: true,
      columns: columns.map(col => ({ field: col.Field, type: col.Type, null: col.Null, key: col.Key })),
      testResult: {
        created: true,
        id: (testPurchase as any).id,
        cleanedUp: true
      }
    });
    
  } catch (error) {
    console.error('Purchase test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}
