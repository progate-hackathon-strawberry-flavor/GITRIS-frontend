'use client';

import { createClient } from '@/lib/supabase/client'; 
import { type Session } from '@supabase/supabase-js'

// page.tsx などから渡される session プロパティの型を定義
interface AuthButtonProps {
  session: Session | null
}

export default function LoginButton({ session }: AuthButtonProps) {
  // ブラウザで動作するSupabaseクライアントを作成
  const supabase = createClient()

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
  return (
    <div>
      <button onClick={handleGitHubLogin}>GitHubでログイン</button>
    </div>
    );
  }
  