"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
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
}

type SaleStatus = 'pending' | 'completed' | 'cancelled'

export default function POSPage() {
  const router = useRouter()
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
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [saleDetails, setSaleDetails] = useState<any>(null)

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
    fetchProducts()
  }, [])

  useEffect(() => {
    requestNotificationPermission().catch(console.error)
  }, [])

  const filteredProducts = products.filter(product =>
    product.product_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const addToCart = (product: Product) => {
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
      toast({
        title: "Error",
        description: "Please add items to cart",
        variant: "destructive",
      })
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
      
      // Ensure we're using the correct status from the response
      const saleWithStatus = {
        ...data.sale,
        status: data.sale.status || status // Fallback to the status we sent if not in response
      }
      
      // Store sale details and show success dialog
      setSaleDetails(saleWithStatus)
      setShowSuccessDialog(true)
      
      // Clear cart and form
      setCartItems([])
      setCustomerName("")
      setTableNumber("")
      setNotes("")
      setStatus("pending") // Reset status to default
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
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
  if (error) return <div className="mt-5 text-red-600">Error: {error}</div>

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Point of Sale</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left side - Products */}
        <div className="space-y-4">
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-4"
          />
          <div className="h-[calc(100vh-200px)] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => addToCart(product)}
                >
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg">{product.product_name}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-lg font-bold">{product.price} MMK</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Right side - Cart */}
        <div className="space-y-4">
          <Card className="h-[calc(100vh-200px)] overflow-y-auto">
            <CardHeader>
              <CardTitle>Current Sale</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium mb-1">Customer Name</label>
                    <Input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Table Number</label>
                    <Select value={tableNumber} onValueChange={setTableNumber}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select table" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Table 1</SelectItem>
                        <SelectItem value="2">Table 2</SelectItem>
                        <SelectItem value="3">Table 3</SelectItem>
                        <SelectItem value="4">Table 4</SelectItem>
                        <SelectItem value="5">Table 5</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block font-medium mb-1">Status</label>
                  <Select value={status} onValueChange={(value) => setStatus(value as SaleStatus)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block font-medium mb-1">Notes</label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional"
                  />
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cartItems.map((item) => (
                        <TableRow key={item.product_id}>
                          <TableCell>{item.product_name}</TableCell>
                          <TableCell>{item.price}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                              >
                                -
                              </Button>
                              <span>{item.quantity}</span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                              >
                                +
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>{item.total}</TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removeFromCart(item.product_id)}
                            >
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={3} className="text-right font-bold">
                          Total Amount:
                        </TableCell>
                        <TableCell className="font-bold">{totalAmount}</TableCell>
                        <TableCell />
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>

                <Button
                  type="submit"
                  className="w-full"
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className={`text-2xl ${
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
                  <h2 className="text-xl font-bold">Rest LTK</h2>
                  <p className="text-sm text-gray-500">Thank you for your business!</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
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

                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {saleDetails.items.map((item: SaleItem) => (
                        <TableRow key={item.product_id}>
                          <TableCell>{item.product_name}</TableCell>
                          <TableCell>{formatCurrency(item.price)}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={3} className="text-right font-bold">
                          Total Amount:
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(saleDetails.total_amount)}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>

                {saleDetails.notes && (
                  <div>
                    <p className="font-semibold">Notes</p>
                    <p>{saleDetails.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
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
                            <h2>Rest LTK</h2>
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
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Receipt
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowSuccessDialog(false)}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setShowSuccessDialog(false)
                router.push('/sale')
              }}
            >
              View All Sales
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 