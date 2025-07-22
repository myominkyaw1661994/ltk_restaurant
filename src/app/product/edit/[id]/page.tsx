'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Product {
  id: string;
  product_name: string;
  price: number;
  category: string;
  type: 'sale' | 'purchase';
  created_at: string;
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ProductEdit({ params }: PageProps) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    product_name: '',
    price: '',
    category: 'food',
    type: 'sale' as 'sale' | 'purchase'
  });
  const [productId, setProductId] = useState<string>('');

  // Category options
  const categories = [
    { value: 'food', label: 'Food' },
    { value: 'beverage', label: 'Beverage' },
    { value: 'dessert', label: 'Dessert' },
    { value: 'appetizer', label: 'Appetizer' },
    { value: 'main-course', label: 'Main Course' },
    { value: 'side-dish', label: 'Side Dish' },
    { value: 'snack', label: 'Snack' },
    { value: 'ingredient', label: 'Ingredient' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    // Initialize params
    const initParams = async () => {
      const resolvedParams = await params;
      setProductId(resolvedParams.id);
    };
    initParams();
  }, [params]);

  useEffect(() => {
    if (!productId) return;

    // Check user role first
    const user = getCurrentUser();
    setCurrentUser(user);
    
    // Redirect staff users
    if (user && user.role === 'Staff') {
      toast.error("You don't have permission to edit products.");
      router.push('/product');
      return;
    }

    const fetchProduct = async () => {
      if (!productId) {
        console.error('No product ID provided');
        return;
      }
      
      try {
        setLoading(true);
        console.log('Fetching product with ID:', productId);
        const response = await fetch(`/api/v1/product/${productId}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch product');
        }

        console.log('Product data received:', data);
        setProduct(data.product);
        setFormData({
          product_name: data.product.product_name,
          price: data.product.price.toString(),
          category: data.product.category || 'food',
          type: data.product.type || 'sale'
        });
      } catch (err: any) {
        console.error('Error fetching product:', err);
        setError(err.message || 'Failed to fetch product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/v1/product/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_name: formData.product_name,
          price: parseInt(formData.price),
          category: formData.category,
          type: formData.type
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update product');
      }

      toast.success('Product updated successfully!');
      router.push('/product');
    } catch (err: any) {
      console.error('Error updating product:', err);
      setError(err.message || 'Failed to update product');
      toast.error('Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Edit Product</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="product_name" className="text-sm font-medium">
                Product Name
              </label>
              <Input
                id="product_name"
                value={formData.product_name}
                onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                required
                placeholder="Enter product name"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="price" className="text-sm font-medium">
                Price
              </label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                min="0"
                placeholder="Enter price"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium">
                Category
              </label>
              <Select onValueChange={(value) => setFormData({ ...formData, category: value })} value={formData.category} defaultValue="food">
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="type" className="text-sm font-medium">
                Type
              </label>
              <Select onValueChange={(value) => setFormData({ ...formData, type: value as 'sale' | 'purchase' })} value={formData.type} defaultValue="sale">
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale">Sale</SelectItem>
                  <SelectItem value="purchase">Purchase</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/product')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}