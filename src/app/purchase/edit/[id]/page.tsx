"use client"

import React, { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { getCurrentUser } from '@/lib/auth'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"

interface PurchaseItem {
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

export default function EditPurchasePage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [items, setItems] = useState<PurchaseItem[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    // Check user role first
    const user = getCurrentUser();
    setCurrentUser(user);
    
    // Redirect staff users
    if (user && user.role === 'Staff') {
      toast({
        title: "Access Denied",
        description: "You don't have permission to edit purchases.",
        variant: "destructive",
      });
      router.push('/purchase');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        // Fetch purchase
        const res = await fetch(`/api/v1/purchase/${params.id}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to fetch purchase")
        setName(data.purchase.name)
        setDescription(data.purchase.description)
        setItems(data.purchase.items)
        // Fetch products
        const prodRes = await fetch(`/api/v1/product?page=1&pageSize=1000&type=purchase`)
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
  }, [params.id, router])

  const handleItemChange = (idx: number, field: keyof PurchaseItem, value: any) => {
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
      const res = await fetch(`/api/v1/purchase/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, items })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update purchase")
      toast({ title: "Purchase updated!" })
      router.push("/purchase")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="mt-5">Loading...</div>
  if (error) return <div className="mt-5 text-red-600">Error: {error}</div>

  return (
    <div className="max-w-3xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Edit Purchase</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block font-medium mb-1">Name</label>
          <Input value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div>
          <label className="block font-medium mb-1">Description</label>
          <Textarea value={description} onChange={e => setDescription(e.target.value)} required />
        </div>
        <div>
          <label className="block font-medium mb-2">Items</label>
          <Table>
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
                      className="border rounded px-2 py-1"
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
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={item.quantity}
                      min={1}
                      onChange={e => handleItemChange(idx, "quantity", Number(e.target.value))}
                    />
                  </TableCell>
                  <TableCell>{item.total}</TableCell>
                  <TableCell>
                    <Button type="button" variant="destructive" onClick={() => handleRemoveItem(idx)} disabled={items.length === 1}>x</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Button type="button" className="mt-2" onClick={handleAddItem}>Add Item</Button>
        </div>
        <div className="font-bold text-lg">Total Amount: {totalAmount}</div>
        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
          <Button type="button" variant="secondary" onClick={() => router.push("/purchase")}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}
