import { NextResponse, type NextRequest } from 'next/server'

const protectedPrefixes = ['/homepage', '/deck', '/game', '/room']

export function middleware(request: NextRequest) {
  const token = request.cookies.get('authToken')?.value
  const isProtectedPath = protectedPrefixes.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix)
  )

  if (!token && isProtectedPath) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/'
    redirectUrl.searchParams.set('error', 'login_required')
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}