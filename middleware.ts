import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Handle file uploads for chat
  if (request.nextUrl.pathname.startsWith('/api/chat/upload')) {
    // Allow file uploads
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/chat/:path*',
  ],
};


