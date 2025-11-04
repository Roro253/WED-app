import { NextResponse, NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const uid = req.cookies.get('uid')?.value
  if (!uid) {
    res.cookies.set({
      name: 'uid',
      value: 'dev-user',
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    })
  }
  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png).*)',
  ],
}

