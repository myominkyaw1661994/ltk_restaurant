'use client'

import * as React from "react"
import { useEffect, useState } from "react"
import { requestNotificationPermission } from "@/lib/notification"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ArrowDown, ArrowUp, DollarSign, Package, ShoppingCart } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { Select } from "@/components/ui/select"

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
  const [summary, setSummary] = useState<DashboardSummary>({
    totalSales: 0,
    totalPurchases: 0,
    profit: 0,
    recentSales: [],
    recentPurchases: [],
    monthlyData: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Month/year selection state
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth())
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())

  useEffect(() => {
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
        const salesResponse = await fetch('/api/v1/sale?page=1&pageSize=1000')
        if (!salesResponse.ok) {
          throw new Error('Failed to fetch sales')
        }
        const salesData = await salesResponse.json()

        // Fetch purchases
        const purchasesResponse = await fetch('/api/v1/purchase?page=1&pageSize=1000')
        if (!purchasesResponse.ok) {
          throw new Error('Failed to fetch purchases')
        }
        const purchasesData = await purchasesResponse.json()

        // Process data for the chart
        const monthlyData = processMonthlyData(salesData.sales, purchasesData.purchases)

        setSummary({
          totalSales: 0, // will be recalculated below
          totalPurchases: 0,
          profit: 0,
          recentSales: salesData.sales,
          recentPurchases: purchasesData.purchases,
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
    summary.recentSales.forEach(s => years.add(new Date(s.created_at).getFullYear()))
    summary.recentPurchases.forEach(p => years.add(new Date(p.created_at).getFullYear()))
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
            {allYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
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
            <CardTitle className="text-sm font-medium">Profit/Loss</CardTitle>
            {profit >= 0 ? (
              <ArrowUp className="h-4 w-4 text-green-500" />
            ) : (
              <ArrowDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatCurrency(profit)}
            </div>
            <p className="text-xs text-muted-foreground">
              Net profit/loss
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Monthly Overview</CardTitle>
          <CardDescription>
            Sales and purchases over the last 6 months
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={summary.monthlyData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value: number) => formatCurrency(value)} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="sales" name="Sales" fill="#22c55e" />
                <Bar dataKey="purchases" name="Purchases" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>
              Latest 5 sales transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>{formatDate(sale.created_at)}</TableCell>
                    <TableCell>{sale.customer_name || 'N/A'}</TableCell>
                    <TableCell className="text-right">{formatCurrency(sale.total_amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Purchases</CardTitle>
            <CardDescription>
              Latest 5 purchase transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell>{formatDate(purchase.created_at)}</TableCell>
                    <TableCell>{purchase.name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(purchase.total_amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
