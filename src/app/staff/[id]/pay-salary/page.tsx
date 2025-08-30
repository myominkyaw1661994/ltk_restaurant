'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, DollarSign, Calendar } from 'lucide-react'
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

export default function PaySalaryPage({ params }: { params: { id: string } }) {
  const [staff, setStaff] = React.useState<Staff | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [formData, setFormData] = React.useState({
    paymentDate: new Date().toISOString().split('T')[0],
    notes: ''
  })
  const router = useRouter()

  // Fetch staff data
  React.useEffect(() => {
    const fetchStaff = async () => {
      try {
        const response = await api.get<{success: boolean, staff: Staff}>(`/api/v1/staff/${params.id}`)
        
        if (!response.success) {
          throw new Error(response.error || 'Failed to fetch staff')
        }

        const staffData = response.data!.staff
        setStaff(staffData)

        if (staffData.status !== 'active') {
          toast.error('Only active staff can receive salary payments')
          router.push(`/staff/${params.id}`)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch staff'
        toast.error(errorMessage)
        router.push('/staff')
      }
    }

    fetchStaff()
  }, [params.id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!staff) {
      toast.error('Staff data not loaded')
      return
    }

    setLoading(true)

    try {
      const response = await api.post(`/api/v1/staff/${params.id}/pay-salary`, {
        paymentDate: formData.paymentDate,
        notes: formData.notes
      })

      if (!response.success) {
        throw new Error(response.error || 'Failed to process salary payment')
      }

      toast.success('Salary payment processed successfully')
      router.push(`/staff/${params.id}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process salary payment'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
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

  if (!staff) {
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
            <h1 className="text-3xl font-bold">Pay Salary</h1>
            <p className="text-gray-600">Process salary payment for {staff.name}</p>
          </div>
        </div>

      <div className="max-w-2xl">
        {/* Staff Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Staff Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-sm font-medium text-gray-500">Name</Label>
                <p className="font-semibold">{staff.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Phone</Label>
                <p>{staff.phone}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Monthly Salary</Label>
                <p className="font-semibold text-green-600">{formatCurrency(Number(staff.salary) || 0)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Status</Label>
                <p className="capitalize">{staff.status}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
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
                  <Label>Amount</Label>
                  <div className="p-3 bg-gray-50 border rounded-md">
                    <p className="font-semibold text-green-600 text-lg">
                      {formatCurrency(Number(staff.salary) || 0)}
                    </p>
                    <p className="text-sm text-gray-500">Monthly salary amount</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Add any additional notes about this payment..."
                  rows={3}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">Important Notes:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• This will create a purchase record for the salary payment</li>
                  <li>• The payment will be marked as completed immediately</li>
                  <li>• Duplicate payments for the same month will be prevented</li>
                  <li>• The payment will appear in your purchase reports</li>
                </ul>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  {loading ? 'Processing...' : 'Process Payment'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/staff/${params.id}`)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      </div>
    </AuthGuard>
  )
}
