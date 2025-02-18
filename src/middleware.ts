import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get('auth_token');
  const { pathname } = request.nextUrl;

  // Statik dosyalara ve auth sayfalarına erişime izin ver
  if (
    pathname.startsWith('/_next') || // Next.js sistem dosyaları
    pathname.startsWith('/static') || // Statik dosyalar
    pathname.includes('.') || // Dosya uzantıları (.png, .jpg vb.)
    pathname === '/login' ||
    pathname === '/signup'
  ) {
    return NextResponse.next();
  }

  // Diğer tüm sayfalar için giriş kontrolü
  if (!authToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}; 