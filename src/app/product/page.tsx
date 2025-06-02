'use client'
 
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Product {
  id: string;
  product_name: string;
  price: number;
  created_at: string;
  type: 'sale' | 'purchase';
}

interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'all' | 'sale' | 'purchase'>('all');
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  });
  const router = useRouter();

  const pageSizeOptions = [3, 6, 9, 12];

  const fetchProducts = async (page: number, pageSize: number) => {
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      
      const response = await fetch(`/api/v1/product?page=${page}&pageSize=${pageSize}&type=${selectedType}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch products');
      }

      const data = await response.json();
      
      if (!data.products || !Array.isArray(data.products)) {
        throw new Error('Invalid response format from server');
      }

      setProducts(data.products);
      setPagination({
        currentPage: page,
        pageSize: pageSize,
        totalItems: data.pagination.totalItems,
        totalPages: data.pagination.totalPages,
        hasNextPage: data.pagination.hasNextPage,
        hasPreviousPage: data.pagination.hasPreviousPage
      });
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err.message || 'Failed to fetch products');
      setProducts([]); // Clear products on error
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (type: 'all' | 'sale' | 'purchase') => {
    setSelectedType(type);
    setPagination(prev => ({
      ...prev,
      currentPage: 1
    }));
    fetchProducts(1, pagination.pageSize);
  };

  const handlePageSizeChange = (newSize: number) => {
    const newPageSize = Number(newSize);
    setPagination(prev => ({
      ...prev,
      pageSize: newPageSize,
      currentPage: 1
    }));
    fetchProducts(1, newPageSize);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({
        ...prev,
        currentPage: newPage
      }));
      fetchProducts(newPage, pagination.pageSize);
    }
  };

  const handlePageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1 && value <= pagination.totalPages) {
      setPagination(prev => ({
        ...prev,
        currentPage: value
      }));
      fetchProducts(value, pagination.pageSize);
    }
  };

  // Initial load
  useEffect(() => {
    fetchProducts(1, pagination.pageSize);
  }, []); // Only run on mount

  // Handle type changes
  useEffect(() => {
    if (pagination.currentPage === 1) {
      fetchProducts(1, pagination.pageSize);
    }
  }, [selectedType]); // Run when type changes

  // Handle pagination changes
  useEffect(() => {
    if (pagination.currentPage > 1) {
      fetchProducts(pagination.currentPage, pagination.pageSize);
    }
  }, [pagination.currentPage, pagination.pageSize]); // Run when pagination changes

  const handleDeleteClick = (productId: string) => {
    setProductToDelete(productId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/v1/product/${productToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete product');
      }

      // Refresh the product list
      fetchProducts(pagination.currentPage, pagination.pageSize);
    } catch (err: any) {
      setError(err.message || 'Failed to delete product');
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
    }
    
  if (error && products.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link 
          href="/product/new" 
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add New Product
        </Link>
      </div>

      {/* Type Filter */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => handleTypeChange('all')}
          className={`px-4 py-2 rounded ${
            selectedType === 'all' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All Products
        </button>
        <button
          onClick={() => handleTypeChange('sale')}
          className={`px-4 py-2 rounded ${
            selectedType === 'sale' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Sale Products
        </button>
        <button
          onClick={() => handleTypeChange('purchase')}
          className={`px-4 py-2 rounded ${
            selectedType === 'purchase' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Purchase Products
        </button>
      </div>

      {products.length === 0 ? (
        <div className="text-center text-gray-500">No products found</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <div 
                key={product.id} 
                className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <h2 className="text-xl font-semibold mb-2">{product.product_name}</h2>
                <p className="text-gray-600">Price: ${product.price}</p>
                <p className="text-gray-600">Type: {product.type === 'sale' ? 'For Sale' : 'For Purchase'}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Created: {new Date(product.created_at).toLocaleDateString()}
                </p>
                <div className="mt-4 flex justify-end space-x-2">
                  <Link
                    href={`/product/edit/${product.id}`}
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDeleteClick(product.id)}
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="mt-8 space-y-4">
            {/* Page Size Selector */}
            <div className="flex justify-center items-center space-x-2">
              <span className="text-sm text-gray-600">Show</span>
              <select
                value={pagination.pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="border rounded px-2 py-1 text-sm"
              >
                {pageSizeOptions.map(size => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <span className="text-sm text-gray-600">items per page</span>
            </div>

            {/* Pagination Navigation */}
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPreviousPage || loading}
                  className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 text-sm"
                >
                  Previous
                </button>
                
                <div className="flex items-center space-x-1">
                  <span className="text-sm text-gray-600">Page</span>
                  <input
                    type="number"
                    min="1"
                    max={pagination.totalPages}
                    value={pagination.currentPage}
                    onChange={handlePageInput}
                    className="w-12 px-1 py-1 border rounded text-center text-sm"
                  />
                  <span className="text-sm text-gray-600">of {pagination.totalPages}</span>
                </div>
                
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage || loading}
                  className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 text-sm"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {loading && products.length > 0 && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            </div>
          )}
        </>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
