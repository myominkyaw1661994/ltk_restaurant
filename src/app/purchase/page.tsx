'use client'

import * as React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from '@/lib/auth'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Eye, Plus, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface PurchaseItem {
  product_id: string
  product_name: string
  price: number
  quantity: number
  total: number
}

interface Purchase {
  id: string
  name: string
  description: string
  total_amount: number
  items: PurchaseItem[]
  purchase_date: string
  created_at: string
}

interface PaginationData {
  currentPage: number
  pageSize: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export default function PurchaseList() {
  const router = useRouter()

  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [purchaseToDelete, setPurchaseToDelete] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  })

  // Check if user can perform admin actions (not staff)
  const canPerformAdminActions = () => {
    return currentUser && currentUser.role !== 'Staff';
  };

  const fetchPurchases = async (page: number, pageSize: number) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/v1/purchase?page=${page}&pageSize=${pageSize}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch purchases')
      }
      console.log('data', data.purchases)
      setPurchases(data.purchases)
      setPagination(data.pagination)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      toast.error("Failed to fetch purchases")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Get current user on component mount
    const user = getCurrentUser();
    setCurrentUser(user);
    
    fetchPurchases(pagination.currentPage, pagination.pageSize)
  }, [pagination.currentPage, pagination.pageSize])

  const handlePageSizeChange = (value: string) => {
    setPagination(prev => ({
      ...prev,
      pageSize: parseInt(value),
      currentPage: 1 // Reset to first page when changing page size
    }))
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/v1/purchase/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete purchase')
      }

      toast.success("Purchase deleted successfully")

      // Refresh the list
      fetchPurchases(pagination.currentPage, pagination.pageSize)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      toast.error(errorMessage)
    } finally {
      setDeleteDialogOpen(false)
      setPurchaseToDelete(null)
    }
  }

  const confirmDelete = (id: string) => {
    setPurchaseToDelete(id)
    setDeleteDialogOpen(true)
  }

  if (loading) {
    return <div className="mt-5">Loading...</div>
  }

  if (error) {
    return <div className="mt-5 text-red-600">Error: {error}</div>
  }

  return (
    <div className="container mx-auto py-10 px-2 sm:px-0">
      <div className="flex justify-between items-center mb-6 flex-col sm:flex-row gap-4 sm:gap-0">
        <h1 className="text-3xl font-bold">Purchases</h1>
        {canPerformAdminActions() && (
          <Button onClick={() => router.push('/purchase/new')} className="w-full sm:w-auto">
            Add Purchase
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="rounded-md border overflow-x-auto shadow-sm">
        <Table className="min-w-[700px] text-sm sm:text-base">
          <TableCaption>A list of your recent purchases.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Items</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases.map((purchase) => (
              <TableRow key={purchase.id}>
                <TableCell>{purchase.name}</TableCell>
                <TableCell>{purchase.description}</TableCell>
                <TableCell>{formatDate(purchase.purchase_date)}</TableCell>
                <TableCell>{formatCurrency(purchase.total_amount)}</TableCell>
                <TableCell>{purchase.items.length} items</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/purchase/${purchase.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {canPerformAdminActions() && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/purchase/edit/${purchase.id}`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => confirmDelete(purchase.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-4">
          <div className="flex items-center space-x-2">
            <span>Page size:</span>
            <Select
              value={pagination.pageSize.toString()}
              onValueChange={handlePageSizeChange}
            >
              <SelectTrigger className="w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
              disabled={!pagination.hasPreviousPage}
            >
              Previous
            </Button>
            <span>
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
              disabled={!pagination.hasNextPage}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Purchase</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this purchase? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setPurchaseToDelete(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => purchaseToDelete && handleDelete(purchaseToDelete)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
