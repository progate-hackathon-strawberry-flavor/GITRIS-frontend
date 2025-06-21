'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

// 親コンポーネントから渡されるデータの型定義
type TetrominoPlacementPayload = {
  type: string;
  rotation: number;
  startDate: string;
  positions: { x: number; y: number; score: number }[];
  scorePotential: number;
};

type SaveDeckButtonProps = {
  tetrominosToSave: TetrominoPlacementPayload[];
  onSaveSuccess?: () => void;
};

// 全テトリミノの種類数を定数として定義
const TOTAL_TETROMINO_TYPES = 7;

export default function SaveDeckButton({ tetrominosToSave, onSaveSuccess }: SaveDeckButtonProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 全てのミノ(7個)が配置されたら保存可能にする
    const isSaveable = tetrominosToSave.length === TOTAL_TETROMINO_TYPES;

    const saveDeck = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('認証セッションがありません。');
            
            const requestBody = {
              userId: session.user.id,
              tetriminos: tetrominosToSave,
            };
            
            const apiUrl = 'http://localhost:8080/api/protected/deck/save';
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`APIエラー: ${errorData.message || response.statusText}`);
            }

            if (onSaveSuccess) onSaveSuccess();

        } catch (err: any) {
            setError(err.message || '不明なエラーが発生しました');
        } finally {
            setLoading(false);
        }
    };

    const buttonText = isSaveable ? 'デッキを保存する' : `全てのミノ(${TOTAL_TETROMINO_TYPES}個)を配置してください`;

    return (
        <div>
            <button 
              onClick={saveDeck} 
              disabled={loading || !isSaveable}
              className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg transition-colors hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
                {loading ? '保存中...' : buttonText}
            </button>
            {error && <p className="text-red-500 mt-2">エラー: {error}</p>}
        </div>
    );
}