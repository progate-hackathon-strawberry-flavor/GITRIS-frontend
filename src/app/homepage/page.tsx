'use client';

import React from 'react';

// CSS Modulesをインポート
import styles from './page.module.css';

export default function Home() {
  // 各ボタンのクリックハンドラ
  const handleDeckEdit = () => {
    // デッキ編成ページへの遷移ロジックをここに記述
    // 例: router.push('/deck');
    console.log('デッキ編成ボタンがクリックされました。');
  };

  const handleGameplay = () => {
    // ゲームプレイページへの遷移ロジックをここに記述
    // 例: router.push('/game/single');
    console.log('ゲームプレイボタンがクリックされました。');
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

      {/* 画像にある「デッキ編成」と「ゲームプレイ」ボタン */}
      <button className={styles.menuButton} onClick={handleDeckEdit}>
        <span style={{ marginRight: '10px' }}>▶️</span> デッキ編成
      </button>
      <button className={styles.menuButton} onClick={handleGameplay}>
        <span style={{ marginRight: '10px' }}>▶️</span> ゲームプレイ
      </button>
    </div>
  );
}
