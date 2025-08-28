'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { DollarSign, ShoppingCart, TrendingUp } from 'lucide-react'
import { requestNotificationPermission } from '@/lib/notification'
import { api } from '@/lib/api-client'

interface DashboardSummary {
  totalSales: number
  totalPurchases: number
  profit: number
  recentSales: {
    id: string
    total_amount: number
    created_at: string
    customer_name?: string
  }[]
  recentPurchases: {
    id: string
    total_amount: number
    created_at: string
    name: string
  }[]
  monthlyData: {
    month: string
    sales: number
    purchases: number
  }[]
}

export default function Home() {
  const [summary, setSummary] = React.useState<DashboardSummary>({
    totalSales: 0,
    totalPurchases: 0,
    profit: 0,
    recentSales: [],
    recentPurchases: [],
    monthlyData: []
  })
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = React.useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear())

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Request notification permission
        try {
          await requestNotificationPermission();
        } catch (notificationError) {
          console.error('Notification permission error:', notificationError);
          // Continue with dashboard data even if notification fails
        }

        // Fetch sales
        const salesResponse = await api.get<{sales: any[]}>('/api/v1/sale', { page: '1', pageSize: '1000' });
        if (!salesResponse.success) {
          throw new Error(salesResponse.error || 'Failed to fetch sales');
        }

        // Fetch purchases
        const purchasesResponse = await api.get<{purchases: any[]}>('/api/v1/purchase', { page: '1', pageSize: '1000' });
        if (!purchasesResponse.success) {
          throw new Error(purchasesResponse.error || 'Failed to fetch purchases');
        }

        // Process data for the chart
        const monthlyData = processMonthlyData(salesResponse.data!.sales, purchasesResponse.data!.purchases)

        setSummary({
          totalSales: 0, // will be recalculated below
          totalPurchases: 0,
          profit: 0,
          recentSales: salesResponse.data!.sales,
          recentPurchases: purchasesResponse.data!.purchases,
          monthlyData
        })
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const processMonthlyData = (sales: any[], purchases: any[]) => {
    // Get the last 6 months as {year, month} objects
    const now = new Date()
    const monthsArr = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      monthsArr.push({
        year: d.getFullYear(),
        month: d.getMonth(),
        label: d.toLocaleString('en-US', { month: 'short', year: '2-digit' })
      })
    }

    // Helper to get year-month string
    const getYM = (dateStr: string) => {
      const d = new Date(dateStr)
      return `${d.getFullYear()}-${d.getMonth()}`
    }

    // Aggregate sales and purchases by year-month
    const salesByMonth: Record<string, number> = {}
    sales.forEach((sale) => {
      const ym = getYM(sale.created_at)
      salesByMonth[ym] = (salesByMonth[ym] || 0) + sale.total_amount
    })
    const purchasesByMonth: Record<string, number> = {}
    purchases.forEach((purchase) => {
      const ym = getYM(purchase.created_at)
      purchasesByMonth[ym] = (purchasesByMonth[ym] || 0) + purchase.total_amount
    })

    // Build chart data for the last 6 months
    return monthsArr.map(({ year, month, label }) => {
      const ym = `${year}-${month}`
      return {
        month: label,
        sales: salesByMonth[ym] || 0,
        purchases: purchasesByMonth[ym] || 0
      }
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'MMK',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border rounded-lg shadow-lg">
          <p className="font-semibold">{label}</p>
          <p className="text-green-600">Sales: {formatCurrency(payload[0].value)}</p>
          <p className="text-blue-600">Purchases: {formatCurrency(payload[1].value)}</p>
        </div>
      )
    }
    return null
  }

  // Get all years in the data for dropdown
  const allYears = React.useMemo(() => {
    const years = new Set<number>()
    
    summary.recentSales.forEach(s => {
      if (s.created_at) {
        const year = new Date(s.created_at).getFullYear()
        if (!isNaN(year)) {
          years.add(year)
        }
      }
    })
    
    summary.recentPurchases.forEach(p => {
      if (p.created_at) {
        const year = new Date(p.created_at).getFullYear()
        if (!isNaN(year)) {
          years.add(year)
        }
      }
    })
    
    return Array.from(years).sort((a, b) => b - a)
  }, [summary.recentSales, summary.recentPurchases])

  // Filter sales and purchases for selected month/year
  const filteredSales = summary.recentSales.filter(s => {
    const d = new Date(s.created_at)
    return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth
  })
  const filteredPurchases = summary.recentPurchases.filter(p => {
    const d = new Date(p.created_at)
    return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth
  })

  const totalSales = filteredSales.reduce((sum, s) => sum + s.total_amount, 0)
  const totalPurchases = filteredPurchases.reduce((sum, p) => sum + p.total_amount, 0)
  const profit = totalSales - totalPurchases

  if (loading) {
    return <div className="mt-5">Loading...</div>
  }

  if (error) {
    return <div className="mt-5 text-red-600">Error: {error}</div>
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Month/Year Dropdowns */}
      <div className="flex gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Month</label>
          <select
            className="border rounded px-2 py-1"
            value={selectedMonth}
            onChange={e => setSelectedMonth(Number(e.target.value))}
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i} value={i}>{new Date(0, i).toLocaleString('en-US', { month: 'long' })}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Year</label>
          <select
            className="border rounded px-2 py-1"
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
          >
              <option key={2026} value={2026}>{2026}</option>
              <option key={2025} value={2025}>{2025}</option>
              <option key={2024} value={2024}>{2024}</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSales)}</div>
            <p className="text-xs text-muted-foreground">
              Total revenue from sales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPurchases)}</div>
            <p className="text-xs text-muted-foreground">
              Total cost of purchases
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(profit)}
            </div>
            <p className="text-xs text-muted-foreground">
              Net profit (sales - purchases)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Monthly Sales vs Purchases</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={summary.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
              <YAxis />
                <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2} name="Sales" />
              <Line type="monotone" dataKey="purchases" stroke="#3b82f6" strokeWidth={2} name="Purchases" />
            </LineChart>
            </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredSales.slice(0, 5).map((sale) => (
                <div key={sale.id} className="flex justify-between items-center p-2 border rounded">
                  <div>
                    <p className="font-medium">{sale.customer_name || 'Anonymous'}</p>
                    <p className="text-sm text-gray-500">{formatDate(sale.created_at)}</p>
                  </div>
                  <p className="font-semibold text-green-600">{formatCurrency(sale.total_amount)}</p>
                </div>
                ))}
              {filteredSales.length === 0 && (
                <p className="text-gray-500 text-center py-4">No sales for selected period</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredPurchases.slice(0, 5).map((purchase) => (
                <div key={purchase.id} className="flex justify-between items-center p-2 border rounded">
                  <div>
                    <p className="font-medium">{purchase.name}</p>
                    <p className="text-sm text-gray-500">{formatDate(purchase.created_at)}</p>
                  </div>
                  <p className="font-semibold text-blue-600">{formatCurrency(purchase.total_amount)}</p>
                </div>
                ))}
              {filteredPurchases.length === 0 && (
                <p className="text-gray-500 text-center py-4">No purchases for selected period</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
