"use client"
import React, { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { getCurrentUser } from '@/lib/auth'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
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

interface Sale {
  id: string
  items: SaleItem[]
  total_amount: number
  created_at: string
  status: 'pending' | 'completed' | 'cancelled'
  customer_name?: string
  table_number?: string
  notes?: string
}

export default function EditSalePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { id } = params
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [customerName, setCustomerName] = useState("")
  const [tableNumber, setTableNumber] = useState("")
  const [status, setStatus] = useState<Sale['status']>("pending")
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState<SaleItem[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    // Check user role first
    const user = getCurrentUser();
    setCurrentUser(user);
    
    // Redirect staff users
    if (user && user.role === 'Staff') {
      toast({
        title: "Access Denied",
        description: "You don't have permission to edit sales.",
        variant: "destructive",
      });
      router.push('/sale');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        // Fetch sale
        const res = await fetch(`/api/v1/sale/${id}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to fetch sale")
        setCustomerName(data.sale.customer_name || "")
        setTableNumber(data.sale.table_number || "")
        setStatus(data.sale.status)
        setNotes(data.sale.notes || "")
        setItems(data.sale.items)
        // Fetch products
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
    fetchData()
  }, [id, router])

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
    const firstProduct = products[0]
    setItems([...items, { product_id: firstProduct.id, product_name: firstProduct.product_name, price: firstProduct.price, quantity: 1, total: firstProduct.price }])
  }

  const handleRemoveItem = (idx: number) => {
    setItems(items => items.filter((_, i) => i !== idx))
  }

  const totalAmount = items.reduce((sum, item) => sum + item.total, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1/sale/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_name: customerName, table_number: tableNumber, status, notes, items })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update sale")
      toast({ title: "Sale updated!" })
      router.push("/sale")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="mt-5">Loading...</div>
  if (error) return <div className="mt-5 text-red-600">Error: {error}</div>

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
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.product_name}</option>
                        ))}
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