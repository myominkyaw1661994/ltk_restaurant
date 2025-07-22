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
import { Badge } from "@/components/ui/badge"

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
    id: string;
    product_name: string;
    price: number;
    category: string;
    type: 'sale' | 'purchase';
    created_at: string;
}

// Category label mapping
const getCategoryLabel = (category: string) => {
  const categoryMap: { [key: string]: string } = {
    'food': 'Food',
    'beverage': 'Beverage',
    'dessert': 'Dessert',
    'appetizer': 'Appetizer',
    'main-course': 'Main Course',
    'side-dish': 'Side Dish',
    'snack': 'Snack',
    'ingredient': 'Ingredient',
    'other': 'Other'
  };
  return categoryMap[category] || category;
};

// Category color mapping
const getCategoryColor = (category: string) => {
  const colorMap: { [key: string]: string } = {
    'food': 'bg-blue-100 text-blue-800',
    'beverage': 'bg-green-100 text-green-800',
    'dessert': 'bg-purple-100 text-purple-800',
    'appetizer': 'bg-orange-100 text-orange-800',
    'main-course': 'bg-red-100 text-red-800',
    'side-dish': 'bg-yellow-100 text-yellow-800',
    'snack': 'bg-pink-100 text-pink-800',
    'ingredient': 'bg-gray-100 text-gray-800',
    'other': 'bg-gray-100 text-gray-800'
  };
  return colorMap[category] || 'bg-gray-100 text-gray-800';
};

export const columns: ColumnDef<ProductType>[] = [
  {
    accessorKey: "product_name",
    header: "Name",
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => {
      const price = row.getValue("price") as number;
      return <div>${price.toLocaleString()}</div>;
    },
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => {
      const category = row.getValue("category") as string;
      return (
        <Badge className={getCategoryColor(category)}>
          {getCategoryLabel(category)}
        </Badge>
      );
    },
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      return (
        <Badge variant={type === 'sale' ? 'default' : 'secondary'}>
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
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
