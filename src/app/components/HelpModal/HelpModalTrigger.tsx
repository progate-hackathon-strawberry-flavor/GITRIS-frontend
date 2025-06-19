'use client'; // このコンポーネントはクライアントコンポーネントです

import React, { useState } from 'react';
import styles from './helpModal.module.css'; // モーダル用のCSS Modulesをインポート

export default function HelpModalTrigger() {
  const [showModal, setShowModal] = useState(false); // モーダルの表示/非表示を管理

  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  return (
    <>
      {/* 質問マークボタン */}
      <button
        onClick={handleOpenModal}
        className={styles.questionMarkButton} // ★CSS Modulesクラスを適用★
        title="ヘルプ"
      >
        ?
      </button>

      {/* モーダル本体 */}
      {showModal && (
        <div className={styles.overlay} onClick={handleCloseModal}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            {' '}
            {/* イベント伝播の停止 */}
            <button className={styles.backButton} onClick={handleCloseModal}>
              ◀️ {/* 左向きの三角形 */}
            </button>
            <h2 className={styles.modalTitle}>遊び方</h2>
            <p className={styles.modalText}>部屋に入るか作成して遊んでね！！</p>
          </div>
        </div>
      )}
    </>
  );
}
