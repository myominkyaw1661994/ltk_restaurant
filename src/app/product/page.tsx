'use client'
 
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCurrentUser, hasRole } from '@/lib/auth';
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
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";

interface Product {
  id: string;
  product_name: string;
  price: number;
  category: string;
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

type SortField = 'product_name' | 'category' | 'price';
type SortDirection = 'asc' | 'desc';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'all' | 'sale' | 'purchase'>('all');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortField, setSortField] = useState<SortField>('product_name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
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

  // Check if user can perform admin actions (not staff)
  const canPerformAdminActions = () => {
    return currentUser && currentUser.role !== 'Staff';
  };

  // Sort products based on current sort field and direction
  const sortedProducts = [...products].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortField) {
      case 'product_name':
        aValue = a.product_name.toLowerCase();
        bValue = b.product_name.toLowerCase();
        break;
      case 'category':
        aValue = a.category.toLowerCase();
        bValue = b.category.toLowerCase();
        break;
      case 'price':
        aValue = a.price;
        bValue = b.price;
        break;
      default:
        aValue = a.product_name.toLowerCase();
        bValue = b.product_name.toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return null;
    }
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

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
    // Get current user on component mount
    const user = getCurrentUser();
    setCurrentUser(user);
    
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
        <div className="flex items-center gap-4">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Grid</span>
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                viewMode === 'table' ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white dark:bg-black transition-transform ${
                  viewMode === 'table' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm text-gray-600">Table</span>
          </div>
          
          {canPerformAdminActions() && (
            <Link 
              href="/product/new" 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Add New Product
            </Link>
          )}
        </div>
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
          {viewMode === 'grid' ? (
            // Grid View
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedProducts.map((product) => (
                <div 
                  key={product.id} 
                  className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <h2 className="text-xl font-semibold mb-2">{product.product_name}</h2>
                  <p className="text-gray-600">Price: {product.price}MMK</p>
                  <p className="text-gray-600">Type: {product.type === 'sale' ? 'For Sale' : 'For Purchase'}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Created: {new Date(product.created_at).toLocaleDateString()}
                  </p>
                  {canPerformAdminActions() && (
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
                  )}
                </div>
              ))}
            </div>
          ) : (
            // Table View
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white dark:bg-black dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                <thead className="dark:bg-black dark:text-white">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('product_name')}
                    >
                      <div className="flex items-center gap-1">
                        Product Name
                        {getSortIcon('product_name')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('category')}
                    >
                      <div className="flex items-center gap-1">
                        Category
                        {getSortIcon('category')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('price')}
                    >
                      <div className="flex items-center gap-1">
                        Price
                        {getSortIcon('price')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">
                      Created
                    </th>
                    {canPerformAdminActions() && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-black dark:text-white divide-y divide-gray-200">
                  {sortedProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-900 dark:border-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {product.product_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-white">
                        {product.category}
                      </td>
                                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-white">
                         {product.price.toLocaleString()} MMK
                       </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-white">
                        {product.type === 'sale' ? 'For Sale' : 'For Purchase'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-white">
                        {new Date(product.created_at).toLocaleDateString()}
                      </td>
                      {canPerformAdminActions() && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-white">
                          <div className="flex space-x-2">
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
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

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
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white dark:border-gray-700"></div>
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
