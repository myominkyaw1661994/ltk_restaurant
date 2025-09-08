"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function FloatingMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  return (
    <div className="fixed bottom-6 right-6 z-50">
     
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-300 dark:bg-gray-700 dark:text-white p-4 rounded-full shadow-lg hover:bg-gray-500 transition float-right"
      >
        {isOpen ? <X size={24} /> : <Plus size={24} />}
      </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="m-5" onClick={() => router.push("/sale")}>
              အရောင်း စာရင်း
            </DropdownMenuItem>
            <DropdownMenuItem className="m-5" onClick={() => router.push("/purchase")}>
              အဝယ် စာရင်း
            </DropdownMenuItem>
            <DropdownMenuItem className="m-5" onClick={() => router.push("/product")}>
              ပစ္စည်း
            </DropdownMenuItem>
            <DropdownMenuItem className="m-5" onClick={() => router.push("/")}>
              ပင်မ စာရင်း
            </DropdownMenuItem>
            <DropdownMenuItem className="m-5" onClick={() => router.push("/pos")}>
              POS
            </DropdownMenuItem>
            <DropdownMenuItem className="m-5" onClick={() => router.push("/table")}>
              စားပွဲ
            </DropdownMenuItem>
            <DropdownMenuItem className="m-5" onClick={() => router.push("/staff")}>
              ဝန်ထမ်
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
    </div>
  );
}
