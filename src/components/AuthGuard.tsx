'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated, getCurrentUser } from '@/lib/auth'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: string
}

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated()
      const user = getCurrentUser()

      if (!authenticated || !user) {
        console.log('User not authenticated, redirecting to login')
        router.push('/auth')
        return
      }

      if (requiredRole && user.role !== requiredRole) {
        console.log(`User role ${user.role} does not match required role ${requiredRole}`)
        router.push('/auth')
        return
      }

      setIsAuthorized(true)
      setIsLoading(false)
    }

    // Check immediately
    checkAuth()

    // Listen for auth state changes
    const handleAuthChange = () => {
      checkAuth()
    }

    window.addEventListener('authStateChanged', handleAuthChange)

    return () => {
      window.removeEventListener('authStateChanged', handleAuthChange)
    }
  }, [router, requiredRole])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}
