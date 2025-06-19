"use client";

import Link from "next/link";
import { Moon, Sun, User as UserIcon, LogOut } from "lucide-react"
import { useTheme } from "next-themes"
import { useRouter, usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { getCurrentUser, clearAuthData, isAuthenticated } from "@/lib/auth"
import type { User } from '@/lib/auth'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const { setTheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  
  useEffect(() => {
    const currentUser = getCurrentUser()
    const authenticated = isAuthenticated()
    
    setUser(currentUser)
    setIsLoggedIn(authenticated)
  }, [])

  const handleLogout = () => {
    clearAuthData()
    setUser(null)
    setIsLoggedIn(false)
    router.push('/auth')
  }

  // Hide navbar on auth page - this must come after all hooks
  if (pathname === "/auth") {
    return null
  }
  
  return (
    <nav className="shadow-sm dark:border-2 w-full z-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          
          <h1
            className="dark:text-white cursor-pointer select-none"
            onClick={() => router.push("/")}
            title="Go to Home"
          >
            လေထန်ကုန်း
          </h1>

          <div className="flex gap-x-3">
             <div>
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTheme("light")}>
                    အလင်း
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")}>
                    အမှောင်
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")}>
                    စနစ်အရောင်
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </div>

              <div>
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <UserIcon />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isLoggedIn ? (
                    <>
                      <DropdownMenuItem disabled className="font-semibold">
                        {user?.name} ({user?.role})
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push("/users")}>
                        အသုံးပြုသူများ
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                        <LogOut className="h-4 w-4 mr-2" />
                        ထွက်ရန်
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem onClick={() => router.push("/auth")}>
                      ဝင်ရောက်ရန်
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

        

        </div>
      </div>

     
    </nav>
  );
}
