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
        {/* @ts-ignore */}
        <LoginButton session={user} />
        {user && (
          <div className={styles.userInfoContainer}>
            <p
              style={{
                fontWeight: 'semibold',
                // @ts-ignore
                color: styles.userInfoContainer.pColor,
              }}
            >
              ログイン中のユーザー:
            </p>{' '}
            {/* pColorは存在しないので注意 */}
            <pre className={styles.userInfoPre}>
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
