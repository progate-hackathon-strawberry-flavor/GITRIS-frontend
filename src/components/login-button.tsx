'use client';

import { createClient } from '@/lib/supabase/client'; 
import { type Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

// page.tsx などから渡される session プロパティの型を定義
interface AuthButtonProps {
  session: Session | null
}

export default function LoginButton({ session }: AuthButtonProps) {
  // ブラウザで動作するSupabaseクライアントを作成
  const supabase = createClient()

  const router = useRouter()

  // GitHubでサインインする処理
  const handleGitHubLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        // ログイン後にリダイレクトするURL
        redirectTo: `${location.origin}/homepage`,
      },
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <div>
      {session ? (
        <button onClick={handleLogout}>ログアウト</button>
      ) : (
        <button onClick={handleGitHubLogin}>GitHubでログイン</button>
      )}
    </div>
    );
  }
  