//write a route to get the summary of the sales that return the total sales, total purchases, profit, recent sales, recent purchases, monthly data

import { NextRequest, NextResponse } from 'next/server';
import { Sale, Purchase } from '@/lib/models';
import { Op } from 'sequelize';
import sequelize from '@/lib/database';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get('month') || new Date().getMonth().toString());

    // Calculate date range for the specified month
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

    console.log('Date range:', { startDate, endDate, year, month });

    // Debug: Check what data exists in the database
    const allSales = await Sale.findAll({
      attributes: ['id', 'total_amount', 'status', 'created_at']
    });
    const allPurchases = await Purchase.findAll({
      attributes: ['id', 'total_amount', 'status', 'created_at']
    });
    
    console.log('Database debug:', {
      totalSalesInDB: allSales.length,
      totalPurchasesInDB: allPurchases.length,
      salesStatuses: Array.from(new Set(allSales.map(s => (s as any).status))),
      purchasesStatuses: Array.from(new Set(allPurchases.map(p => (p as any).status)))
    });

    // Get sales data for the month (include all statuses)
    const salesData = await Sale.findAll({
      where: {
        created_at: {
          [Op.gte]: startDate,
          [Op.lte]: endDate
        }
        // Removed status filter to include all sales
      },
      raw: true,
      attributes: [
        'id',
        'sale_no',
        'total_amount',
        'customer_name',
        'created_at',
        'status'
      ],
      order: [['created_at', 'DESC']]
    });

    // Get purchases data for the month (include all statuses)
    const purchasesData = await Purchase.findAll({
      where: {
        created_at: {
          [Op.gte]: startDate,
          [Op.lte]: endDate
        }
        // Removed status filter to include all purchases
      },
      raw: true,
      attributes: [
        'id',
        'name',
        'total_amount',
        'supplier_name',
        'created_at',
        'status'
      ],
      order: [['created_at', 'DESC']]
    });

    
    // Check for null/undefined total_amount values
    const nullAmountPurchases = purchasesData.filter(p => (p as any).total_amount === null || (p as any).total_amount === undefined);
    if (nullAmountPurchases.length > 0) {
      console.warn(`Found ${nullAmountPurchases.length} purchases with null/undefined total_amount:`, 
        nullAmountPurchases.map(p => ({ id: (p as any).id, name: (p as any).name }))
      );
    }

    // Calculate totals with detailed debugging
    const totalSales = salesData.reduce((sum, sale) => {
      const amount = (sale as any).total_amount;
      console.log('Sale amount:', amount, 'Type:', typeof amount, 'Current sum:', sum);
      const numericAmount = Number(amount) || 0;
      const newSum = sum + numericAmount;
      console.log('Numeric amount:', numericAmount, 'New sum:', newSum);
      return newSum;
    }, 0);
    
    const totalPurchases = purchasesData.reduce((sum, purchase) => {
      const amount = (purchase as any).total_amount;
      console.log('Purchase amount:', amount, 'Type:', typeof amount, 'Current sum:', sum);
      const numericAmount = Number(amount) || 0;
      const newSum = sum + numericAmount;
      console.log('Numeric amount:', numericAmount, 'New sum:', newSum);
      return newSum;
    }, 0);
    
    const profit = totalSales - totalPurchases;

    // Test calculation manually
    let manualTotal = 0;
    purchasesData.forEach((purchase, index) => {
      const amount = Number((purchase as any).total_amount) || 0;
      manualTotal += amount;
      console.log(`Purchase ${index + 1}: ${amount}, Manual total: ${manualTotal}`);
    });

    console.log('Calculated totals:', {
      totalSales,
      totalPurchases,
      manualTotal,
      profit,
      salesCount: salesData.length,
      purchasesCount: purchasesData.length,
      isTotalPurchasesNaN: isNaN(totalPurchases),
      isManualTotalNaN: isNaN(manualTotal)
    });

    // Debug purchase data to see what's causing NaN
    console.log('Purchase data debug:', purchasesData.map(p => ({
      id: (p as any).id,
      total_amount: (p as any).total_amount,
      total_amount_type: typeof (p as any).total_amount,
      total_amount_isNaN: isNaN(Number((p as any).total_amount)),
      name: (p as any).name,
      status: (p as any).status
    })));

    // Check for problematic values
    const problematicPurchases = purchasesData.filter(p => {
      const amount = (p as any).total_amount;
      return isNaN(Number(amount)) || amount === null || amount === undefined;
    });
    
    if (problematicPurchases.length > 0) {
      console.error('Problematic purchase amounts:', problematicPurchases.map(p => ({
        id: (p as any).id,
        total_amount: (p as any).total_amount,
        type: typeof (p as any).total_amount
      })));
    }

    // Get last 6 months data for chart
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(year, month - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

      // Get sales for this month (include all statuses)
      const monthSales = await Sale.findAll({
        where: {
          created_at: {
            [Op.gte]: monthStart,
            [Op.lte]: monthEnd
          }
          // Removed status filter
        },
        attributes: [[sequelize.fn('SUM', sequelize.col('total_amount')), 'total']] as any
      });

      // Get purchases for this month (include all statuses)
      const monthPurchases = await Purchase.findAll({
        where: {
          created_at: {
            [Op.gte]: monthStart,
            [Op.lte]: monthEnd
          }
          // Removed status filter
        },
        attributes: [[sequelize.fn('SUM', sequelize.col('total_amount')), 'total']] as any
      });

      const monthSalesTotal = Number((monthSales[0] as any)?.getDataValue('total')) || 0;
      const monthPurchasesTotal = Number((monthPurchases[0] as any)?.getDataValue('total')) || 0;

      last6Months.push({
        month: date.toLocaleString('en-US', { month: 'short', year: '2-digit' }),
        sales: monthSalesTotal,
        purchases: monthPurchasesTotal,
        profit: monthSalesTotal - monthPurchasesTotal
      });
    }

    // Get recent transactions (last 5)
    const recentSales = salesData.slice(0, 5).map(sale => ({
      id: (sale as any).id,
      sale_no: (sale as any).sale_no,
      total_amount: (sale as any).total_amount,
      customer_name: (sale as any).customer_name || 'Anonymous',
      created_at: (sale as any).created_at
    }));

    const recentPurchases = purchasesData.slice(0, 5).map(purchase => ({
      id: (purchase as any).id,
      name: (purchase as any).name || 'Unnamed Purchase',
      total_amount: (purchase as any).total_amount,
      supplier_name: (purchase as any).supplier_name || 'Unknown Supplier',
      created_at: (purchase as any).created_at
    }));

    // Get daily breakdown for the current month
    const dailyData = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStart = new Date(year, month, day);
      const dayEnd = new Date(year, month, day, 23, 59, 59, 999);

      // Get sales for this day (include all statuses)
      const daySales = await Sale.findAll({
        where: {
          created_at: {
            [Op.gte]: dayStart,
            [Op.lte]: dayEnd
          }
          // Removed status filter
        },
        attributes: [[sequelize.fn('SUM', sequelize.col('total_amount')), 'total']] as any
      });

      // Get purchases for this day (include all statuses)
      const dayPurchases = await Purchase.findAll({
        where: {
          created_at: {
            [Op.gte]: dayStart,
            [Op.lte]: dayEnd
          }
          // Removed status filter
        },
        attributes: [[sequelize.fn('SUM', sequelize.col('total_amount')), 'total']] as any
      });

      const daySalesTotal = Number((daySales[0] as any)?.getDataValue('total')) || 0;
      const dayPurchasesTotal = Number((dayPurchases[0] as any)?.getDataValue('total')) || 0;

      dailyData.push({
        day: day,
        date: dayStart.toISOString().split('T')[0],
        sales: daySalesTotal,
        purchases: dayPurchasesTotal,
        profit: daySalesTotal - dayPurchasesTotal
      });
    }

    // Get top performing days
    const topDays = dailyData
      .filter(day => (day.sales as number) > 0)
      .sort((a, b) => (b.sales as number) - (a.sales as number))
      .slice(0, 3);

    // Calculate additional metrics
    const totalTransactions = salesData.length + purchasesData.length;
    const averageSaleAmount = salesData.length > 0 ? totalSales / salesData.length : 0;
    const averagePurchaseAmount = purchasesData.length > 0 ? totalPurchases / purchasesData.length : 0;

    return NextResponse.json({
      success: true,
      message: 'Summary data retrieved successfully',
      data: {
        // Current month summary
        currentMonth: {
          totalSales,
          totalPurchases,
          profit,
          totalTransactions,
          averageSaleAmount,
          averagePurchaseAmount
        },
        
        // Monthly breakdown for chart
        monthlyData: last6Months,
        
        // Daily breakdown
        dailyData,
        
        // Recent transactions
        recentSales,
        recentPurchases,
        
        // Top performing days
        topDays,
        
        // Date range info
        dateRange: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          year,
          month
        }
      }
    });

  } catch (error) {
    console.error('Error in summary API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}