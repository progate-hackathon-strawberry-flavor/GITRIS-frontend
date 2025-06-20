'use client'; // このコンポーネントはクライアントコンポーネントです

import React, { useState } from 'react';
import styles from './rankingModal.module.css'; // ランキングモーダル用のCSS Modulesをインポート

export default function RankingModalTrigger() {
  const [showModal, setShowModal] = useState(false); // モーダルの表示/非表示を管理

  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  // 仮のランキングデータ (実際のデータはAPIから取得します)
  const rankingData = [
    { rank: '1ST', name: 'ラーメン', score: 10000 },
    { rank: '2ND', name: 'お肉', score: 9000 },
    { rank: '3RD', name: 'お米', score: 8999 },
    { rank: '4TH', name: 'いちご', score: 33 },
  ];

  return (
    <>
      {/* チャットボタン */}
      <button
        onClick={handleOpenModal}
        className={styles.chatButton}
        title="ランキング" // ツールチップを「ランキング」に変更
      >
        💬
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
            <h2 className={styles.modalTitle}>ランキング</h2>
            <table className={styles.rankingTable}>
              <thead>
                <tr>
                  <th>ランク</th>
                  <th>名前</th>
                  <th>スコア</th>
                </tr>
              </thead>
              <tbody>
                {rankingData.map((entry, index) => (
                  <tr key={index}>
                    <td>{entry.rank}</td>
                    <td>{entry.name}</td>
                    <td>{entry.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
