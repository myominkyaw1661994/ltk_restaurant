"use client"

import React, { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { requestNotificationPermission } from '@/lib/notification'

import { Printer } from "lucide-react"

interface SaleItem {
  product_id: string
  product_name: string
  price: number
  quantity: number
  total: number
}

interface Product {
  id: string
  product_name: string
  price: number
  category: string
}

type SaleStatus = 'pending' | 'completed' | 'cancelled'

type Table = {
  id: number
  name: string
}

export default function POSPage() {
  const router = useRouter()
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [customerName, setCustomerName] = useState("")
  const [tableNumber, setTableNumber] = useState("")
  const [notes, setNotes] = useState("")
  const [status, setStatus] = useState<SaleStatus>("pending")
  const [cartItems, setCartItems] = useState<SaleItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [saleDetails, setSaleDetails] = useState<any>(null)
  const [tables, setTables] = useState<Table[]>([])



  // Category options
  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'food', label: 'Food' },
    { value: 'beverage', label: 'Beverage' },
    { value: 'dessert', label: 'Dessert' },
    { value: 'appetizer', label: 'Appetizer' },
    { value: 'main-course', label: 'Main Course' },
    { value: 'side-dish', label: 'Side Dish' },
    { value: 'snack', label: 'Snack' },
    { value: 'ingredient', label: 'Ingredient' },
    { value: 'other', label: 'Other' }
  ]

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        setError(null)
        const prodRes = await fetch(`/api/v1/product?page=1&pageSize=1000&type=sale`)
        const prodData = await prodRes.json()
        if (!prodRes.ok) throw new Error(prodData.error || "Failed to fetch products")
        setProducts(prodData.products)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    const fetchTables = async () => {
      const tablesRes = await fetch(`/api/v1/table`)
      const data = await tablesRes.json();
      setTables(data.tables);
    }

    fetchProducts()
    fetchTables()
  }, [])

  useEffect(() => {
    requestNotificationPermission().catch(console.error)
  }, [])

  // On mount, if table param is present, fetch latest sale for that table
  useEffect(() => {
    const tableParam = searchParams.get("table");
    if (tableParam) {
      console.log("tableParam", tableParam)
      setTableNumber(tableParam);
      // Fetch latest sale for this table
      const fetchLatestSale = async () => {
        try {
          // const res = await fetch(`/api/v1/sale?table_number=${tableParam}&status=pending&limit=1&sort=desc`);
          const res = await fetch(`/api/v1/sale/pending_sale?table_number=${tableParam}`);
          const data = await res.json();
          console.log("data", data)
          if (data.sales && data.sales.length > 0) {
            const sale = data.sales[0];
            setCartItems(sale.items || []);
            setCustomerName(sale.customer_name || "");
            setNotes(sale.notes || "");
            setStatus(sale.status || "pending");
          }
        } catch (err) {
          // Optionally handle error
        }
      };
      fetchLatestSale();
    }
  }, [searchParams]);

  const filteredProducts = products.filter(product => {
    const nameMatch = product.product_name.toLowerCase().includes(searchQuery.toLowerCase())
    const categoryMatch = selectedCategory === 'all' || product.category === selectedCategory
    return nameMatch && categoryMatch
  })

  const addToCart = (product: Product) => {
    // Add haptic feedback for mobile devices
    if ('vibrate' in navigator) {
      navigator.vibrate(50); // Short vibration (50ms)
    }
    
    setCartItems(currentItems => {
      const existingItem = currentItems.find(item => item.product_id === product.id)
      if (existingItem) {
        return currentItems.map(item =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
            : item
        )
      }
      return [...currentItems, {
        product_id: product.id,
        product_name: product.product_name,
        price: product.price,
        quantity: 1,
        total: product.price
      }]
    })
  }

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return
    setCartItems(currentItems =>
      currentItems.map(item =>
        item.product_id === productId
          ? { ...item, quantity: newQuantity, total: newQuantity * item.price }
          : item
      )
    )
  }

  const removeFromCart = (productId: string) => {
    setCartItems(currentItems => currentItems.filter(item => item.product_id !== productId))
  }

  const totalAmount = cartItems.reduce((sum, item) => sum + item.total, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cartItems.length === 0) {
      toast.error("Please add items to cart")
      return
    }

    setSaving(true)
    setError(null)
    try {
      const saleData = {
        customer_name: customerName,
        table_number: tableNumber,
        status,
        notes,
        items: cartItems
      }

      console.log('Submitting sale with status:', status) // Debug log

      const res = await fetch(`/api/v1/sale`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saleData)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create sale")
      
      console.log('Received sale data:', data.sale) // Debug log
      
      // Use the status from the response, or fallback to the status we sent
      const saleWithStatus = {
        ...data.sale,
        status: data.sale.status || status
      }
      
      // Store sale details and show success dialog
      setSaleDetails(saleWithStatus)
      setShowSuccessDialog(true)
      
      // Clear cart and form, but preserve the status for the next sale
      setCartItems([])
      setCustomerName("")
      setTableNumber("")
      setNotes("")
      // Don't reset status - keep the user's selection for the next sale
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      toast.error(errorMessage);
    } finally {
      setSaving(false)
    }
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'MMK',
    }).format(amount)
  }

  if (loading) return <div className="mt-5">Loading...</div>

  return (
    <div className="container mx-auto py-4 px-2 sm:py-10 sm:px-4">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center sm:text-left">Point of Sale</h1>
      
      {/* Mobile: Stack vertically, Desktop: Side by side */}
      <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 sm:gap-6 overflow-y-auto lg:overflow-visible">
        
        {/* Products Section - Show first on mobile */}
        <div className="order-1 lg:order-2 space-y-3 sm:space-y-4">
          <div className="sticky top-0 z-10 space-y-2 pb-2">
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-base"
            />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full text-base">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="h-[40vh] lg:h-[calc(100vh-300px)] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
              {filteredProducts.map((product) => {
                const cartItem = cartItems.find(item => item.product_id === product.id);
                const itemCount = cartItem ? cartItem.quantity : 0;
                
                return (
                  <Card
                    key={product.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow active:scale-95 touch-manipulation relative"
                    onClick={() => addToCart(product)}
                  >
                    {/* Product Count Badge */}
                    {itemCount > 0 && (
                      <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center z-10 shadow-lg">
                        {itemCount}
                      </div>
                    )}
                    
                    <CardHeader className="p-2 sm:p-4">
                      <CardTitle className="text-xs sm:text-lg leading-tight">{product.product_name}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 sm:p-4 pt-0">
                      <p className="text-sm sm:text-lg font-bold text-green-600">{product.price} MMK</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Cart Section - Show second on mobile */}
        <div className="order-2 lg:order-1 space-y-3 sm:space-y-4">
          <Card className="h-auto lg:h-[calc(100vh-200px)] overflow-y-auto lg:overflow-y-auto">
            <CardHeader className="top-0 z-10 pb-3">
              <CardTitle className="text-lg sm:text-xl">Current Sale</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                {/* Customer and Table Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block font-medium mb-1 text-sm sm:text-base">Customer Name</label>
                    <Input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Optional"
                      className="text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1 text-sm sm:text-base">Table Number</label>
                    <Select value={tableNumber} onValueChange={setTableNumber}>
                      <SelectTrigger className="text-sm sm:text-base">
                        <SelectValue placeholder="Select table" />
                      </SelectTrigger>
                      <SelectContent>
                      {tables.map((table) => (
                        <SelectItem key={table.id} value={table.name}>
                          {table.name}
                        </SelectItem>
                      ))}
                      </SelectContent>
                     
                    </Select>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block font-medium mb-1 text-sm sm:text-base">Status</label>
                  <Select value={status} onValueChange={(value) => setStatus(value as SaleStatus)}>
                    <SelectTrigger className="text-sm sm:text-base">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
                <div>
                  <label className="block font-medium mb-1 text-sm sm:text-base">Notes</label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional"
                    className="text-sm sm:text-base min-h-[60px]"
                  />
                </div>

                {/* Cart Items */}
                <div className="rounded-md border overflow-hidden">
                  <div className="overflow-visible">
                    <Table>
                      <TableHeader className="sticky top-0">
                        <TableRow>
                          <TableHead className="text-xs sm:text-sm">Product</TableHead>
                          <TableHead className="text-xs sm:text-sm">Price</TableHead>
                          <TableHead className="text-xs sm:text-sm">Qty</TableHead>
                          <TableHead className="text-xs sm:text-sm">Total</TableHead>
                          <TableHead className="text-xs sm:text-sm w-16"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cartItems.map((item) => (
                          <TableRow key={item.product_id}>
                            <TableCell className="text-xs sm:text-sm font-medium">{item.product_name}</TableCell>
                            <TableCell className="text-xs sm:text-sm">{item.price}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-1 sm:space-x-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                                  className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                                >
                                  -
                                </Button>
                                <span className="text-xs sm:text-sm font-medium min-w-[20px] text-center">{item.quantity}</span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                                  className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                                >
                                  +
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm font-medium">{item.total}</TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => removeFromCart(item.product_id)}
                                className="h-6 w-6 sm:h-8 sm:w-8 p-0 text-xs"
                              >
                                ×
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Total Amount - Always visible */}
                  <div className="p-3 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm sm:text-base">Total Amount:</span>
                      <span className="font-bold text-lg sm:text-xl text-green-600">{totalAmount} MMK</span>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold"
                  disabled={saving || cartItems.length === 0}
                >
                  {saving ? "Processing..." : status === "completed" ? "Complete Sale" : "Save Sale"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className={`text-xl sm:text-2xl ${
              saleDetails?.status === "completed" ? "text-green-600" :
              saleDetails?.status === "pending" ? "text-yellow-600" :
              "text-red-600"
            }`}>
              {saleDetails?.status === "completed" ? "Sale Completed Successfully!" : 
               saleDetails?.status === "pending" ? "Sale Saved as Pending!" :
               "Sale Cancelled!"}
            </DialogTitle>
          </DialogHeader>
          
          {saleDetails && (
            <div className="space-y-4">
              <div id="print-content" className="space-y-4">
                <div className="text-center mb-4">
                  <h2 className="text-lg sm:text-xl font-bold">Restaurant Management System</h2>
                  <p className="text-xs sm:text-sm text-gray-500">Thank you for your business!</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm sm:text-base">
                  <div>
                    <p className="font-semibold">Date</p>
                    <p>{formatDate(saleDetails.created_at)}</p>
                  </div>
                  {saleDetails.customer_name && (
                    <div>
                      <p className="font-semibold">Customer</p>
                      <p>{saleDetails.customer_name}</p>
                    </div>
                  )}
                  {saleDetails.table_number && (
                    <div>
                      <p className="font-semibold">Table</p>
                      <p>Table {saleDetails.table_number}</p>
                    </div>
                  )}
                </div>

                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm">Product</TableHead>
                        <TableHead className="text-xs sm:text-sm">Price</TableHead>
                        <TableHead className="text-xs sm:text-sm">Qty</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {saleDetails.items.map((item: SaleItem) => (
                        <TableRow key={item.product_id}>
                          <TableCell className="text-xs sm:text-sm">{item.product_name}</TableCell>
                          <TableCell className="text-xs sm:text-sm">{formatCurrency(item.price)}</TableCell>
                          <TableCell className="text-xs sm:text-sm">{item.quantity}</TableCell>
                          <TableCell className="text-right text-xs sm:text-sm">{formatCurrency(item.total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={3} className="text-right font-bold text-sm sm:text-base">
                          Total Amount:
                        </TableCell>
                        <TableCell className="text-right font-bold text-sm sm:text-base">
                          {formatCurrency(saleDetails.total_amount)}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>

                {saleDetails.notes && (
                  <div>
                    <p className="font-semibold text-sm sm:text-base">Notes</p>
                    <p className="text-sm sm:text-base">{saleDetails.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const printContent = document.getElementById('print-content')
                if (printContent) {
                  const originalContent = document.body.innerHTML
                  const printWindow = window.open('', '_blank')
                  if (printWindow) {
                    printWindow.document.write(`
                      <html>
                        <head>
                          <title>Sale Receipt</title>
                          <style>
                            @page {
                              size: 80mm 297mm;
                              margin: 0;
                            }
                            body { 
                              font-family: 'Courier New', monospace;
                              font-size: 12px;
                              width: 80mm;
                              margin: 0;
                              padding: 5mm;
                            }
                            table { 
                              width: 100%;
                              border-collapse: collapse;
                              margin: 5px 0;
                              font-size: 12px;
                            }
                            th, td { 
                              padding: 2px;
                              text-align: left;
                              border-bottom: 1px dashed #000;
                            }
                            .text-right { text-align: right; }
                            .font-bold { font-weight: bold; }
                            .text-center { 
                              text-align: center;
                              margin: 5px 0;
                            }
                            .text-gray-500 { color: #000; }
                            .grid { 
                              display: grid;
                              grid-template-columns: 1fr 1fr;
                              gap: 5px;
                              margin: 5px 0;
                            }
                            .space-y-4 > * + * { margin-top: 5px; }
                            .mb-4 { margin-bottom: 5px; }
                            .border { border: none; }
                            .rounded-md { border-radius: 0; }
                            .p-4 { padding: 2px; }
                            hr {
                              border: none;
                              border-top: 1px dashed #000;
                              margin: 5px 0;
                            }
                            .receipt-header {
                              text-align: center;
                              margin-bottom: 5px;
                            }
                            .receipt-header h2 {
                              font-size: 14px;
                              margin: 0;
                              font-weight: bold;
                            }
                            .receipt-header p {
                              font-size: 10px;
                              margin: 2px 0;
                            }
                            .receipt-footer {
                              text-align: center;
                              margin-top: 10px;
                              font-size: 10px;
                            }
                          </style>
                        </head>
                        <body>
                          <div class="receipt-header">
                            <h2>Restaurant Management System</h2>
                            <p>Thank you for your business!</p>
                          </div>
                          <hr/>
                          ${printContent.innerHTML}
                          <hr/>
                          <div class="receipt-footer">
                            <p>Thank you for dining with us!</p>
                            <p>Please come again</p>
                          </div>
                        </body>
                      </html>
                    `)
                    printWindow.document.close()
                    printWindow.focus()
                    printWindow.print()
                    printWindow.close()
                  }
                }
              }}
              className="w-full sm:w-auto"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Receipt
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowSuccessDialog(false)}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setShowSuccessDialog(false)
                router.push('/sale')
              }}
              className="w-full sm:w-auto"
            >
              View All Sales
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 