'use client'

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { toast } from "sonner";

export default function NewTablePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({ 
    name: '', 
    status: 'available'
  });
  const [error, setError] = useState('');

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleStatusChange = (value: string) => {
    setFormData((prev) => ({ ...prev, status: value }));
    setError('');
  };

  const validateForm = () => {
    if (typeof formData.name !== 'string' || formData.name.trim() === '') {
      setError('Table name is required');
      return false;
    }

    if (formData.name.trim().length < 2) {
      setError('Table name must be at least 2 characters long');
      return false;
    }

    if (!['available', 'occupied', 'reserved'].includes(formData.status)) {
      setError('Please select a valid status');
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
        const response = await fetch('/api/v1/table', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name.trim(),
            status: formData.status
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create table');
        }

        // Clear form after successful submission
        setFormData({ name: '', status: 'available' });
        
        toast.success('Table created successfully!');
        // Redirect to tables page
        router.push('/table');
      } catch (err: any) {
        setError(err.message || 'Failed to create table. Please try again.');
        toast.error('Failed to create table');
        console.error('Error:', err);
      }
    });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Create New Table
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="name" className="block mb-2 font-medium text-sm">
                  Table Name
                </label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full"
                  required
                  disabled={isPending}
                  placeholder="Enter table name (e.g., Table 1, VIP 1)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Choose a unique name for the table
                </p>
              </div>

              <div>
                <label htmlFor="status" className="block mb-2 font-medium text-sm">
                  Initial Status
                </label>
                <Select
                  value={formData.status}
                  onValueChange={handleStatusChange}
                  disabled={isPending}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="reserved">Reserved</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Set the initial status for the table
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push('/table')}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={isPending}
                >
                  {isPending ? 'Creating Table...' : 'Create Table'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}