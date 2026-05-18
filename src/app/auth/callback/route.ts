import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/`)
  }

  try {
    // バックエンドの OAuth callback エンドポイントを呼び出す
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'
    const response = await fetch(`${backendUrl}/api/auth/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    })

    if (!response.ok) {
      console.error('Backend auth error:', response.statusText)
      return NextResponse.redirect(`${origin}/`)
    }

    const data = await response.json()

    if (!data.success || !data.token) {
      console.error('Auth failed:', data.error)
      return NextResponse.redirect(`${origin}/`)
    }

    // トークンとユーザー情報を保存して homepage にリダイレクト
    const redirectUrl = new URL(`${origin}/homepage`)
    
    // クッキーにトークンとユーザー情報を設定
    const response2 = NextResponse.redirect(redirectUrl)
    response2.cookies.set('authToken', data.token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    })
    response2.cookies.set('authUser', JSON.stringify({
      userId: data.user_id,
      login: data.login,
    }), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
      path: '/',
    })

    return response2
  } catch (error) {
    console.error('Auth callback error:', error)
    return NextResponse.redirect(`${origin}/`)
  }
}