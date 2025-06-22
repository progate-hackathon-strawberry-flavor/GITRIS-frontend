'use client'; // このコンポーネントはクライアントコンポーネントです

import React, { useState } from 'react';
import styles from './rankingModal.module.css'; // ランキングモーダル用のCSS Modulesをインポート
import { useUserDisplayName } from '@/hooks/useAuth';

interface ResultData {
  id: number;
  user_id: string;
  score: number;
  created_at: string;
  rank: number;
}

// ユーザー名表示コンポーネント
function UserNameDisplay({ userId }: { userId: string }) {
  const { displayName } = useUserDisplayName(userId);
  return <span>{displayName}</span>;
}

export default function RankingModalTrigger() {
  const [showModal, setShowModal] = useState(false); // モーダルの表示/非表示を管理
  const [resultData, setResultData] = useState<ResultData[]>([]); // ゲーム結果データの状態管理
  const [loading, setLoading] = useState(false); // ローディング状態の管理
  const [error, setError] = useState<string | null>(null); // エラー状態の管理

  const handleOpenModal = () => {
    setShowModal(true);
    fetchResultData(); // モーダルを開く時にゲーム結果データを取得
  };
  
  const handleCloseModal = () => setShowModal(false);

  // ゲーム結果データを取得する関数
  const fetchResultData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/results?limit=50', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('ゲーム結果データの取得に失敗しました');
      }

      const data = await response.json();
      if (data.success) {
        setResultData(data.results);
      } else {
        throw new Error('ゲーム結果データの取得に失敗しました');
      }
    } catch (err) {
      console.error('Result fetch error:', err);
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // ランキング順位を表示する関数
  const getRankDisplay = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}位`;
  };

  // ユーザーIDを表示用に短縮する関数
  const getDisplayUserName = (userId: string) => {
    if (userId.length > 8) {
      return `${userId.substring(0, 8)}...`;
    }
    return userId;
  };

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
            
            {loading && (
              <div className={styles.loadingContainer}>
                <p>読み込み中...</p>
              </div>
            )}
            
                          {error && (
                <div className={styles.errorContainer}>
                  <p>エラー: {error}</p>
                  <button onClick={fetchResultData} className={styles.retryButton}>
                    再試行
                  </button>
                </div>
              )}
              
              {!loading && !error && resultData.length === 0 && (
                <div className={styles.emptyContainer}>
                  <p>まだゲーム結果データがありません</p>
                </div>
              )}
              
              {!loading && !error && resultData.length > 0 && (
                <table className={styles.rankingTable}>
                  <thead>
                    <tr>
                      <th>ランク</th>
                      <th>プレイヤー</th>
                      <th>スコア</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultData.map((entry, index) => (
                      <tr key={entry.id}>
                        <td>{getRankDisplay(entry.rank)}</td>
                        <td><UserNameDisplay userId={entry.user_id} /></td>
                        <td>{entry.score.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
          </div>
        </div>
      )}
    </>
  );
}
