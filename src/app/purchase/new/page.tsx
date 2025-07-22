"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Search, Calculator, Package, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface PurchaseItem {
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  total: number;
}

interface Product {
  id: string;
  product_name: string;
  price: number;
}

export default function NewPurchasePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Form data
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<PurchaseItem[]>([
    { product_id: "", product_name: "", price: 0, quantity: 1, total: 0 }
  ]);

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const totalAmount = subtotal;

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    // Filter products based on search term
    const filtered = products?.filter(product =>
      product.product_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/v1/product?type=purchase");
      const data = await response.json();
      console.log(data);
      if (data.success) {
        setProducts(data.products);
        setFilteredProducts(data.products);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleItemChange = (idx: number, field: keyof PurchaseItem, value: any) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], [field]: value };
    
    // Auto-calculate total when price or quantity changes
    if (field === "price" || field === "quantity") {
      newItems[idx].total = newItems[idx].price * newItems[idx].quantity;
    }
    
    setItems(newItems);
  };

  const handleProductChange = (idx: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      const newItems = [...items];
      newItems[idx] = {
        ...newItems[idx],
        product_id: product.id,
        product_name: product.product_name,
        price: product.price,
        total: product.price * newItems[idx].quantity
      };
      setItems(newItems);
    }
  };

  const handleAddItem = () => {
    setItems([...items, { product_id: "", product_name: "", price: 0, quantity: 1, total: 0 }]);
  };

  const handleRemoveItem = (idx: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== idx));
    }
  };

  // Helper function to format numbers with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    // Validate form
    if (!name.trim()) {
      toast.error("Please enter a purchase name");
      setSaving(false);
      return;
    }

    if (items.some(item => !item.product_id)) {
      toast.error("Please select products for all items");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`/api/v1/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, items })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create purchase");
      
      toast.success("Purchase created successfully!");
      router.push("/purchase");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create purchase";
      toast.error(errorMessage);
      console.log(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  // Remove the error handling from render to prevent infinite re-renders

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">New Purchase</h1>
          <p className="text-gray-600 mt-1">Create a new purchase order</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/purchase")}>
          Back to Purchases
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Purchase Information
            </CardTitle>
            <CardDescription>Enter the basic details for this purchase</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Purchase Name *</label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Enter purchase name"
                  required
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Enter purchase description"
                  className="w-full"
                  required
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Purchase Items
            </CardTitle>
            <CardDescription>Add products to your purchase order</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Product Search */}
            {/* <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Search Products</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div> */}

            {/* Items List */}
            <div className="space-y-4">
              {items.map((item, idx) => (
                <div key={idx} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Item {idx + 1}</h4>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveItem(idx)}
                      disabled={items.length === 1}
                      className="flex items-center gap-1"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    {/* Product Selection */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Product *</label>
                      <select
                        className="w-full border rounded-md px-3 py-2 text-sm"
                        value={item.product_id}
                        onChange={e => handleProductChange(idx, e.target.value)}
                        required
                      >
                        <option value="">Select a product</option>
                        {filteredProducts?.map(product => (
                          <option key={product.id} value={product.id}>
                            {product.product_name} - ${formatNumber(product.price)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Price */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Price</label>
                      <div className="relative">
                        {/* <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" /> */}
                        <Input
                          type="number"
                          value={item.price}
                          min={0}
                          step={0.01}
                          onChange={e => handleItemChange(idx, "price", Number(e.target.value))}
                          className="pl-8"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    {/* Quantity */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Quantity</label>
                      <Input
                        type="number"
                        value={item.quantity}
                        min={1}
                        onChange={e => handleItemChange(idx, "quantity", Number(e.target.value))}
                        placeholder="1"
                      />
                    </div>
                  </div>

                  {/* Total Display */}
                  <div className="mt-3 flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total for this item:</span>
                    <Badge variant="secondary" className="text-lg font-bold">
                      ${formatNumber(item.total)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Item Button */}
            <Button
              type="button"
              onClick={handleAddItem}
              variant="outline"
              className="mt-4 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Another Item
            </Button>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Purchase Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Number of Items:</span>
                <span className="font-medium">{items.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">${formatNumber(subtotal)}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total Amount:</span>
                  <span className="text-2xl font-bold text-green-600">
                    ${formatNumber(totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="submit"
            disabled={saving}
            className="flex-1 py-3 sm:py-2"
            size="lg"
          >
            {saving ? "Creating Purchase..." : "Create Purchase"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/purchase")}
            className="flex-1 py-3 sm:py-2"
            size="lg"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
