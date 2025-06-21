"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useToast } from "@/components/ui/use-toast"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"

interface SaleItem {
  product_id: string
  product_name: string
  price: number
  quantity: number
  total: number
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

interface DetailPageProps {
  params: Promise<{ id: string }>
}

const printStyles = `
@media print {
  .print-hide { display: none !important; }
  .print-only { display: block !important; }
}
@media screen {
  .print-only { display: none !important; }
}
`;

const DetailPage = ({ params }: DetailPageProps) => {
  const router = useRouter()
  const { toast } = useToast()
  const [sale, setSale] = useState<Sale | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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

    const fetchSale = async () => {
      try {
        setLoading(true)
        setError(null)

        const saleRef = doc(db, 'sales', saleId)
        const saleDoc = await getDoc(saleRef)

        if (!saleDoc.exists()) {
          throw new Error('Sale not found')
        }

        setSale({
          id: saleDoc.id,
          ...saleDoc.data()
        } as Sale)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred'
        setError(errorMessage)
        toast({
          title: "Error",
          description: "Failed to fetch sale details",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSale()
  }, [saleId, toast])

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

  // Change status handler
  const handleChangeStatus = async () => {
    if (!sale) return;
    try {
      const res = await fetch(`/api/v1/sale/${sale.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...sale, status: 'completed' })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update status')
      toast({ title: 'Status updated!', description: 'Sale marked as completed.' })
      // Refresh sale details
      setSale({ ...sale, status: 'completed' })
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' })
    }
  }

  if (loading) {
    return (
      <div className="mt-5">
        <h1 className="text-xl font-semibold">Loading...</h1>
      </div>
    )
  }

  if (error || !sale) {
    return (
      <div className="mt-5">
        <h1 className="text-xl font-semibold text-red-600">Error: {error || 'Sale not found'}</h1>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => router.push('/sale')}
        >
          Back to Sales
        </Button>
      </div>
    )
  }

  return (
    <div className="mt-5">
      <style>{printStyles}</style>
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Sale Details</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => router.push('/sale')}
          >
            Back to Sales
          </Button>
          {sale.status === 'pending' && (
            <Button
              variant="default"
              onClick={handleChangeStatus}
            >
              Make Completed
            </Button>
          )}
          {sale.status === 'completed' && (
            <Button
              variant="default"
              onClick={() => window.print()}
            >
              Print Slip
            </Button>
          )}
        </div>
      </div>

      <div className="mt-5 md:max-w-1/2 print-hide">
        <Card>
          <CardHeader>
            <p className="font-semibold">Sale Information</p>
          </CardHeader>
          <Separator />
          <CardContent>
            <div className="flex gap-30">
              <div className="flex items-start flex-col gap-y-3">
                <div>Date</div>
                <div>Customer</div>
                <div>Table</div>
                <div>Status</div>
                {sale.notes && <div>Notes</div>}
              </div>

              <div className="flex flex-col gap-y-3">
                <div>{formatDate(sale.created_at)}</div>
                <div>{sale.customer_name || '-'}</div>
                <div>{sale.table_number || '-'}</div>
                <div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    sale.status === 'completed' ? 'bg-green-100 text-green-800' :
                    sale.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {sale.status}
                  </span>
                </div>
                {sale.notes && <div>{sale.notes}</div>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-10 print-only:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sale.items.map((item) => (
              <TableRow key={item.product_id}>
                <TableCell className="font-medium">{item.product_name}</TableCell>
                <TableCell>{formatCurrency(item.price)}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3}>Total Amount</TableCell>
              <TableCell className="text-right font-bold">
                {formatCurrency(sale.total_amount)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
      <div className="w-[100px] h-[200px]"></div>
    </div>
  )
}

export default DetailPage