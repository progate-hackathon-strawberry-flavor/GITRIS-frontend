"use client";

import React, { useState } from 'react';
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

export default function ContributionsButton() {
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
      setContributions(data); // dataが配列の場合

    } catch (err: any) {
      setError(err.message || '不明なエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={fetchContributions} disabled={loading}>
        {loading ? 'データ取得中...' : '貢献データを表示'}
      </button>
      {error && <p style={{ color: 'red' }}>エラー: {error}</p>}
      {contributions && (
        <div style={{ border: '1px solid #ccc', padding: '10px', marginTop: '10px' }}>
          <h2>貢献データ</h2>
          <pre>{JSON.stringify(contributions, null, 2)}</pre>
        </div>
      )}
      {loading && <p>Loading...</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 40px)'}}>
        {contributions && contributions.length > 0 ? (
          contributions.map(item => (
            <div
              key={item.Date}
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: getGrassColor(item.ContributionCount),
                border: '1px solid #2da042'
              }}
              title={`Date: ${item.Date}, Contributions: ${item.ContributionCount}`}
            >
            </div>
          ))
        ) : (
          !loading && <p>No contribution data found.</p>
        )}
      </div>
      {/* ...テトリミノパレットなどの他のUI要素  */}
    </div>
  );
};
