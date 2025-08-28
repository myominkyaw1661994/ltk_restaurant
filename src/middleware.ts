import { NextRequest, NextResponse } from 'next/server';
import { jwtUtils } from '@/lib/jwt';

// Protected routes that require authentication
const protectedRoutes = [
  '/users',
  '/product',
  '/sale',
  '/purchase',
  '/pos'
];

// API routes that require authentication
const protectedApiRoutes = [
  '/api/v1/users',
  '/api/v1/product',
  '/api/v1/sale',
  '/api/v1/purchase',
  '/api/v1/notification'
];

// Routes that don't require authentication
const publicRoutes = [
  '/auth',
  '/api/v1/auth',
  '/api/v1/test'
];

export async function middleware(request: NextRequest) {

  // return NextResponse.next();
  const { pathname } = request.nextUrl;

  // Skip middleware for public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if it's a protected API route
  const isProtectedApiRoute = protectedApiRoutes.some(route => pathname.startsWith(route));
  // Check if it's a protected page route
  const isProtectedPageRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtectedApiRoute || isProtectedPageRoute) {
    let token: string | null = null;

    if (isProtectedApiRoute) {
      // For API routes, check multiple sources for token
      // 1. Authorization header (primary)
      const authHeader = request.headers.get('authorization');
      token = authHeader?.replace('Bearer ', '') || null;
      
      // 2. If no Authorization header, check cookie (fallback)
      if (!token) {
        token = request.cookies.get('auth_token')?.value || null;
      }
      
      // 3. Check for token in custom header (for client-side localStorage access)
      if (!token) {
        token = request.headers.get('x-auth-token') || null;
      }
    } else {
      // For page routes, check for JWT token in cookie
      token = request.cookies.get('auth_token')?.value || null;
    }

    if (!token) {
      if (isProtectedApiRoute) {
        // Return 401 for API routes
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        );
      } else {
        // Redirect to login for page routes
        return NextResponse.redirect(new URL('/auth', request.url));
      }
    }

    // Verify token
    const decoded = await jwtUtils.verifyToken(token);
    if (!decoded) {
      if (isProtectedApiRoute) {
        // Return 401 for API routes
        return NextResponse.json(
          { success: false, error: 'Invalid or expired token' },
          { status: 401 }
        );
      } else {
        // Redirect to login for page routes
        return NextResponse.redirect(new URL('/auth', request.url));
      }
    }

    // Add user info to headers for API routes
    if (isProtectedApiRoute) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', decoded.userId);
      requestHeaders.set('x-user-role', decoded.role);
      requestHeaders.set('x-user-name', decoded.name);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 