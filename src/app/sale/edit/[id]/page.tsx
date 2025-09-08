"use client"
import React, { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { getCurrentUser } from '@/lib/auth'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

interface Table {
  id: string
  name: string
  status: 'available' | 'occupied' | 'reserved'
}

interface Sale {
  id: string
  items: SaleItem[]
  total_amount: number
  discount: number
  created_at: string
  status: 'pending' | 'completed' | 'cancelled'
  customer_name?: string
  table_number?: string
  notes?: string
}

export default function EditSalePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [customerName, setCustomerName] = useState("")
  const [tableNumber, setTableNumber] = useState("")
  const [status, setStatus] = useState<Sale['status']>("pending")
  const [notes, setNotes] = useState("")
  const [discount, setDiscount] = useState(0)
  const [items, setItems] = useState<SaleItem[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [saleId, setSaleId] = useState<string>('')

  useEffect(() => {
    // Initialize params
    const initParams = async () => {
      const resolvedParams = await params;
      setSaleId(resolvedParams.id);
    };
    initParams();
  }, [params]);

  useEffect(() => {
    if (!saleId) return;

    // Check user role first
    const user = getCurrentUser();
    setCurrentUser(user);
    
    // Redirect staff users
    if (user && user.role === 'Staff') {
      toast.error("You don't have permission to edit sales.");
      router.push('/sale');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        // Fetch sale
        const res = await fetch(`/api/v1/sale/${saleId}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to fetch sale")
        setCustomerName(data.sale.customer_name || "")
        setTableNumber(data.sale.table_number || "")
        setStatus(data.sale.status)
        setNotes(data.sale.notes || "")
        setDiscount(data.sale.discount || 0)
        setItems(data.sale.items)
        // Fetch products
        const prodRes = await fetch(`/api/v1/product?page=1&pageSize=1000&type=sale`)
        const prodData = await prodRes.json()
        if (!prodRes.ok) throw new Error(prodData.error || "Failed to fetch products")
        setProducts(prodData.products)
        
        // Fetch tables
        const tablesRes = await fetch(`/api/v1/table`)
        const tablesData = await tablesRes.json()
        if (tablesRes.ok) {
          setTables(tablesData.tables || [])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [saleId, router])

  const handleItemChange = (idx: number, field: keyof SaleItem, value: any) => {
    setItems(items => items.map((item, i) =>
      i === idx ? { ...item, [field]: value, total: field === "price" || field === "quantity" ? (field === "price" ? value : item.price) * (field === "quantity" ? value : item.quantity) : item.total } : item
    ))
  }

  const handleProductChange = (idx: number, productId: string) => {
    const product = products.find(p => p.id === productId)
    if (!product) return
    setItems(items => items.map((item, i) =>
      i === idx ? { ...item, product_id: product.id, product_name: product.product_name, price: product.price, total: product.price * item.quantity } : item
    ))
  }

  const handleAddItem = () => {
    if (products.length === 0) return
    
    // Find the first product that's not already in the items
    const availableProduct = products.find(product => 
      !items.some(item => item.product_id === product.id)
    )
    
    if (!availableProduct) {
      toast.error("All products have already been added")
      return
    }
    
    setItems([...items, { 
      product_id: availableProduct.id, 
      product_name: availableProduct.product_name, 
      price: availableProduct.price, 
      quantity: 1, 
      total: availableProduct.price 
    }])
  }

  const handleRemoveItem = (idx: number) => {
    setItems(items => items.filter((_, i) => i !== idx))
  }

  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const totalAmount = Math.max(0, subtotal - discount)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1/sale/${saleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_name: customerName, table_number: tableNumber, status, notes, discount, items })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update sale")
      toast.success("Sale updated!")
      router.push("/sale")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      toast.error(errorMessage);
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="mt-5">Loading...</div>

  return (
    <div className="max-w-3xl mx-auto py-10 px-2 sm:px-0">
      <h1 className="text-2xl font-bold mb-6">Edit Sale</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">Customer Name</label>
            <Input value={customerName} onChange={e => setCustomerName(e.target.value)} />
          </div>
          <div>
            <label className="block font-medium mb-1">Table Number</label>
            <Select value={tableNumber} onValueChange={setTableNumber}>
              <SelectTrigger>
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
        <div>
          <label className="block font-medium mb-1">Status</label>
          <Select value={status} onValueChange={value => setStatus(value as Sale['status'])}>
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
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
        <div>
          <label className="block font-medium mb-1">Discount Amount</label>
          <Input 
            type="number" 
            value={discount} 
            onChange={e => setDiscount(Number(e.target.value) || 0)} 
            min={0}
            placeholder="0"
          />
          <p className="text-xs text-gray-500 mt-1">Enter amount in cents (e.g., 1000 = $10.00)</p>
        </div>
        <div>
          <label className="block font-medium mb-2">Items</label>
          <div className="overflow-x-auto rounded-md border mb-2">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <select
                        className="border rounded px-2 py-1 w-full"
                        value={item.product_id}
                        onChange={e => handleProductChange(idx, e.target.value)}
                      >
                        {products.map(p => {
                          // Check if this product is already used in other items
                          const isUsed = items.some((otherItem, otherIdx) => 
                            otherIdx !== idx && otherItem.product_id === p.id
                          )
                          return (
                            <option 
                              key={p.id} 
                              value={p.id}
                              disabled={isUsed}
                            >
                              {p.product_name} {isUsed ? '(Already added)' : ''}
                            </option>
                          )
                        })}
                      </select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.price}
                        min={0}
                        onChange={e => handleItemChange(idx, "price", Number(e.target.value))}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.quantity}
                        min={1}
                        onChange={e => handleItemChange(idx, "quantity", Number(e.target.value))}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>{item.total}</TableCell>
                    <TableCell>
                      <Button type="button" variant="destructive" onClick={() => handleRemoveItem(idx)} disabled={items.length === 1} className="w-full sm:w-auto">Remove</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3}>Subtotal</TableCell>
                  <TableCell>{subtotal}</TableCell>
                  <TableCell />
                </TableRow>
                {discount > 0 && (
                  <TableRow>
                    <TableCell colSpan={3}>Discount</TableCell>
                    <TableCell className="text-red-600">-{discount}</TableCell>
                    <TableCell />
                  </TableRow>
                )}
                <TableRow>
                  <TableCell colSpan={3}>Total Amount</TableCell>
                  <TableCell className="font-bold">{totalAmount}</TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            </Table>
          </div>
          <Button type="button" className="mt-2 w-full sm:w-auto" onClick={handleAddItem}>Add Item</Button>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
          <Button type="button" variant="secondary" onClick={() => router.push("/sale")}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}