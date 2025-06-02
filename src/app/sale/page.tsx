"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, ChevronLeft, ChevronRight, Eye, Pencil, Trash2, Check } from "lucide-react"
import { collection, getDocs, query, orderBy, limit, startAfter, getCountFromServer } from "firebase/firestore"
import { db } from "@/lib/firebase"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"

interface Sale {
  id: string
  items: {
    product_id: string
    product_name: string
    price: number
    quantity: number
    total: number
  }[]
  total_amount: number
  created_at: string
  status: 'pending' | 'completed' | 'cancelled'
  customer_name?: string
  table_number?: string
  notes?: string
}

export default function SalePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [lastDoc, setLastDoc] = useState<any>(null)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [hasPreviousPage, setHasPreviousPage] = useState(false)

  // Filter state
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterCustomer, setFilterCustomer] = useState<string>('')

  // Sorting state
  const [sortBy, setSortBy] = useState<'date' | 'total' | null>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const fetchSales = async (page: number, size: number) => {
    try {
      setLoading(true)
      setError(null)
      
      // Create a query to get all sales, ordered by creation date
      const salesRef = collection(db, 'sales')
      let q = query(salesRef, orderBy('created_at', 'desc'), limit(size))
      
      // If not on first page, start after the last document
      if (page > 1 && lastDoc) {
        q = query(salesRef, orderBy('created_at', 'desc'), startAfter(lastDoc), limit(size))
      }
      
      // Get total count
      const totalCountSnapshot = await getCountFromServer(salesRef)
      const total = totalCountSnapshot.data().count
      setTotalItems(total)
      
      // Get the documents
      const querySnapshot = await getDocs(q)
      
      // Transform the documents into the Sale type
      const salesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Sale[]

      // Update pagination state
      setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1])
      setHasNextPage(querySnapshot.docs.length === size)
      setHasPreviousPage(page > 1)
      
      setSales(salesData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      toast({
        title: "Error",
        description: "Failed to fetch sales",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch sales when component mounts or when page/size changes
  useEffect(() => {
    fetchSales(currentPage, pageSize)
  }, [currentPage, pageSize])

  const handlePageSizeChange = (newSize: string) => {
    const size = parseInt(newSize)
    setPageSize(size)
    setCurrentPage(1) // Reset to first page when changing page size
    setLastDoc(null) // Reset last document
  }

  const handleNextPage = () => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1)
    }
  }

  const handlePreviousPage = () => {
    if (hasPreviousPage) {
      setCurrentPage(prev => prev - 1)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/v1/sale/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete sale')
      }

      toast({
        title: "Success",
        description: "Sale deleted successfully",
      })
      fetchSales(currentPage, pageSize) // Refresh current page
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete sale",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setSaleToDelete(null)
    }
  }

  const handleMarkCompleted = async (sale: Sale) => {
    try {
      const response = await fetch(`/api/v1/sale/${sale.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...sale,
          status: 'completed',
        })
      })
      if (!response.ok) {
        throw new Error('Failed to update sale status')
      }
      toast({
        title: 'Success',
        description: 'Sale marked as completed',
      })
      fetchSales(currentPage, pageSize)
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update sale status',
        variant: 'destructive',
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'MMK',
    }).format(amount)
  }

  // Filtered and sorted sales
  let filteredSales = sales.filter(sale => {
    const statusMatch = filterStatus === 'all' || sale.status === filterStatus
    const customerMatch = filterCustomer === '' || (sale.customer_name || '').toLowerCase().includes(filterCustomer.toLowerCase())
    return statusMatch && customerMatch
  })

  if (sortBy) {
    filteredSales = [...filteredSales].sort((a, b) => {
      if (sortBy === 'date') {
        const aDate = new Date(a.created_at).getTime()
        const bDate = new Date(b.created_at).getTime()
        return sortDir === 'asc' ? aDate - bDate : bDate - aDate
      } else if (sortBy === 'total') {
        return sortDir === 'asc' ? a.total_amount - b.total_amount : b.total_amount - a.total_amount
      }
      return 0
    })
  }

  const handleSort = (column: 'date' | 'total') => {
    if (sortBy === column) {
      setSortDir(dir => (dir === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(column)
      setSortDir('desc')
    }
  }

  return (
    <div className="container mx-auto py-10 px-2 sm:px-0">
      <div className="flex justify-between items-center mb-6 flex-col sm:flex-row gap-4 sm:gap-0">
        <h1 className="text-3xl font-bold">Sales</h1>
        <Button onClick={() => router.push('/sale/new')} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Sale
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4 items-center">
        <div className="flex gap-2 items-center w-full sm:w-auto">
          <label className="text-sm font-medium">Status:</label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 items-center w-full sm:w-auto">
          <label className="text-sm font-medium">Customer:</label>
          <input
            type="text"
            className="border rounded px-2 py-1 w-full sm:w-[180px]"
            placeholder="Search customer"
            value={filterCustomer}
            onChange={e => setFilterCustomer(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="rounded-md border overflow-x-auto shadow-sm">
        <Table className="min-w-[700px] text-sm sm:text-base">
          <TableHeader>
            <TableRow className="bg-white dark:bg-gray-900 sticky top-0 z-10 border-b">
              <TableHead
                className="bg-white dark:bg-gray-900 text-black dark:text-white cursor-pointer select-none"
                onClick={() => handleSort('date')}
              >
                Date
                {sortBy === 'date' && (
                  <span className="ml-1">{sortDir === 'asc' ? '▲' : '▼'}</span>
                )}
              </TableHead>
              <TableHead className="bg-white dark:bg-gray-900 text-black dark:text-white">Customer</TableHead>
              <TableHead className="bg-white dark:bg-gray-900 text-black dark:text-white">Table</TableHead>
              <TableHead className="bg-white dark:bg-gray-900 text-black dark:text-white">Status</TableHead>
              <TableHead
                className="text-right bg-white dark:bg-gray-900 text-black dark:text-white cursor-pointer select-none"
                onClick={() => handleSort('total')}
              >
                Total Amount
                {sortBy === 'total' && (
                  <span className="ml-1">{sortDir === 'asc' ? '▲' : '▼'}</span>
                )}
              </TableHead>
              <TableHead className="text-right bg-white dark:bg-gray-900 text-black dark:text-white">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredSales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No sales found
                </TableCell>
              </TableRow>
            ) : (
              filteredSales.map((sale) => (
                <TableRow key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <TableCell className="whitespace-nowrap">{formatDate(sale.created_at)}</TableCell>
                  <TableCell className="whitespace-nowrap">{sale.customer_name || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{sale.table_number || '-'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold inline-block min-w-[70px] text-center
                      ${sale.status === 'completed' ? 'bg-green-100 text-green-800' :
                        sale.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'}
                    `}>
                      {sale.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-bold whitespace-nowrap">
                    {formatCurrency(sale.total_amount)}
                  </TableCell>
                  <TableCell className="text-right flex flex-row flex-wrap gap-1 justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMarkCompleted(sale)}
                      className="mr-1"
                      aria-label="Mark as Completed"
                      disabled={sale.status === 'completed'}
                    >
                      <Check className={`h-5 w-5 ${sale.status === 'completed' ? 'text-green-400' : ''}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => router.push(`/sale/${sale.id}`)}
                      className="mr-1"
                      aria-label="View"
                    >
                      <Eye className="h-5 w-5" />
                    </Button>
                    {sale.status !== 'completed' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/sale/edit/${sale.id}`)}
                        className="mr-1"
                        aria-label="Edit"
                      >
                        <Pencil className="h-5 w-5" />
                      </Button>
                    )}
                    {sale.status !== 'completed' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSaleToDelete(sale.id)
                          setDeleteDialogOpen(true)
                        }}
                        className="text-red-600 hover:text-red-800"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Rows per page:</span>
          <Select
            value={pageSize.toString()}
            onValueChange={handlePageSizeChange}
          >
            <SelectTrigger className="w-[80px]">
              <SelectValue placeholder="10" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-600">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} entries
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={!hasPreviousPage}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {currentPage}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={!hasNextPage}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the sale.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => saleToDelete && handleDelete(saleToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
