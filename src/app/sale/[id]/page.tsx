import React from "react";

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



const products = [
  {
    id : '3fsd',
    name: "ကြက်ကာလသား",
    price: 1000,
    qty: 10,
    amount: 10000,
  },
  {
    id : '3fssd',
    name: "လက်ဖက်သုတ်",
    price: 2000,
    qty: 3,
    amount: 6000,
  },
]
 

interface DetailPageProps {
  params: { id: string };
}

const DetailPage = ({ params }: DetailPageProps) => {
  const { id } = params;

  return (
    <div className="mt-5">
      <h1 className="text-xl font-semibold">Detail Page</h1>

      <div className="mt-5 md:max-w-1/2">
        <Card>
            <CardHeader>
              <p className="font-semibold">Detail</p>
            </CardHeader>
            <Separator />
            <CardContent>
              <div className="flex gap-30">
                 <div className="flex items-start flex-col gap-y-3">
                  <div>Id</div>
                  <div>Name</div>
                  <div>Table</div>
                  <div>Sale Person</div>
                </div>

                <div className="flex flex-col gap-y-3">
                    <div>MCK33</div>
                    <div>Hickeing</div>
                    <div>Table-3</div>
                    <div>Kyaw Kyaw</div>
                </div>
              </div>
              
            </CardContent>
            
        </Card>
      </div>
     
      
      <div className="mt-10">
        

        <Table>
          <TableCaption>A list of your recent sales.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.price}</TableCell>
                <TableCell>{product.qty}</TableCell>
                <TableCell>{product.amount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3}>Total</TableCell>
              <TableCell>2,500</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
       
      </div>

      
    </div>
  );
};

export default DetailPage;