"use client"
import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { Check, ChevronsUpDown } from "lucide-react"
import RowOfSale from "@/components/Rowofsale"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

type Product = {
  row_id: number
  id: number
  name: string
  prices: number
  qty: number
  total: number
}

interface DetailPageProps {
  params: { id: string }
}

const DEFAULT_PRODUCT: Product = {
  row_id: 1,
  id: 0,
  name: "",
  prices: 0,
  qty: 0,
  total: 0
}

const SALE_PRODUCTS = [
  { id: 1, name: "Product 1", prices: 1000, qty: 0, total: 0 },
  { id: 2, name: "Product 2", prices: 2000, qty: 0, total: 0 },
  { id: 3, name: "Product 3", prices: 3000, qty: 0, total: 0 },
  { id: 4, name: "Product 4", prices: 4000, qty: 0, total: 0 },
  { id: 5, name: "Product 5", prices: 4000, qty: 0, total: 0 },
  { id: 6, name: "Product 6", prices: 4000, qty: 0, total: 0 }
]

const STATUS_OPTIONS = [
  { value: "booking", label: "Booking" },
  { value: "having", label: "Having" },
  { value: "done", label: "Done" }
]

const TABLE_OPTIONS = [
  { value: "table1", label: "Table 1" },
  { value: "table2", label: "Table 2" },
  { value: "table3", label: "Table 3" }
]

const EditPage = ({ params }: DetailPageProps) => {
  const [totalSale, setTotalSale] = React.useState(0)
  const [discount, setDiscount] = React.useState(0)
  const [products, setProducts] = React.useState<Product[]>([{ ...DEFAULT_PRODUCT }])

  const calculateTotal = React.useCallback(() => {
    const updatedProducts = products.map(product => ({
      ...product,
      total: product.prices * product.qty
    }))
    
    let total = updatedProducts.reduce((sum, item) => sum + item.total, 0)
    
    if (discount > 0 && discount <= total) {
      total -= discount
    }

    setTotalSale(total)
    return updatedProducts
  }, [products, discount])

  React.useEffect(() => {
    const updatedProducts = calculateTotal()
    // Only update products if totals changed to prevent unnecessary re-renders
    if (JSON.stringify(products) !== JSON.stringify(updatedProducts)) {
      setProducts(updatedProducts)
    }
  }, [calculateTotal])

  const addNewRow = () => {
    const newRowId = products[products.length - 1].row_id + 1
    setProducts(prev => [...prev, { ...DEFAULT_PRODUCT, row_id: newRowId }])
  }

  const updateProduct = (updatedProduct: Product) => {
    setProducts(prev => 
      prev.map(product => 
        product.row_id === updatedProduct.row_id ? updatedProduct : product
      )
    )
  }

  const deleteProduct = (productToDelete: Product) => {
    if (products.length === 1) {
      setProducts([{ ...DEFAULT_PRODUCT }])
      return
    }
    
    setProducts(prev => 
      prev
        .filter(p => p.row_id !== productToDelete.row_id)
        .map((p, index) => ({ ...p, row_id: index + 1 }))
    )
  }

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0
    setDiscount(Math.max(0, value))
  }

  return (
    <div className="mt-5 space-y-4">
      <h1 className="text-xl font-semibold">Edit Page</h1>

      <div className="space-y-4">
        <div className="flex flex-col gap-5">
          <div className="md:max-w-1/2">
            <Input type="text" placeholder="Name" />
          </div>
          
          <Select>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Table" />
            </SelectTrigger>
            <SelectContent>
              {TABLE_OPTIONS.map(table => (
                <SelectItem key={table.value} value={table.value}>
                  {table.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(status => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div>
            <Textarea className="md:max-w-1/2" placeholder="Description" />
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-4">
        <Button onClick={addNewRow}>Add new row</Button>
      </div>
     
      <div className="mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map(product => (
              <RowOfSale
                key={product.row_id}
                rownumber={product.row_id}
                product={product}
                sale_products={SALE_PRODUCTS}
                onChangeHandler={updateProduct}
                onQtyUpdateHandler={updateProduct}
                onDeleteHandler={deleteProduct}
              />
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3}>Discount</TableCell>
              <TableCell>
                <Input 
                  className="w-30" 
                  type="number" 
                  min="0"
                  value={discount}
                  onChange={handleDiscountChange}
                />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={3}>Total</TableCell>
              <TableCell>{totalSale}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      <div className="flex justify-end gap-4 mt-10">
        <Button variant="outline">Cancel</Button>
        <Button>Save</Button>
      </div>
    </div>
  )
}

export default EditPage