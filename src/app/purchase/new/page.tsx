"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
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

export default function NewPurchasePage() {
  const router = useRouter()
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
        description: "You don't have permission to create purchases.",
        variant: "destructive",
      });
      router.push('/purchase');
      return;
    }

    const fetchProducts = async () => {
      try {
        setLoading(true)
        setError(null)
        const prodRes = await fetch(`/api/v1/product?page=1&pageSize=1000&type=purchase`)
        const prodData = await prodRes.json()
        if (!prodRes.ok) throw new Error(prodData.error || "Failed to fetch products")
        setProducts(prodData.products)
        // Add one default item
        if (prodData.products.length > 0) {
          setItems([
            {
              product_id: prodData.products[0].id,
              product_name: prodData.products[0].product_name,
              price: prodData.products[0].price,
              quantity: 1,
              total: prodData.products[0].price
            }
          ])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [router])

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
      const res = await fetch(`/api/v1/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, items })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create purchase")
      toast({ title: "Purchase created!" })
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
      <h1 className="text-2xl font-bold mb-6">New Purchase</h1>
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
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[140px] sm:min-w-[150px]">Product</TableHead>
                  <TableHead className="min-w-[100px] sm:min-w-[100px]">Price</TableHead>
                  <TableHead className="min-w-[90px] sm:min-w-[80px]">Quantity</TableHead>
                  <TableHead className="min-w-[100px] sm:min-w-[120px]">Total</TableHead>
                  <TableHead className="min-w-[80px] sm:min-w-[100px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, idx) => (
                  <TableRow key={idx} className="">
                    <TableCell className="py-2">
                      <select
                        className="w-full border rounded px-3 py-2 text-sm sm:text-base"
                        value={item.product_id}
                        onChange={e => handleProductChange(idx, e.target.value)}
                      >
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.product_name}</option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell className="py-2">
                      <Input
                        type="number"
                        value={item.price}
                        min={0}
                        className="w-full text-sm sm:text-base px-3 py-2"
                        onChange={e => handleItemChange(idx, "price", Number(e.target.value))}
                      />
                    </TableCell>
                    <TableCell className="py-2">
                      <Input
                        type="number"
                        value={item.quantity}
                        min={1}
                        className="w-full text-sm sm:text-base px-3 py-2"
                        onChange={e => handleItemChange(idx, "quantity", Number(e.target.value))}
                      />
                    </TableCell>
                    <TableCell className="py-2 text-sm sm:text-base font-medium text-right">
                      {item.total.toLocaleString()}
                    </TableCell>
                    <TableCell className="py-2">
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="sm"
                        className="w-full sm:w-auto text-xs sm:text-sm px-3 py-2"
                        onClick={() => handleRemoveItem(idx)} 
                        disabled={items.length === 1}
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Button type="button" className="mt-2" onClick={handleAddItem}>Add Item</Button>
        </div>
        <div className="font-bold text-lg">Total Amount: {totalAmount.toLocaleString()}</div>
        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Create Purchase"}</Button>
          <Button type="button" variant="secondary" onClick={() => router.push("/purchase")}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}
