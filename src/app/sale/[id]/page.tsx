"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

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
import { Printer } from "lucide-react"

interface SaleItem {
  id: string
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
  discount: number
  created_at: string
  status: 'pending' | 'completed' | 'cancelled'
  customer_name?: string
  table_number?: string
  notes?: string
  user?: {
    id: string
    username: string
    email: string
  }
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

        const response = await fetch(`/api/v1/sale/${saleId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Sale not found');
        }

        setSale(data.sale);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        toast.error("Failed to fetch sale details")
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
              toast.success('Sale marked as completed')
      // Refresh sale details
      setSale({ ...sale, status: 'completed' })
    } catch (err) {
              toast.error('Failed to update status')
    }
  }

  // Print receipt handler
  const handlePrintReceipt = () => {
    if (!sale) return;
    
    const subtotal = sale.items.reduce((sum, item) => sum + item.total, 0);
    const discount = sale.discount || 0;
    const total = sale.total_amount;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const printHTML = `
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
              .grid { 
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 5px;
                margin: 5px 0;
              }
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
              .discount-row {
                color: #d32f2f !important;
                font-weight: bold;
              }
              .discount-row td {
                color: #d32f2f !important;
              }
            </style>
          </head>
          <body>
            <div class="receipt-header">
              <h2>Restaurant Management System</h2>
              <p>Thank you for your business!</p>
            </div>
            <hr/>
            
            <div class="grid">
              <div>Date</div>
              <div>${formatDate(sale.created_at)}</div>
              ${sale.customer_name ? `<div>Customer</div><div>${sale.customer_name}</div>` : ''}
              ${sale.table_number ? `<div>Table</div><div>Table ${sale.table_number}</div>` : ''}
              <div>Status</div>
              <div>${sale.status}</div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${sale.items.map((item) => `
                  <tr>
                    <td>${item.product_name}</td>
                    <td>${formatCurrency(item.price)}</td>
                    <td>${item.quantity}</td>
                    <td class="text-right">${formatCurrency(item.total)}</td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" class="text-right">Subtotal:</td>
                  <td class="text-right">${formatCurrency(subtotal)}</td>
                </tr>
                ${discount > 0 ? `
                  <tr class="discount-row">
                    <td colspan="3" class="text-right">Discount:</td>
                    <td class="text-right">-${formatCurrency(discount)}</td>
                  </tr>
                ` : ''}
                <tr>
                  <td colspan="3" class="text-right font-bold">Total Amount:</td>
                  <td class="text-right font-bold">${formatCurrency(total)}</td>
                </tr>
              </tfoot>
            </table>
            
            ${sale.notes ? `
              <div style="margin-top: 10px;">
                <div class="font-bold">Notes</div>
                <div>${sale.notes}</div>
              </div>
            ` : ''}
            
            <hr/>
            <div class="receipt-footer">
              <p>Thank you for dining with us!</p>
              <p>Please come again</p>
            </div>
          </body>
        </html>
      `;
      
      printWindow.document.write(printHTML);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

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
          <Button
            variant="outline"
            onClick={handlePrintReceipt}
          >
            <Printer className="mr-2 h-4 w-4" />
            Print Receipt
          </Button>
          {sale.status === 'pending' && (
            <Button
              variant="default"
              onClick={handleChangeStatus}
            >
              Make Completed
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
                {sale.discount > 0 && <div>Discount</div>}
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
                {sale.discount > 0 && <div className="text-red-600">-{formatCurrency(sale.discount)}</div>}
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
              <TableCell colSpan={3}>Subtotal</TableCell>
              <TableCell className="text-right">
                {formatCurrency(sale.items.reduce((sum, item) => sum + item.total, 0))}
              </TableCell>
            </TableRow>
            {sale.discount > 0 && (
              <TableRow>
                <TableCell colSpan={3}>Discount</TableCell>
                <TableCell className="text-right text-red-600">
                  -{formatCurrency(sale.discount)}
                </TableCell>
              </TableRow>
            )}
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