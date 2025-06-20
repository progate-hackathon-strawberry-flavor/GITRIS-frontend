'use client';

import { useRouter } from 'next/navigation';

// サーバーコンポーネントから isLoggedIn を受け取る
export default function HomepageButton() {
  const router = useRouter();

  return (
    <div className="flex gap-4">
      <button type="button" onClick={() => router.push('/game')}>
        ゲームを始める
      </button>
      <button type="button" onClick={() => router.push('/deck')}>
        デッキ編成
      </button>
    </div>
  );
}