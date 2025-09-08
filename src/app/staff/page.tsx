'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Users, DollarSign, Calendar } from 'lucide-react'
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

interface StaffResponse {
  success: boolean
  staff: Staff[]
  pagination: {
    currentPage: number
    pageSize: number
    totalItems: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export default function StaffPage() {
  const [staff, setStaff] = React.useState<Staff[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('')
  const [currentPage, setCurrentPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [totalItems, setTotalItems] = React.useState(0)
  const router = useRouter()

  const fetchStaff = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params: Record<string, string> = {
        page: currentPage.toString(),
        pageSize: '10'
      }

      if (searchTerm) {
        params.search = searchTerm
      }

      if (statusFilter) {
        params.status = statusFilter
      }

      const response = await api.get<StaffResponse>('/api/v1/staff', params)
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch staff')
      }

      setStaff(response.data!.staff)
      setTotalPages(response.data!.pagination.totalPages)
      setTotalItems(response.data!.pagination.totalItems)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      toast.error('Failed to load staff data')
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchTerm, statusFilter])

  React.useEffect(() => {
    fetchStaff()
  }, [fetchStaff])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchStaff()
  }

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status === statusFilter ? '' : status)
    setCurrentPage(1)
  }

  const handleDelete = async (staffId: string, staffName: string) => {
    if (!confirm(`Are you sure you want to delete ${staffName}?`)) {
      return
    }

    try {
      const response = await api.delete(`/api/v1/staff/${staffId}`)
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete staff')
      }

      toast.success('Staff deleted successfully')
      fetchStaff()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete staff'
      toast.error(errorMessage)
    }
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

  if (loading && staff.length === 0) {
    return <div className="mt-5">Loading...</div>
  }

  if (error) {
    return <div className="mt-5 text-red-600">Error: {error}</div>
  }

  return (
    <AuthGuard>
      <div className="container mx-auto py-10">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Staff Management</h1>
            <p className="text-gray-600 text-sm sm:text-base">Manage your restaurant staff and salary payments</p>
          </div>
          <Button onClick={() => router.push('/staff/new')} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Staff
          </Button>
        </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">
              All staff members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {staff.filter(s => s.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Salary</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(staff.reduce((sum, s) => sum + (Number(s.salary) || 0), 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Monthly salary budget
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => router.push('/staff/pay-salaries')}
              >
                Pay All Salaries
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search & Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name, phone, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full sm:w-auto">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </form>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant={statusFilter === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusFilter('')}
              className="flex-1 sm:flex-none"
            >
              All
            </Button>
            <Button
              variant={statusFilter === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusFilter('active')}
              className="flex-1 sm:flex-none"
            >
              Active
            </Button>
            <Button
              variant={statusFilter === 'inactive' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusFilter('inactive')}
              className="flex-1 sm:flex-none"
            >
              Inactive
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Members</CardTitle>
        </CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No staff members found
            </div>
          ) : (
            <div className="space-y-4">
              {staff.map((member) => (
                <div key={member.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-4">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      <h3 className="font-semibold text-lg">{member.name}</h3>
                      {getStatusBadge(member.status)}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{member.phone}</p>
                    <p className="text-sm text-gray-500">{member.address}</p>
                  </div>
                  
                  <div className="flex flex-col sm:items-end gap-2">
                    <div className="text-left sm:text-right">
                      <p className="font-semibold text-green-600 text-lg">
                        {formatCurrency(Number(member.salary) || 0)}
                      </p>
                      <p className="text-xs text-gray-500">Monthly salary</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 sm:gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/staff/${member.id}`)}
                        className="flex-1 sm:flex-none text-xs"
                      >
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/staff/edit/${member.id}`)}
                        className="flex-1 sm:flex-none text-xs"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/staff/${member.id}/pay-salary`)}
                        className="flex-1 sm:flex-none text-xs"
                      >
                        Pay
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(member.id, member.name)}
                        className="flex-1 sm:flex-none text-xs"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mt-6">
              <p className="text-sm text-gray-600 text-center sm:text-left">
                Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalItems)} of {totalItems} staff
              </p>
              <div className="flex justify-center sm:justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </Button>
                <span className="px-3 py-2 text-sm flex items-center">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </AuthGuard>
  )
}
