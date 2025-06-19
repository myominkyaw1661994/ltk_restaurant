"use client";

import Link from "next/link";
import { Moon, Sun, User as UserIcon, LogOut, Package, ShoppingCart, Users, BarChart3 } from "lucide-react"
import { useTheme } from "next-themes"
import { useRouter, usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { getCurrentUser, clearAuthData, isAuthenticated, getUserRole } from "@/lib/auth"
import type { User } from '@/lib/auth'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const { setTheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState<string>('')
  
  // Function to update auth state
  const updateAuthState = () => {
    const currentUser = getCurrentUser()
    const authenticated = isAuthenticated()
    const role = getUserRole()
    
    setUser(currentUser)
    setIsLoggedIn(authenticated)
    setUserRole(role)
  }

  useEffect(() => {
    // Initial auth state check
    updateAuthState()

    // Listen for storage changes (when login/logout happens)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token' || e.key === 'auth_user') {
        updateAuthState()
      }
    }

    // Listen for custom auth events
    const handleAuthChange = () => {
      updateAuthState()
    }

    // Add event listeners
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('authStateChanged', handleAuthChange)

    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('authStateChanged', handleAuthChange)
    }
  }, [])

  // Also update on pathname change (in case user navigates after login)
  useEffect(() => {
    updateAuthState()
  }, [pathname])

  const handleLogout = () => {
    clearAuthData()
    setUser(null)
    setIsLoggedIn(false)
    setUserRole('')
    
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

          {/* Navigation Links - Only show for authenticated users */}
          {isLoggedIn && (userRole === 'staff' || userRole === 'admin') && (
            <div className="hidden md:flex items-center space-x-4">
              <Link
                href="/product"
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Package className="h-4 w-4" />
                <span>Products</span>
              </Link>
              
              <Link
                href="/sale"
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ShoppingCart className="h-4 w-4" />
                <span>Sales</span>
              </Link>
              
              <Link
                href="/purchase"
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <BarChart3 className="h-4 w-4" />
                <span>Purchases</span>
              </Link>
              
              <Link
                href="/pos"
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <BarChart3 className="h-4 w-4" />
                <span>POS</span>
              </Link>
            </div>
          )}

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
                      
                      {/* Navigation items for staff/admin */}
                      {(userRole === 'staff' || userRole === 'admin') && (
                        <>
                          <DropdownMenuItem onClick={() => router.push("/product")}>
                            <Package className="h-4 w-4 mr-2" />
                            Products
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push("/sale")}>
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Sales
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push("/purchase")}>
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Purchases
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push("/pos")}>
                            <BarChart3 className="h-4 w-4 mr-2" />
                            POS
                          </DropdownMenuItem>
                        </>
                      )}
                      
                      {/* User management - only for admin */}
                      {userRole === 'admin' && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => router.push("/users")}>
                            <Users className="h-4 w-4 mr-2" />
                            User Management
                          </DropdownMenuItem>
                        </>
                      )}
                      
                      <DropdownMenuSeparator />
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
