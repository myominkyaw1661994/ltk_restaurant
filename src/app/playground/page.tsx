"use client"
import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
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
import { Check, ChevronsUpDown } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea"


import RowOfSsale from "@/components/Rowofsale"

const sale_products = [
  {
    id: 1,
    name: "Product 1",
    prices: 1000,
    qty: 0,
    total: 0
  },
  {
    id: 2,
    name: "Product 2",
    prices: 2000,
    qty: 0,
    total: 0
  },
  {
    id: 3,
    name: "Product 3",
    prices: 3000,
    qty: 0,
    total: 0
  },
  {
    id: 4,
    name: "Product 4",
    prices: 4000,
    qty: 0,
    total: 0,
  },
  {
    id: 5,
    name: "Product 5",
    prices: 4000,
    qty: 0,
    total: 0,
  },
   {
    id: 6,
    name: "Product 6",
    prices: 4000,
    qty: 0,
    total: 0,
  }
]


type Product = {
  row_id: number;
  id: number;
  name: string;
  prices: number;
  qty: number;
  total: number;
}

interface DetailPageProps {
  params: { id: string };
}


const EditPage = ({ params }: DetailPageProps) => {
  // const { id } = params;
  // const [open, setOpen] = React.useState(false)
  // const [value, setValue] = React.useState("")

  const [totalSale, setTotalSale] = React.useState(0)
  const [discount, setDiscount] = React.useState(0)

  const [products, setProducts] = React.useState([
      {
        row_id: 1,
        id: 0,
        name: "",
        prices: 0,
        qty: 0,
        total: 0
      }
  ]);

  React.useEffect(() => {
    total_calculation();
  }, [products, discount]);

 
  const total_calculation = () => {
    products.map((product) => product.total = product.prices * product.qty);
    let total = products.reduce((sum, item) => sum + item.total, 0);
    if (discount && Number.isInteger(discount)) {
      if( discount > total) return;
      total = total - discount
    }

    setTotalSale(total);
  }

  const check = () => {
    const new_row_number = products[products.length-1]['row_id'] + 1;
   
    const newProduct = { row_id:new_row_number,   id: 0, name: "", prices : 0, qty: 0, total: 0};
    setProducts((prevProduct) => [...prevProduct, newProduct])
  }

  const onChangeProduct = (new_product:Product) => {
    setProducts((prevProduct) => 
      prevProduct.map(product => 
        product.row_id == new_product.row_id ? new_product : product
      )
    );
  }

  const onQtyUpdate = (product: Product) => {
    console.log(product);
    onChangeProduct(product)
  }

  const onDelete = (product: Product) => {
    if(products.length == 1){
      console.log("here")
      setProducts([
        {
          row_id: 1,
          id: 1,
          name: "",
          prices: 0,
          qty: 0,
          total: 0
        }
      ])

      return;
    }
    const updatedProducts = products.filter(p => p.row_id !== product.row_id)
    .map((p, index) => ({
      ...p,
      row_id: index + 1
    }));

    console.log(updatedProducts)
  
    setProducts(updatedProducts);
  }

  const applyDiscount = (amount: number) => {
    setDiscount(amount);
  }


  return (
    <div className="mt-5">
      <h1 className="text-xl font-semibold">Edit Page</h1>

      <div className="mt-5">
          <div className="flex flex-col gap-5">
            <div className="md:max-w-1/2">
              <Input type="name" placeholder="Name"/>
            </div>
            <div>
                <Select>
                    <SelectTrigger className="w-[300px]">
                        <SelectValue placeholder="Table" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="table1">Table 1</SelectItem>
                        <SelectItem value="table2">Table 2</SelectItem>
                        <SelectItem value="table3">Table 3</SelectItem>
                    </SelectContent>
                </Select>
            </div>

             <div>
                <Select>
                    <SelectTrigger className="w-[300px]" >
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="booking">Booking</SelectItem>
                        <SelectItem value="having">Having</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                </Select>

            </div>
            <div>
              <Textarea className="md:max-w-1/2" placeholder="Desciprtion"/>
            </div>
          </div> 
      </div>

      <div className="mt-4 float-right">
        <Button onClick={check} >Add new role</Button>
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
            {products.map((product) => <RowOfSsale 
              key={product.row_id} 
              rownumber={product.row_id}
              product={product} 
              sale_products={sale_products} 
              onChangeHandler={onChangeProduct}
              onQtyUpdateHandler={onQtyUpdate}
              onDeleteHandler={onDelete}
            />)}
          </TableBody>
          <TableFooter>
             <TableRow className="mt-5">
              <TableCell colSpan={3}>Discount</TableCell>
              <TableCell>
                <Input className="w-30" type="number" defaultValue={discount} onChange={(e) => applyDiscount(parseInt(e.target.value))}/>
              </TableCell>
            </TableRow>
            <TableRow className="mt-5">
              <TableCell colSpan={3}>Total</TableCell>
              <TableCell>{totalSale}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>

      </div>

      <div className="mt-10 flex justify-end gap-4 ">
        <Button>Cancel</Button>
        <Button>Save</Button>
      </div>
      
    </div>
  );
};

export default EditPage;