import Image from "next/image";
import { createClient } from '@/lib/supabase/server';
import HomepageButton from './HomepageButton';

export default async function Login() {
  // サーバーサイドでSupabaseクライアントを作成
  const supabase = await createClient();

  // ユーザーのセッション情報（ログイン状態）を取得
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/ロゴ.png"
          alt="gitris-logo"
          width={504}
          height={221}
          priority
        />
        <HomepageButton />
      </main>
    </div>
  );
}