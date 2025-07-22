"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from '@/lib/auth';
import { DataTable } from "./data-table";
import { columns, User } from "./columns";
import { getWithAuth } from "@/lib/fetch-with-auth";
import { toast } from "sonner";

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Check user role first
    const user = getCurrentUser();
    setCurrentUser(user);
    
    // Redirect staff users
    if (user && user.role === 'Staff') {
      toast.error("You don't have permission to access user management.");
      router.push('/');
      return;
    }

    fetchUsers();
  }, [router]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getWithAuth<{success: boolean; data?: any[]; error?: string}>('/api/v1/users');
      
      if (data.success && data.data) {
        // Transform API data to match table format
        const transformedUsers: User[] = data.data.map((user: any) => ({
          id: user.id, // Keep as string - Firestore document ID
          name: user.name,
          email: user.email,
          password: "********",
          role: user.role,
          created_at: user.created_at,
          updated_at: user.updated_at,
        }));
        setUsers(transformedUsers);
      } else {
        setError(data.error || 'အသုံးပြုသူများကို ရယူရာတွင် အမှားရှိနေသည်');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('အသုံးပြုသူများကို ရယူရာတွင် အမှားရှိနေသည်');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">ဖွင့်နေသည်...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">အသုံးပြုသူများ</h1>
          <Button 
            onClick={() => router.push("/users/new")}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            အသုံးပြုသူ အသစ်ထည့်ရန်
          </Button>
        </div>
        
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchUsers} variant="outline">
            ပြန်လည်ကြိုးစားရန်
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">အသုံးပြုသူများ</h1>
        <Button 
          onClick={() => router.push("/users/new")}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          အသုံးပြုသူ အသစ်ထည့်ရန်
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={users}
        pageCount={Math.ceil(users.length / 10)}
        pageIndex={0}
        pageSize={10}
      />
    </div>
  );
}