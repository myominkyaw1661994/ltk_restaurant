'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { DollarSign, ShoppingCart, TrendingUp, Calendar, BarChart3 } from 'lucide-react'
import { requestNotificationPermission } from '@/lib/notification'
import { api } from '@/lib/api-client'

interface DashboardSummary {
  currentMonth: {
    totalSales: number
    totalPurchases: number
    profit: number
    totalTransactions: number
    averageSaleAmount: number
    averagePurchaseAmount: number
  }
  monthlyData: {
    month: string
    sales: number
    purchases: number
    profit: number
  }[]
  dailyData: {
    day: number
    date: string
    sales: number
    purchases: number
    profit: number
  }[]
  recentSales: {
    id: string
    sale_no: string
    total_amount: number
    customer_name: string
    created_at: string
  }[]
  recentPurchases: {
    id: string
    name: string
    total_amount: number
    supplier_name: string
    created_at: string
  }[]
  topDays: {
    day: number
    date: string
    sales: number
    purchases: number
    profit: number
  }[]
  dateRange: {
    startDate: string
    endDate: string
    year: number
    month: number
  }
}

export default function Home() {
  const [summary, setSummary] = React.useState<DashboardSummary | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = React.useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear())

  React.useEffect(() => {
    console.log('useEffect triggered - selectedMonth:', selectedMonth, 'selectedYear:', selectedYear);
    
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

        console.log('Fetching data for year:', selectedYear, 'month:', selectedMonth);
        // Fetch summary data
        const summaryResponse = await api.get<{data: DashboardSummary}>(`/api/v1/sale/summary?year=${selectedYear}&month=${selectedMonth}`);
        if (!summaryResponse.success) {
          throw new Error(summaryResponse.error || 'Failed to fetch summary data');
        }
        
        console.log('Summary response:', summaryResponse.data);
        if (!summaryResponse.data?.data) {
          console.error('No data property in response:', summaryResponse.data);
          throw new Error('Invalid response structure from API');
        }
        console.log('Setting summary data:', summaryResponse.data.data);
        setSummary(summaryResponse.data.data)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred'
        console.error('Error fetching dashboard data:', err);
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [selectedMonth, selectedYear])

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

  if (loading) {
    return <div className="mt-5">Loading...</div>
  }

  if (error) {
    return <div className="mt-5 text-red-600">Error: {error}</div>
  }

  if (!summary || !summary.currentMonth) {
    return <div className="mt-5 text-gray-600">No data available</div>
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
            onChange={e => {
              const newMonth = Number(e.target.value);
              console.log('Month changed from', selectedMonth, 'to', newMonth);
              setSelectedMonth(newMonth);
            }}
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
            onChange={e => {
              const newYear = Number(e.target.value);
              console.log('Year changed from', selectedYear, 'to', newYear);
              setSelectedYear(newYear);
            }}
          >
              <option key={2026} value={2026}>{2026}</option>
              <option key={2025} value={2025}>{2025}</option>
              <option key={2024} value={2024}>{2024}</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.currentMonth.totalSales)}</div>
            <p className="text-xs text-muted-foreground">
              Avg: {formatCurrency(summary.currentMonth.averageSaleAmount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.currentMonth.totalPurchases)}</div>
            <p className="text-xs text-muted-foreground">
              Avg: {formatCurrency(summary.currentMonth.averagePurchaseAmount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.currentMonth.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(summary.currentMonth.profit)}
            </div>
            <p className="text-xs text-muted-foreground">
              Net profit (sales - purchases)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.currentMonth.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">
              Total transactions this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        {/* Monthly Chart */}
        <Card>
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

        {/* Daily Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Sales Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={summary.dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2} name="Sales" />
                <Line type="monotone" dataKey="purchases" stroke="#3b82f6" strokeWidth={2} name="Purchases" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Days */}
      {summary.topDays.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Top Performing Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {summary.topDays.map((day, index) => (
                <div key={day.day} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-semibold">Day {day.day}</p>
                    <p className="text-sm text-gray-500">{day.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{formatCurrency(day.sales)}</p>
                    <p className="text-xs text-gray-500">Sales</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {summary.recentSales.map((sale) => (
                <div key={sale.id} className="flex justify-between items-center p-2 border rounded">
                  <div>
                    <p className="font-medium">{sale.customer_name}</p>
                    <p className="text-sm text-gray-500">{formatDate(sale.created_at)}</p>
                    <p className="text-xs text-gray-400">{sale.sale_no}</p>
                  </div>
                  <p className="font-semibold text-green-600">{formatCurrency(sale.total_amount)}</p>
                </div>
              ))}
              {summary.recentSales.length === 0 && (
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
              {summary.recentPurchases.map((purchase) => (
                <div key={purchase.id} className="flex justify-between items-center p-2 border rounded">
                  <div>
                    <p className="font-medium">{purchase.name}</p>
                    <p className="text-sm text-gray-500">{formatDate(purchase.created_at)}</p>
                    <p className="text-xs text-gray-400">{purchase.supplier_name}</p>
                  </div>
                  <p className="font-semibold text-blue-600">{formatCurrency(purchase.total_amount)}</p>
                </div>
              ))}
              {summary.recentPurchases.length === 0 && (
                <p className="text-gray-500 text-center py-4">No purchases for selected period</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
