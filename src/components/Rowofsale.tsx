"use client"
import React from "react";
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
import { cn } from "@/lib/utils"
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
import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button";
import { Input } from "./ui/input";
import { QuantityInput } from "./Quantity";
import { Trash2 } from "lucide-react"


type Product = {
    row_id: number;
    id: number;
    name: string;
    prices: number;
    qty: number;
    total: number;
}

type SaleProduct = {
    id: number;
    name: string;
    prices: number;
    qty: number;
    total: number;
}


type RowOfSsale = {
    product: Product;
    sale_products: SaleProduct[];
    rownumber: number;
    onChangeHandler: (product: Product) => void;
    onQtyUpdateHandler: (product: Product) => void;
    onDeleteHandler: (product: Product) => void;
}

export default function RowOfSsale({product, sale_products, onChangeHandler, onQtyUpdateHandler, onDeleteHandler, rownumber} : RowOfSsale){
    const [open, setOpen] = React.useState(false)
    const [local_product, setLocalProduct] = React.useState(product);

    return (
        <TableRow key={product.id}>
            <TableCell>
                <Popover  open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[200px] justify-between"
                    >
                    {product.name
                        ? sale_products.find((sale_product) => sale_product.id === product.id)?.name
                        : "Select products..."}
                    <ChevronsUpDown className="opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] h-[200px] p-0">
                    <Command>
                    {/* <CommandInput placeholder="Search Product..." className="h-9" /> */}
                    <CommandList>
                        <CommandEmpty>No Product found.</CommandEmpty>
                        <CommandGroup>
                        {sale_products.map((sale_product) => (
                            <CommandItem
                            key={sale_product.id}
                            value={sale_product.name}
                            onSelect={(currentValue) => {
                                const p = {...sale_product, row_id: rownumber}
                                onChangeHandler(p);
                                setOpen(false)
                            }}
                            >
                            {sale_product.name}
                            <Check
                                className={cn(
                                "ml-auto",
                                product.name === sale_product.name ? "opacity-100" : "opacity-0"
                                )}
                            />
                            </CommandItem>
                        ))}
                        </CommandGroup>
                    </CommandList>
                    </Command>
                </PopoverContent>
                </Popover>
                </TableCell>
            <TableCell>{product.prices}</TableCell>
            <TableCell><QuantityInput value={product.qty} min={0} max={100} onChange={(value)=> {
                product.qty = value
                onQtyUpdateHandler(product)
            } }/></TableCell>
            <TableCell>
                {product.total}
                <Button className="ml-3 mt-3 bg-red-500 text-white hover:bg-red-300" 
                onClick={() => onDeleteHandler(product)}
                >
                    <Trash2 />
                </Button>
            </TableCell>
        </TableRow>
    )
}