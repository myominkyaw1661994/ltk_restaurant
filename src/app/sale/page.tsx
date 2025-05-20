
 
import * as React from "react"
import {LTKTable} from '../../components/Table'


import { Payment, columns } from "./columns"
import { DataTable } from "./data-table"
import { DataTableDemo } from "@/components/LTKTable"

async function getData(): Promise<Payment[]> {
  // Fetch data from your API here.
  return [
    {
      id: "728ed52f",
      amount: 100,
      status: "pending",
      email: "m@example.com",
    },

    {
      id: "23344",
      amount: 100,
      status: "pending",
      email: "m@example.com",
    },
    // ...
  ]
}
  

export default async function Home() {

const data = await getData()

    const invoices = [
  {
    invoice: "INV001",
    paymentStatus: "Paid",
    totalAmount: "$250.00",
    paymentMethod: "Credit Card",
  },
  {
    invoice: "INV002",
    paymentStatus: "Pending",
    totalAmount: "$150.00",
    paymentMethod: "PayPal",
  },
  {
    invoice: "INV003",
    paymentStatus: "Unpaid",
    totalAmount: "$350.00",
    paymentMethod: "Bank Transfer",
  },
  {
    invoice: "INV004",
    paymentStatus: "Paid",
    totalAmount: "$450.00",
    paymentMethod: "Credit Card",
  },
  {
    invoice: "INV005",
    paymentStatus: "Paid",
    totalAmount: "$550.00",
    paymentMethod: "PayPal",
  },
  {
    invoice: "INV006",
    paymentStatus: "Pending",
    totalAmount: "$200.00",
    paymentMethod: "Bank Transfer",
  },
  {
    invoice: "INV007",
    paymentStatus: "Unpaid",
    totalAmount: "$300.00",
    paymentMethod: "Credit Card",
  },
]

const header = [
  "စဉ်",
  "အခြေအနေ",
  "အကြောင်းအရာ",
  "စုပေါင်း"
]


  return (
    <div className="mt-4">

      {/* <LTKTable data={invoices} header={header}/> */}
      <DataTable columns={columns} data={data} />
      {/* <DataTableDemo /> */}
     
    </div>
  );
}
