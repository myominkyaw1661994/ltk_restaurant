'use client'

import * as React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
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
import { ArrowLeft } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

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
  created_at: string
}

interface DetailPageProps {
  params: { id: string }
}

export default function PurchaseDetail({ params }: DetailPageProps) {
  const { id } = params
  const router = useRouter()
  const { toast } = useToast()
  const [purchase, setPurchase] = useState<Purchase | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPurchase = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/v1/purchase/${id}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch purchase')
        }

        setPurchase(data.purchase)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred'
        setError(errorMessage)
        toast({
          title: "Error",
          description: "Failed to fetch purchase details",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchPurchase()
  }, [id, toast])

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

  if (loading) {
    return <div className="mt-5">Loading...</div>
  }

  if (error || !purchase) {
    return <div className="mt-5 text-red-600">Error: {error || 'Purchase not found'}</div>
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Purchase Details</h1>
        <Button variant="outline" onClick={() => router.push('/purchase')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Purchases
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Purchase Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-1">Name</h3>
                  <p>{purchase.name}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Date</h3>
                  <p>{formatDate(purchase.created_at)}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Description</h3>
                <p>{purchase.description}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Total Amount</h3>
                <p className="text-lg font-bold">{formatCurrency(purchase.total_amount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Purchase Items</CardTitle>
            <CardDescription>
              {purchase.items.length} items in this purchase
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchase.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.product_name}</TableCell>
                    <TableCell>{formatCurrency(item.price)}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 