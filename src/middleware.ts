import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const authToken = request.cookies.get('auth_token');
  const { pathname } = request.nextUrl;

  // Korumasız rotalar
  const publicPaths = ['/login', '/signup'];
  const isPublicPath = publicPaths.includes(pathname);

  // API rotaları ve statik dosyalar için kontrol yapma
  if (
    pathname.startsWith('/_next') || // Next.js sistem dosyaları
    pathname.startsWith('/static') || // Statik dosyalar
    pathname.startsWith('/api/') || // API rotaları
    pathname.includes('.') // Dosya uzantıları (.png, .jpg vb.)
  ) {
    return NextResponse.next();
  }

  // Eğer public path ise ve token varsa ana sayfaya yönlendir
  if (isPublicPath && authToken) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Eğer public path değilse ve token yoksa login'e yönlendir
  if (!isPublicPath && !authToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/']
}; 