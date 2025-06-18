'use client' // ★最重要：クライアントコンポーネントであることを宣言

import { createClient } from '@/lib/supabase/client' // ★ブラウザ用のクライアントをインポート
import { type Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

// page.tsx などから渡される session プロパティの型を定義
interface AuthButtonProps {
  session: Session | null
}

export default function AuthButton({ session }: AuthButtonProps) {
  // ブラウザで動作するSupabaseクライアントを作成
  const supabase = createClient()
  // ページを更新するためのルーター
  const router = useRouter()

  // GitHubでサインインする処理
  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        // ログイン後にリダイレクトするURL
        redirectTo: `${location.origin}/auth/callback`,
      },
    })
  }

  // サインアウトする処理
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    // ★重要：サーバーコンポーネントのデータを更新するためにページをリフレッシュ
    router.refresh()
  }

  // session の有無で表示するボタンを切り替える
  return session ? (
    <button onClick={handleSignOut}>ログアウト</button>
  ) : (
    <button onClick={handleSignIn}>GitHubでログイン</button>
  )
}