import Image from "next/image";
import { createClient } from '@/lib/supabase/server';
import LoginButton from '../components/login-button';
import './globals.css';
import HelpModalTrigger from './components/HelpModal/helpModal.module';
import RankingModalTrigger from './components/rankingModal/RankingModalTrigger';
import styles from './page.module.css';
export default async function Login() {
  // サーバーサイドでSupabaseクライアントを作成
  const supabase = await createClient();

  // ユーザーのセッション情報（ログイン状態）を取得
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    // CSS Modulesのクラスを適用
    <div className={styles.container}>
      {/* <style>タグはCSS Modulesファイルに移したので削除 */}

      {/* 右上アイコン */}
      <div className={styles.topRightIcons}>
        <div className={styles.iconButton} title="ヘルプ">
          <HelpModalTrigger />
        </div>
        <div className={styles.iconButton} title="お問い合わせ">
          <RankingModalTrigger />
        </div>
      </div>
      <div className={styles.supabaseAuthSection}>
        <Image
          className="dark:invert"
          src="/ロゴ.png"
          alt="gitris-logo"
          width={504}
          height={221}
          priority
        />
        {/* @ts-ignore */}
        <LoginButton session={user} />
      </div>
    </div>
  );
}
