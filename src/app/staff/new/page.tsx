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

export default function NewStaffPage() {
  const [loading, setLoading] = React.useState(false)
  const [formData, setFormData] = React.useState({
    name: '',
    address: '',
    phone: '',
    salary: '',
    status: 'active' as 'active' | 'inactive'
  })
  const router = useRouter()

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
      const response = await api.post('/api/v1/staff', {
        name: formData.name,
        address: formData.address,
        phone: formData.phone,
        salary: salary,
        status: formData.status
      })

      if (!response.success) {
        throw new Error(response.error || 'Failed to create staff')
      }

      toast.success('Staff created successfully')
      router.push('/staff')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create staff'
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
            <h1 className="text-3xl font-bold">Add New Staff</h1>
            <p className="text-gray-600">Create a new staff member</p>
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
                  {loading ? 'Creating...' : 'Create Staff'}
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
