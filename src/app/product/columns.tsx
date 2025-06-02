"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"

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
  id: number,
  date: string,
  name: string,
  amount: number,
  status: string
}
  

export type ProductType = {
    id: number;
    product_name: string;
    price: number;
}

export const columns: ColumnDef<ProductType>[] = [
  {
    accessorKey: "product_name",
    header: "Name",
  },
  {
    accessorKey: "price",
    header: "Price"
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const product = row.original;
      const router = useRouter();
        
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() =>router.push(`/product/${product.id}`)}
            >
              Detail
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>router.push(`/product/edit/${product.id}`)}
            >Edit</DropdownMenuItem>
            <DropdownMenuItem>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  }
]
