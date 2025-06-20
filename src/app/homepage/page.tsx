import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import HomepageButton from './HomepageButton';
import HelpModalTrigger from '../components/HelpModal/helpModal.module'; // HelpModalTriggerをインポート
import RankingModalTrigger from '../components/rankingModal/RankingModalTrigger'; // RankingModalTriggerをインポート
// CSS Modulesをインポート
import styles from '../page.module.css'; // page.module.css も使用します
// TetrisBGMPlayer をインポート
import TetrisBGMPlayer from '../components/TetrisBGMPlayer'; // パスを適切に調整してください

export default async function Login() {
  // サーバーサイドでSupabaseクライアントを作成
  const supabase = await createClient();

  // ユーザーのセッション情報（ログイン状態）を取得
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    // 全体コンテナのスタイルを調整 (page.module.cssの.containerと重複しないように注意)
    <div className={styles.container}>
      {' '}
      {/* CSS Modulesの.containerを適用 */}
      {/* ★追加★ BGMプレイヤーを配置 */}
      <TetrisBGMPlayer />
      {/* 右上アイコンを配置するコンテナ */}
      <div className={styles.topRightIcons}>
        <HelpModalTrigger /> {/* 遊び方モーダルボタン */}
        <RankingModalTrigger /> {/* ランキングモーダルボタン */}
      </div>
      {/* main要素を中央に配置するために調整 */}
      <main
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center', // 水平方向の中央揃え
          justifyContent: 'center', // 垂直方向の中央揃え
          flexGrow: 1, // 残りのスペースを占めるようにする
          gap: '32px', // gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)] は消します
        }}
      >
        {/* ロゴ画像を維持 */}
        <Image
          className="dark:invert" // Tailwind CSSを使っている場合、このクラスは機能します
          src="/ロゴ.png" // このパスにロゴ画像があることを確認
          alt="gitris-logo"
          width={504}
          height={221}
          priority
        />
        {/* ホームページボタンコンポーネントをレンダリング */}
        <HomepageButton />
      </main>
    </div>
  );
}
