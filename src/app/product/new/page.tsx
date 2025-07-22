'use client'

import { Input } from '@/components/ui/input';
import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function Contact() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({ 
    product_name: '', 
    price: '', 
    type: 'sale',
    category: 'food' // Default category
  });
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

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
    // Check user role first
    const user = getCurrentUser();
    setCurrentUser(user);
    
    // Redirect staff users
    if (user && user.role === 'Staff') {
      toast.error("You don't have permission to create products.");
      router.push('/product');
      return;
    }
  }, [router]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleTypeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, type: value }));
  };

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value }));
  };

  const validateForm = () => {
    if (typeof formData.product_name !== 'string' || formData.product_name.trim() === '') {
      setError('Product name must be a valid string');
      return false;
    }

    const price = parseInt(formData.price);
    if (isNaN(price) || !Number.isInteger(price)) {
      setError('Price must be a valid integer');
      return false;
    }

    if (!['sale', 'purchase'].includes(formData.type)) {
      setError('Please select a valid product type');
      return false;
    }

    if (!formData.category) {
      setError('Please select a category');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch('/api/v1/product', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            product_name: formData.product_name,
            price: parseInt(formData.price),
            type: formData.type,
            category: formData.category
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create product');
        }

        // Clear form after successful submission
        setFormData({ product_name: '', price: '', type: 'sale', category: 'food' });
        
        toast.success('Product created successfully!');
        // Redirect to products page
        router.push('/product');
      } catch (err: any) {
        setError(err.message || 'Failed to create product. Please try again.');
        toast.error('Failed to create product');
        console.error('Error:', err);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Add New Product</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block mb-1 font-medium">Product Name</label>
        <Input
          name="product_name"
          value={formData.product_name}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
          disabled={isPending}
          placeholder="Enter product name"
        />
      </div>

      <div>
        <label htmlFor="type" className="block mb-1 font-medium">Product Type</label>
        <Select
          value={formData.type}
          onValueChange={handleTypeChange}
          disabled={isPending}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select product type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sale">For Sale</SelectItem>
            <SelectItem value="purchase">For Purchase</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label htmlFor="category" className="block mb-1 font-medium">Category</label>
        <Select
          value={formData.category}
          onValueChange={handleCategoryChange}
          disabled={isPending}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select category" />
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

      <div>
        <label htmlFor="price" className="block mb-1 font-medium">Price</label>
        <Input
          name="price"
          type="number"
          value={formData.price}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
      </div>

      <button 
        type="submit" 
        className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
        disabled={isPending}
      >
        {isPending ? 'Creating Product...' : 'Create Product'}
      </button>
    </form>
  );
}
