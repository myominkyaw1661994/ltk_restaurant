'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, DollarSign, Calendar, Users, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api-client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import AuthGuard from '@/components/AuthGuard'

interface Staff {
  id: string
  name: string
  salary: number
  status: string
}

interface BulkPaymentResult {
  successful: {
    staff_id: string
    staff_name: string
    amount: number
    salary_payment_id: string
    purchase_id: string
  }[]
  skipped: {
    staff_id: string
    staff_name: string
    reason: string
  }[]
  failed: {
    staff_id: string
    staff_name: string
    error: string
  }[]
}

interface BulkPaymentResponse {
  success: boolean
  message: string
  summary: {
    totalStaff: number
    successful: number
    skipped: number
    failed: number
    totalAmount: number
  }
  results: BulkPaymentResult
}

export default function BulkPaySalariesPage() {
  const [staff, setStaff] = React.useState<Staff[]>([])
  const [loading, setLoading] = React.useState(false)
  const [processing, setProcessing] = React.useState(false)
  const [result, setResult] = React.useState<BulkPaymentResponse | null>(null)
  const [formData, setFormData] = React.useState({
    paymentDate: new Date().toISOString().split('T')[0],
    notes: ''
  })
  const router = useRouter()

  // Fetch active staff
  React.useEffect(() => {
    const fetchStaff = async () => {
      try {
        setLoading(true)
        const response = await api.get('/api/v1/staff', { status: 'active' })
        
        if (!response.success) {
          throw new Error(response.error || 'Failed to fetch staff')
        }

        setStaff((response.data as any).staff)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch staff'
        toast.error(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchStaff()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (staff.length === 0) {
      toast.error('No active staff found')
      return
    }

    if (!confirm(`Are you sure you want to process salary payments for ${staff.length} staff members?`)) {
      return
    }

    setProcessing(true)

    try {
      const response = await api.post<BulkPaymentResponse>('/api/v1/staff/pay-salaries', {
        paymentDate: formData.paymentDate,
        notes: formData.notes
      })

      if (!response.success) {
        throw new Error(response.error || 'Failed to process bulk salary payments')
      }

      setResult(response.data!)
      toast.success('Bulk salary payment processed successfully')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process bulk salary payments'
      toast.error(errorMessage)
    } finally {
      setProcessing(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'MMK',
    }).format(amount)
  }

      const totalSalary = staff.reduce((sum, s) => sum + (Number(s.salary) || 0), 0)

  if (loading) {
    return <div className="mt-5">Loading...</div>
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
          <div>
            <h1 className="text-3xl font-bold">Bulk Salary Payment</h1>
            <p className="text-gray-600">Process salary payments for all active staff</p>
          </div>
        </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Staff Summary */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Staff Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Active Staff:</span>
                <span className="font-semibold">{staff.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Salary:</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(totalSalary)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Average Salary:</span>
                <span className="font-semibold">
                  {staff.length > 0 ? formatCurrency(totalSalary / staff.length) : '0'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentDate">Payment Date *</Label>
                  <Input
                    id="paymentDate"
                    type="date"
                    value={formData.paymentDate}
                    onChange={(e) => handleInputChange('paymentDate', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Add notes for all payments..."
                    rows={3}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={processing || staff.length === 0}
                  className="w-full"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  {processing ? 'Processing...' : `Pay All Salaries (${staff.length} staff)`}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Staff List and Results */}
        <div className="md:col-span-2">
          {!result ? (
            <Card>
              <CardHeader>
                <CardTitle>Active Staff Members</CardTitle>
              </CardHeader>
              <CardContent>
                {staff.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No active staff members found
                  </div>
                ) : (
                  <div className="space-y-3">
                    {staff.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h3 className="font-semibold">{member.name}</h3>
                          <p className="text-sm text-gray-500">ID: {member.id}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">
                            {formatCurrency(Number(member.salary) || 0)}
                          </p>
                          <p className="text-xs text-gray-500">Monthly salary</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Payment Results</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Summary */}
                <div className="grid gap-4 md:grid-cols-4 mb-6">
                  <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="font-semibold text-green-800">{result.summary.successful}</p>
                    <p className="text-sm text-green-600">Successful</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertCircle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                    <p className="font-semibold text-yellow-800">{result.summary.skipped}</p>
                    <p className="text-sm text-yellow-600">Skipped</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
                    <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                    <p className="font-semibold text-red-800">{result.summary.failed}</p>
                    <p className="text-sm text-red-600">Failed</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <DollarSign className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="font-semibold text-blue-800">{formatCurrency(result.summary.totalAmount)}</p>
                    <p className="text-sm text-blue-600">Total Paid</p>
                  </div>
                </div>

                {/* Detailed Results */}
                <div className="space-y-4">
                  {/* Successful Payments */}
                  {result.results.successful.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Successful Payments ({result.results.successful.length})
                      </h3>
                      <div className="space-y-2">
                        {result.results.successful.map((item) => (
                          <div key={item.salary_payment_id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div>
                              <p className="font-medium">{item.staff_name}</p>
                              <p className="text-sm text-gray-600">Payment ID: {item.salary_payment_id}</p>
                            </div>
                            <p className="font-semibold text-green-600">{formatCurrency(item.amount)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skipped Payments */}
                  {result.results.skipped.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Skipped Payments ({result.results.skipped.length})
                      </h3>
                      <div className="space-y-2">
                        {result.results.skipped.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div>
                              <p className="font-medium">{item.staff_name}</p>
                              <p className="text-sm text-gray-600">{item.reason}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Failed Payments */}
                  {result.results.failed.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        Failed Payments ({result.results.failed.length})
                      </h3>
                      <div className="space-y-2">
                        {result.results.failed.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div>
                              <p className="font-medium">{item.staff_name}</p>
                              <p className="text-sm text-gray-600">{item.error}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 mt-6">
                  <Button
                    onClick={() => {
                      setResult(null)
                      setFormData({
                        paymentDate: new Date().toISOString().split('T')[0],
                        notes: ''
                      })
                    }}
                  >
                    Process Another Payment
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/staff')}
                  >
                    Back to Staff
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      </div>
    </AuthGuard>
  )
}
