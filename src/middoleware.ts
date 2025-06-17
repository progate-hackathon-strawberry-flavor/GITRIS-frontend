// src/middleware.ts

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  await supabase.auth.getUser()

  return response
}

const {
    data: { user },
  } = await supabase.auth.getUser()


  // 保護したいページ（例: /dashboard や /account など）のパスを配列で定義します。
  const protectedPaths = ['/dashboard', '/account', '/settings'];

  // 現在のパスが保護対象のいずれかで始まるかチェックします。
  const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path));

  // ユーザーがログインしていて、かつ保護対象ページにアクセスしようとしている場合
  if (user && isProtectedPath) {
    // データベースからプロフィール情報を検索
    const { data: profile, error } = await supabase
      .from('profiles') // あなたのプロフィールテーブル名
      .select('id')      // 存在確認だけならidなど軽量なカラムでOK
      .eq('id', user.id)
      .single()

    // プロフィールが存在しない場合
    if (!profile) {
      // ユーザーをサインアウトさせる
      await supabase.auth.signOut()

      // エラー情報と共にログインページへリダイレクト
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login' // あなたのログインページのパス
      redirectUrl.searchParams.set('error', 'profile_not_found')
      redirectUrl.searchParams.set(
        'error_description',
        'ユーザー情報が未登録のため、ログアウトしました。'
      )
      return NextResponse.redirect(redirectUrl)
    }
  }
  
  // ===== ここまで追加 =====

  // ログインしていないユーザーが保護対象ページにアクセスした場合の処理（任意）
  if (!user && isProtectedPath) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('error', 'login_required');
    return NextResponse.redirect(redirectUrl);
  }


  // 最終的にレスポンスを返す（セッションクッキーの更新もここに含まれる）
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}