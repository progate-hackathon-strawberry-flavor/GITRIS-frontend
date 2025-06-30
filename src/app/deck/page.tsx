import Image from "next/image";
import { createClient } from '@/lib/supabase/server';
import DeckMain from './deckmain'

export default async function Deck() {
  // サーバーサイドでSupabaseクライアントを作成
  const supabase = await createClient();

  // ユーザーのセッション情報（ログイン状態）を取得
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-0 pb-0 gap-4 sm:p-0 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-4 row-start-2 items-center sm:items-start">
        <DeckMain />
      </main>
    </div>
  );
}


