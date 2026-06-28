import { NextResponse } from 'next/server';
import { getSessionCookieName, verifyAdminSessionToken } from './lib/adminSession';

function isProtectedAdminPath(pathname) {
  return pathname.startsWith('/admin') && pathname !== '/admin/login';
}

function isProtectedAdminApiPath(pathname) {
  return pathname.startsWith('/api/admin') && pathname !== '/api/admin/login';
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const shouldProtect = isProtectedAdminPath(pathname) || isProtectedAdminApiPath(pathname);

  if (!shouldProtect) {
    return NextResponse.next();
  }

  if (request.method === 'OPTIONS' && pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const token = request.cookies.get(getSessionCookieName())?.value;
  const authenticated = await verifyAdminSessionToken(token);

  if (authenticated) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = '/admin/login';
  loginUrl.searchParams.set('next', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
