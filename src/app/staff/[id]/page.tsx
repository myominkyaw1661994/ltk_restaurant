'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit, DollarSign, Calendar, Phone, MapPin, User } from 'lucide-react'
import { api } from '@/lib/api-client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import AuthGuard from '@/components/AuthGuard'

interface Staff {
  id: string
  name: string
  address: string
  phone: string
  salary: number
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

interface SalaryPayment {
  id: string
  staff_id: string
  amount: number
  payment_date: string
  month: number
  year: number
  status: string
  notes?: string
  created_at: string
  purchase: {
    id: string
    name: string
    description: string
    total_amount: number
    status: string
    created_at: string
  }
}

interface SalaryHistoryResponse {
  success: boolean
  staff: {
    id: string
    name: string
    current_salary: number
    status: string
  }
  salaryPayments: SalaryPayment[]
  summary: {
    totalPayments: number
    totalPaid: number
    averagePayment: number
    yearlyStats: {
      year: number
      payment_count: number
      total_amount: number
    }[]
  }
  pagination: {
    currentPage: number
    pageSize: number
    totalItems: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export default function StaffDetailPage({ params }: { params: { id: string } }) {
  const [staff, setStaff] = React.useState<Staff | null>(null)
  const [salaryHistory, setSalaryHistory] = React.useState<SalaryHistoryResponse | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const router = useRouter()

  React.useEffect(() => {
    const fetchStaffData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch staff details
        const staffResponse = await api.get<{success: boolean, staff: Staff}>(`/api/v1/staff/${params.id}`)
        if (!staffResponse.success) {
          throw new Error(staffResponse.error || 'Failed to fetch staff')
        }

        // Fetch salary history
        const salaryResponse = await api.get<SalaryHistoryResponse>(`/api/v1/staff/${params.id}/salaries`)
        if (!salaryResponse.success) {
          throw new Error(salaryResponse.error || 'Failed to fetch salary history')
        }

        setStaff(staffResponse.data!.staff)
        setSalaryHistory(salaryResponse.data!)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred'
        setError(errorMessage)
        toast.error('Failed to load staff data')
      } finally {
        setLoading(false)
      }
    }

    fetchStaffData()
  }, [params.id])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'MMK',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
        Active
      </Badge>
    ) : (
      <Badge variant="secondary">
        Inactive
      </Badge>
    )
  }

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    return months[month - 1]
  }

  if (loading) {
    return <div className="mt-5">Loading...</div>
  }

  if (error || !staff) {
    return <div className="mt-5 text-red-600">Error: {error}</div>
  }

  return (
    <AuthGuard>
      <div className="container mx-auto py-10">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{staff.name}</h1>
            <p className="text-gray-600">Staff Details</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/staff/edit/${staff.id}`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              onClick={() => router.push(`/staff/${staff.id}/pay-salary`)}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Pay Salary
            </Button>
          </div>
        </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Staff Information */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Staff Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="font-medium">Status:</span>
                {getStatusBadge(staff.status)}
              </div>
              
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-500" />
                <span>{staff.phone}</span>
              </div>
              
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                <span>{staff.address}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <span className="font-semibold text-green-600">
                  {formatCurrency(Number(staff.salary) || 0)}
                </span>
                <span className="text-sm text-gray-500">monthly</span>
              </div>
              
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500">
                  <strong>Joined:</strong> {formatDate(staff.created_at)}
                </p>
                <p className="text-sm text-gray-500">
                  <strong>Last Updated:</strong> {formatDate(staff.updated_at)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Salary Summary */}
          {salaryHistory && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Salary Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Total Payments:</span>
                  <span className="font-semibold">{salaryHistory.summary.totalPayments}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Paid:</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(salaryHistory.summary.totalPaid)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Average Payment:</span>
                  <span className="font-semibold">
                    {formatCurrency(salaryHistory.summary.averagePayment)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Salary History */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Salary Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!salaryHistory || salaryHistory.salaryPayments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No salary payments found
                </div>
              ) : (
                <div className="space-y-4">
                  {salaryHistory.salaryPayments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">
                            {getMonthName(payment.month)} {payment.year}
                          </h3>
                          <Badge variant="outline">
                            {payment.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {formatDate(payment.payment_date)}
                        </p>
                        {payment.notes && (
                          <p className="text-sm text-gray-500 mt-1">{payment.notes}</p>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          {formatCurrency(payment.amount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Purchase: {payment.purchase.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Yearly Statistics */}
              {salaryHistory && salaryHistory.summary.yearlyStats.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-semibold mb-4">Yearly Statistics</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {salaryHistory.summary.yearlyStats.map((yearStat) => (
                      <div key={yearStat.year} className="p-4 border rounded-lg">
                        <h4 className="font-semibold">{yearStat.year}</h4>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm">
                            Payments: <span className="font-medium">{yearStat.payment_count}</span>
                          </p>
                          <p className="text-sm">
                            Total: <span className="font-medium text-green-600">
                              {formatCurrency(yearStat.total_amount)}
                            </span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </AuthGuard>
  )
}
