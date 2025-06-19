"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Edit, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from 'next/navigation';

export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: "အမည်",
  },
  {
    accessorKey: "email",
    header: "အီးမေးလ်",
  },
  {
    accessorKey: "role",
    header: "အခန်းကဏ္ဍ",
  },
  {
    accessorKey: "created_at",
    header: "ဖန်တီးသည့်ရက်စွဲ",
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"));
      return date.toLocaleDateString('my-MM');
    },
  },
  {
    accessorKey: "updated_at",
    header: "ပြင်ဆင်သည့်ရက်စွဲ",
    cell: ({ row }) => {
      const date = new Date(row.getValue("updated_at"));
      return date.toLocaleDateString('my-MM');
    },
  },
  {
    id: "actions",
    header: "လုပ်ဆောင်ချက်များ",
    cell: ({ row }) => {
      const user = row.original;
      const router = useRouter();
      
      const handleDelete = async () => {
        if (confirm('ဤအသုံးပြုသူကို ဖျက်ရန် သေချာပါသလား?')) {
          try {
            const response = await fetch(`/api/v1/users/${user.id}`, {
              method: 'DELETE',
            });
            
            const data = await response.json();
            
            if (data.success) {
              // Refresh the page to update the table
              window.location.reload();
            } else {
              alert('အသုံးပြုသူ ဖျက်ရာတွင် အမှားရှိနေသည်: ' + data.error);
            }
          } catch (error: any) {
            console.error('Error deleting user:', error);
            alert('အသုံးပြုသူ ဖျက်ရာတွင် အမှားရှိနေသည်: ' + error.message);
          }
        }
      };
        
      return (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/users/edit/${user.id}`)}
            className="flex items-center gap-1"
          >
            <Edit className="h-4 w-4" />
            ပြင်ဆင်ရန်
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            className="flex items-center gap-1"
          >
            <Trash2 className="h-4 w-4" />
            ဖျက်ရန်
          </Button>
        </div>
      )
    },
  }
] 