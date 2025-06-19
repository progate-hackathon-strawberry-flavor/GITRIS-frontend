import React from 'react';
import { createClient } from '@/lib/supabase/server';
import AuthButton from './auth/register/auth-button';
// CSS Modulesをインポート
import styles from './page.module.css';

export default async function Home() {
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
        <button className={styles.iconButton} title="ヘルプ">
          ?
        </button>
        <button className={styles.iconButton} title="お問い合わせ">
          💬
        </button>
      </div>

      {/* GITRISロゴ部分 */}
      <div className={styles.logoContainer}>
        <h1 className={styles.logoText}>GITRIS</h1>
      </div>

      {/* ログインボタン - 画像の通りに配置 */}
      {/* ユーザーがログインしていない場合のみ「ログイン」ボタンを表示 */}

      {!user && (
        <button className={styles.loginButton}>
          <span style={{ marginRight: '10px' }}>▶️</span>
          <AuthButton session={user} />
        </button>
      )}

      {/* ===== ここからSupabase機能を追加 ===== */}

      <div className={styles.supabaseAuthSection}>
        {/* AuthButtonコンポーネントに、サーバーで取得したsessionを渡す */}{' '}
        {/* ログインしている場合のみ、ユーザー情報を表示する */}
        {user && (
          <div className={styles.userInfoContainer}>
            <p
              style={{
                fontWeight: 'semibold',
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
      {/* ===== ここまで ===== */}
    </div>
  );
}
