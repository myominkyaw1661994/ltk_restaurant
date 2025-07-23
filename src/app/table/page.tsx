"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";


// const ModalContent = dynamic(() => import('@/app/pos/page'), { ssr: false });


interface Table {
  id: number;
  name: string;
  status: TableStatus;
  sale_id: string;
  sale: object;
}

interface Product {
    id: string;
    product_name: string;
    price: number;
    category: string;
    created_at: string;
    type: 'sale' | 'purchase';
  }

// Sample table data
// const initialTables: Table[] = [
//   { id: 1, name: "Table 1", status: "available", sale_id: "", sale: {} },
//   { id: 2, name: "Table 2",  status: "occupied", sale_id: "", sale: {} },
//   { id: 3, name: "Table 3", status: "available", sale_id: "", sale: {} },
//   { id: 4, name: "Table 4", status: "reserved", sale_id: "", sale: {} },
//   { id: 5, name: "Table 5", status: "available", sale_id: "", sale: {} },
//   { id: 6, name: "Table 6", status: "occupied", sale_id: "", sale: {} },
//   { id: 7, name: "Table 7", status: "available", sale_id: "", sale: {} },
//   { id: 8, name: "Table 8", status: "reserved", sale_id: "", sale: {} },
//   { id: 9, name: "Table 9", status: "available", sale_id: "", sale: {} },
//   { id: 10, name: "Table 10", status: "available", sale_id: "", sale: {} },
// ];

type TableStatus = "available" | "occupied" | "reserved";


const getStatusColor = (status: TableStatus) => {
  switch (status) {
    case "available":
      return "bg-green-100 text-green-800 border-green-200";
    case "occupied":
      return "bg-red-100 text-red-800 border-red-200";
    case "reserved":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export default function TableViewPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [saleProducts, setSaleProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");

  // Fetch products (simulate API call)
  useEffect(() => {
    // Simulate fetching products
    const fetchProducts = async () => { 
      const prodRes = await fetch(`/api/v1/product?page=1&pageSize=1000&type=sale`)
      const data = await prodRes.json();
      setProducts(data.products);
    }


    const fetchTables = async () => {
      const tablesRes = await fetch(`/api/v1/table`)
      const data = await tablesRes.json();
      setTables(data.tables);
    }

    fetchTables();
    fetchProducts();
  }, []);

  // When modal opens, load sale products for the selected table
  // useEffect(() => {
  //   if (selectedTable) {
  //     setSaleProducts(Array.isArray(selectedTable.sale.products) ? selectedTable.sale.products : []);
  //   }
  // }, [selectedTable]);

  const handleTableClick = (table: Table) => {
    setSelectedTable(table);
    setIsModalOpen(true);
  };

  const handleStatusChange = (newStatus: TableStatus) => {
    if (selectedTable) {
      setSelectedTable({ ...selectedTable, status: newStatus });
    }
  };

  const handleSaveChanges = () => {
    if (selectedTable) {
      setTables(
        tables.map((table) =>
          table.id === selectedTable.id ? { ...selectedTable, sale: { ...selectedTable.sale, products: saleProducts } } : table
        )
      );
      closeModal();
    }
  };

  const handleAddProduct = () => {
    if (!selectedProductId) return;
    const product = products.find((p) => p.id === selectedProductId);
    if (product && !saleProducts.some((p) => p.id === product.id)) {
      setSaleProducts([...saleProducts, product]);
    }
    setSelectedProductId("");
  };

  const handleRemoveProduct = (productId: string) => {
    setSaleProducts(saleProducts.filter((p) => p.id !== productId));
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTable(null);
    setSaleProducts([]);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Restaurant Tables
        </h1>
        <p className="text-gray-600">Click on any table to view details</p>
      </div>

      {/* Legend */}
      <div className="mb-6 flex gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
          <span className="text-sm text-gray-600">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
          <span className="text-sm text-gray-600">Occupied</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded"></div>
          <span className="text-sm text-gray-600">Reserved</span>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {tables.map((table: Table) => (
          <Card
            key={table.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${
              table.status === "available" ? "hover:border-green-300" : ""
            }`}
            onClick={() => handleTableClick(table)}
          >
            <CardContent className="p-4 text-center">
              <div className="mb-3">
                <h3 className="text-lg font-semibold">{table.name}</h3>
              </div>
              <Badge
                variant="outline"
                className={`${getStatusColor(table.status)} font-medium`}
              >
                {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogContent className="w-[80vw] max-w-screen-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedTable ? selectedTable.name : "Table Details"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 max-h-[80vh] overflow-y-auto">
            {selectedTable && (
              <div className="space-y-4">
                {/* Status Dropdown */}
                <div className="flex items-center gap-4">
                  <p>
                    <strong>Status:</strong>
                  </p>
                  <Select
                    value={selectedTable.status}
                    onValueChange={(value: TableStatus) =>
                      handleStatusChange(value)
                    }
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="occupied">Occupied</SelectItem>
                      <SelectItem value="reserved">Reserved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Add Product to Sale */}
                <div>
                  <label className="block mb-1 font-medium">Add Product to Table</label>
                  <div className="flex gap-2">
                    <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.product_name} - {product.price.toLocaleString()} MMK
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" onClick={handleAddProduct} disabled={!selectedProductId}>
                      Add
                    </Button>
                  </div>
                </div>


                {/* Sale Products List */}
                {saleProducts.length > 0 && (
                  <div>
                    <div className="font-medium mb-1">Current Products:</div>
                    <ul className="list-disc pl-5 space-y-1">
                      {saleProducts.map((product) => (
                        <li key={product.id} className="flex items-center gap-2">
                          <span>{product.product_name} - {product.price.toLocaleString()} MMK</span>
                          <Button size="sm" variant="destructive" onClick={() => handleRemoveProduct(product.id)}>
                            Remove
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}


                {/* Go to POS Button */}
                <div className="flex justify-between pt-4 gap-2">
                  <Button variant="secondary" onClick={() => window.location.href = `/pos?table=${selectedTable.name}`}>Go to POS</Button>
                  <Button onClick={handleSaveChanges}>Save Changes</Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}