import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  // x-forwarded-host から本番のホスト名を取得
  const forwardedHost = request.headers.get('x-forwarded-host')
  const protocol = 'https://'
  const url = new URL(request.url)
  const origin = forwardedHost ? `${protocol}${forwardedHost}` : url.origin
  const searchParams = url.searchParams
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}