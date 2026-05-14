"use client";

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/api';

export default function GetContributionsButton() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchContributions = async () => {
        setLoading(true);
        setError(null);

        try {
            if (!user) {
                throw new Error('ユーザーがログインしていません');
            }
            
            const userId = user.userId;
            const response = await apiRequest(`/api/contributions/refresh/${userId}`, {
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
