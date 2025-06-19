//ログイン後に表示される画面（ログインした後、どこに遷移するのかによっては必要ないかも）
'use client';
import React from 'react';
import { createClient } from '@/lib/supabase/server'; // サーバーサイドSupabaseクライアント
import AuthButton from '../../auth/register/auth-button';
// CSS Modulesをインポート
import styles from '../page.module.css';

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ログイン後のボタンのアクションを定義
  const handleDeckEdit = () => {
    // デッキ編成ページへの遷移ロジック
    console.log('デッキ編成ボタンがクリックされました。');
    // 例: router.push('/deck');
  };

  const handleGameplay = () => {
    // ゲームプレイページへの遷移ロジック（シングルプレイを想定）
    console.log('ゲームプレイボタンがクリックされました。');
    // 例: router.push('/game/single');
  };

  return (
    <div className={styles.container}>
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

      {/* ログイン済みの場合にのみ表示されるメニューボタン */}
      {user ? (
        <>
          <button className={styles.menuButton} onClick={handleDeckEdit}>
            <span style={{ marginRight: '10px' }}>▶️</span> デッキ編成
          </button>
          <button className={styles.menuButton} onClick={handleGameplay}>
            <span style={{ marginRight: '10px' }}>▶️</span> ゲームプレイ
          </button>
        </>
      ) : (
        // ログインしていない場合はAuthButtonを表示（ログインを促す）
        // または、ログインページへの直接的なリダイレクトを検討
        <button
          // このボタンは未ログイン時に表示され、クリックイベントはAuthButtonが担当
          // AuthButtonがGitHub OAuthのトリガーとなるため、このボタン自体には直接onClickはつけない
          // ユーザーがログインしていない場合、AuthButtonが「GitHubでログイン」などの表示になるはず
          className={styles.menuButton} // 同じスタイルを適用
        >
          <span style={{ marginRight: '10px' }}>▶️</span> ログイン
        </button>
      )}

      {/* ===== ここからSupabase機能を追加 ===== */}
      {/* このセクションはユーザーのログイン状態に関わらず表示されるSupabase認証ボタンとユーザー情報 */}
      <div className={styles.supabaseAuthSection}>
        <h2 className={styles.supabaseAuthSection['h2']}>Supabase認証</h2>{' '}
        {/* CSS Modulesのネストセレクタのアクセス方法を修正 */}
        {/* AuthButtonコンポーネントに、サーバーで取得したsessionを渡す */}
        <AuthButton session={user} />
        {/* ログインしている場合のみ、ユーザー情報を表示する */}
        {user && (
          <div className={styles.userInfoContainer}>
            <p style={{ fontWeight: 'semibold', color: '#F0F5FA' }}>
              ログイン中のユーザー:
            </p>{' '}
            {/* 色を直接指定 */}
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
