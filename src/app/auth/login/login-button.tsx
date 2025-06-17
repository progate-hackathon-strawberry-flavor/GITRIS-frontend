'use client';

import { createClient } from '@/lib/supabase/client'; // パスを修正
//import { Button } from '@/components/ui/button'; // UIコンポーネントの例、後から作成することを想定
export default function LoginPage() {
  const supabase = createClient();

  const handleGitHubLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${location.origin}/auth/callback`, // 認証後のリダイレクト先
      },
    });
  };

  return (
    <div>
      <h1>ログイン</h1>
      <Button onClick={handleGitHubLogin}>GitHubでサインイン</Button>
      {/* エラーメッセージなどを表示する処理 */}
    </div>
  );
}