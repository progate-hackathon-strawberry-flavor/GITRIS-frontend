// src/lib/supabase/server.ts

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  // cookies() は、必ずServer ComponentやRoute Handler内で呼び出される
  // この createClient 関数の中で呼び出すようにする
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // `set`メソッドがServer Componentから呼び出された場合、
            // エラーが発生することがあります。これはミドルウェアがセッションを
            // 更新していれば無視して問題ありません。
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // `remove`メソッドがServer Componentから呼び出された場合も同様です。
          }
        },
      },
    }
  )
}