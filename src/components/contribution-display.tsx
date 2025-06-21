"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client'

type Contribution = {
  Date: string;
  ContributionCount: number;
};

const getGrassColor = (count: number) => {
  if (count > 20) return '#5BD963'; // 明るい
  if (count > 10) return '#2DA042';
  if (count > 5) return '#1D732A';
  if (count > 0) return '#034018'; // 暗い
  return '#151B23'; // 草なしの色
};

export default function ContributionsDisplay() {
  const [contributions, setContributions] = useState<Contribution[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContributions = async () => {
    setLoading(true);
    setError(null);
    setContributions(null);

    try {
      const supabase = createClient();

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('ユーザー情報の取得に失敗しました');
      }
      const userId = user.id;

      const response = await fetch(`http://localhost:8080/api/contributions/${userId}`);

      if (!response.ok) {
        throw new Error(`APIエラー: ${response.status}`);
      }

      const data = await response.json();
      setContributions(data);

    } catch (err: any) {
      setError(err.message || '不明なエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  //  useEffectフックを追加
  //  このフックにより、コンポーネントが最初に表示されたときに
  //  fetchContributions関数が自動で一度だけ実行されます。
  useEffect(() => {
    fetchContributions();
  }, []); // 空の配列[]は「最初のレンダリング時に一度だけ実行」を意味します

  return (
    <div>
      {/* 4. ボタンは「再取得」や「更新」の役割に変更 */}
      <button onClick={fetchContributions} disabled={loading}>
        {loading ? 'データ取得中...' : 'データを再取得'}
      </button>

      {error && <p style={{ color: 'red' }}>エラー: {error}</p>}
      
      {loading && <p>Loading...</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 40px)', marginTop: '20px' }}>
        {contributions && contributions.length > 0 ? (
          contributions.map(item => (
            <div
              key={item.Date}
              style={{
                width: '9px',
                height: '9px',
                backgroundColor: getGrassColor(item.ContributionCount),
                border: '1px solid #2da042'
              }}
              title={`Date: ${item.Date}, Contributions: ${item.ContributionCount}`}
            >
            </div>
          ))
        ) : (
          // ローディング中でなく、コントリビューションデータもない場合にメッセージを表示
          !loading && !contributions && <p>貢献データが見つかりませんでした。</p>
        )}
      </div>
    </div>
  );
};