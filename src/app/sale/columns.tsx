"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from 'next/navigation';


// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Sale = {
  id: string
  total_amount: number
  discount: number
  created_at: string
  status: 'pending' | 'completed' | 'cancelled'
  customer_name?: string
  table_number?: string
}
  
export const columns: ColumnDef<Sale>[] = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "customer_name",
    header: "Customer",
  },
  {
    accessorKey: "table_number",
    header: "Table",
  },
  {
    accessorKey: "discount",
    header: "Discount",
    cell: ({ row }) => {
      const discount = parseFloat(row.getValue("discount"))
      if (discount === 0) return "-"
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "MMK",
      }).format(discount)
      return <span className="text-red-600">-{formatted}</span>
    },
  },
    {
    accessorKey: "total_amount",
    header: "Total Amount",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("total_amount"))
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "MMK",
      }).format(amount)
      return formatted
    },
  },
  {
    accessorKey: "created_at",
    header: "Date",
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"))
      return date.toLocaleDateString()
    },
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const sale = row.original
      const router = useRouter()

      const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this sale?')) {
          try {
            const response = await fetch(`/api/v1/sale/${sale.id}`, {
              method: 'DELETE',
            });
            
            if (!response.ok) {
              throw new Error('Failed to delete sale');
            }
            
            router.refresh();
          } catch (error) {
            console.error('Error deleting sale:', error);
            alert('Failed to delete sale');
          }
        }
      }

      return (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/sale/${sale.id}`)}
          >
            View
          </Button>
          {sale.status === 'pending' && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    },
  },
]
