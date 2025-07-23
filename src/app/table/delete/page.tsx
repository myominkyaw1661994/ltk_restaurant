'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from "sonner";

interface Table {
  id: string;
  name: string;
  status: 'available' | 'occupied' | 'reserved';
}

export default function DeleteTablePage() {
  const router = useRouter();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingTableId, setDeletingTableId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<Table | null>(null);

  // Fetch tables on component mount
  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/table');
      const data = await response.json();
      
      if (data.success) {
        setTables(data.tables);
      } else {
        toast.error('Failed to fetch tables');
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
      toast.error('Failed to fetch tables');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (table: Table) => {
    setTableToDelete(table);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!tableToDelete) return;

    try {
      setDeletingTableId(tableToDelete.id);
      const response = await fetch(`/api/v1/table?id=${tableToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Table deleted successfully');
        // Remove the deleted table from the list
        setTables(tables.filter(table => table.id !== tableToDelete.id));
      } else {
        toast.error(data.error || 'Failed to delete table');
      }
    } catch (error) {
      console.error('Error deleting table:', error);
      toast.error('Failed to delete table');
    } finally {
      setDeletingTableId(null);
      setShowDeleteDialog(false);
      setTableToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
    setTableToDelete(null);
    setDeletingTableId(null);
  };

  const getStatusColor = (status: string) => {
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

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading tables...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Delete Tables
        </h1>
        <p className="text-gray-600">
          Select a table to delete. This action cannot be undone.
        </p>
      </div>

      {tables.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500 mb-4">No tables found</p>
            <Button onClick={() => router.push('/table/new')}>
              Create First Table
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.map((table) => (
            <Card key={table.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{table.name}</span>
                  <Badge
                    variant="outline"
                    className={`${getStatusColor(table.status)} font-medium`}
                  >
                    {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/table')}
                    className="flex-1"
                  >
                    View
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteClick(table)}
                    disabled={deletingTableId === table.id}
                    className="flex-1"
                  >
                    {deletingTableId === table.id ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the table "{tableToDelete?.name}". 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Table
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Navigation Buttons */}
      <div className="mt-8 flex gap-4 justify-center">
        <Button
          variant="outline"
          onClick={() => router.push('/table')}
        >
          Back to Tables
        </Button>
        <Button
          onClick={() => router.push('/table/new')}
        >
          Create New Table
        </Button>
      </div>
    </div>
  );
}