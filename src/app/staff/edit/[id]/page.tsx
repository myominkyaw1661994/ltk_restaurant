'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save } from 'lucide-react'
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

export default function EditStaffPage({ params }: { params: Promise<{ id: string }> }) {
  const [loading, setLoading] = React.useState(false)
  const [staff, setStaff] = React.useState<Staff | null>(null)
  const [staffId, setStaffId] = React.useState<string>('')
  const [formData, setFormData] = React.useState({
    name: '',
    address: '',
    phone: '',
    salary: '',
    status: 'active' as 'active' | 'inactive'
  })
  const router = useRouter()

  // Resolve params
  React.useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params
      setStaffId(resolvedParams.id)
    }
    resolveParams()
  }, [params])

  // Fetch staff data
  React.useEffect(() => {
    if (!staffId) return

    const fetchStaff = async () => {
      try {
        const response = await api.get<{success: boolean, staff: Staff}>(`/api/v1/staff/${staffId}`)
        
        if (!response.success) {
          throw new Error(response.error || 'Failed to fetch staff')
        }

        const staffData = response.data!.staff
        setStaff(staffData)
        setFormData({
          name: staffData.name,
          address: staffData.address,
          phone: staffData.phone,
          salary: staffData.salary.toString(),
          status: staffData.status
        })
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch staff'
        toast.error(errorMessage)
        router.push('/staff')
      }
    }

    fetchStaff()
  }, [staffId, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.address || !formData.phone || !formData.salary) {
      toast.error('Please fill in all required fields')
      return
    }

    // Phone number validation
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{7,20}$/
    if (!phoneRegex.test(formData.phone)) {
      toast.error('Please enter a valid phone number (7-20 characters)')
      return
    }

    const salary = parseFloat(formData.salary)
    if (isNaN(salary) || salary <= 0) {
      toast.error('Please enter a valid salary amount')
      return
    }

    setLoading(true)

    try {
      const response = await api.put(`/api/v1/staff/${staffId}`, {
        name: formData.name,
        address: formData.address,
        phone: formData.phone,
        salary: salary,
        status: formData.status
      })

      if (!response.success) {
        throw new Error(response.error || 'Failed to update staff')
      }

      toast.success('Staff updated successfully')
      router.push('/staff')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update staff'
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
            <h1 className="text-3xl font-bold">Edit Staff</h1>
            <p className="text-gray-600">Update staff information</p>
          </div>
        </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Staff Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+1234567890 or 1234567890"
                    pattern="[\+]?[\d\s\-\(\)]{7,20}"
                    title="Enter a valid phone number (7-20 characters, can include +, spaces, dashes, parentheses)"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter full address"
                  rows={3}
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="salary">Monthly Salary (MMK) *</Label>
                  <Input
                    id="salary"
                    type="number"
                    value={formData.salary}
                    onChange={(e) => handleInputChange('salary', e.target.value)}
                    placeholder="50000"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: 'active' | 'inactive') => handleInputChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Updating...' : 'Update Staff'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/staff')}
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
