"use client";

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client'

export default function GetContributionsButton() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchContributions = async () => {
        setLoading(true);
        setError(null);

        try {
            const supabase = createClient();
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) {
                throw new Error('ユーザー情報の取得に失敗しました');
            }
            const userId = user.id;

            const response = await fetch(`http://localhost:8080/api/contributions/refresh/${userId}`, {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error(`APIエラー: ${response.status}`);
            }
            // レスポンスデータは使わない

        } catch (err: any) {
            setError(err.message || '不明なエラーが発生しました');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <button onClick={fetchContributions} disabled={loading}>
                {loading ? 'データ取得中...' : '貢献データを取得'}
            </button>
            {error && <p style={{ color: 'red' }}>エラー: {error}</p>}
            {loading && <p>Loading...</p>}
        </div>
    );
}
