'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/api';

interface PasscodeEntryProps {
  onRoomReady: (passcode: string, isHost: boolean) => void;
}

export default function PasscodeEntry({ onRoomReady }: PasscodeEntryProps) {
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const { token } = useAuth();

  const handleCreate = async () => {
    if (!token) { setError('ログインが必要です'); return; }
    setIsCreating(true);
    setError('');
    try {
      const res = await apiRequest('/api/game/room/create', {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ deck_id: 'guest' }),
      });
      const data = await res.json();
      if (data.success) {
        onRoomReady(data.passcode, true);
      } else {
        setError(data.error || 'ルームの作成に失敗しました');
      }
    } catch {
      setError('ルームの作成に失敗しました');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoin = async () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) {
      setError('6文字のルームコードを入力してください');
      return;
    }
    if (!token) { setError('ログインが必要です'); return; }
    setIsJoining(true);
    setError('');
    try {
      const res = await apiRequest(`/api/game/room/passcode/${code}/join`, {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ deck_id: 'guest' }),
      });
      const data = await res.json();
      if (data.success) {
        onRoomReady(code, false);
      } else {
        setError(data.error || 'ルームが見つかりません');
      }
    } catch {
      setError('ルームへの参加に失敗しました');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="passcode-entry">
      <div className="passcode-card">
        <div className="passcode-header">
          <h2>🎯 対戦ルーム</h2>
          <p>ルームを作成するか、コードを入力して参加します</p>
        </div>

        {error && <div className="error-message" style={{ color: '#ff6b6b', marginBottom: '12px' }}>{error}</div>}

        {/* ルーム作成 */}
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="enter-button"
            style={{ width: '100%', fontSize: '18px', padding: '16px' }}
          >
            {isCreating ? '作成中...' : '🏠 部屋を作る'}
          </button>
          <p style={{ marginTop: '8px', fontSize: '13px', color: '#aaa' }}>
            ルームコードが発行されます。相手に伝えてください。
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0' }}>
          <hr style={{ flex: 1, borderColor: '#444' }} />
          <span style={{ margin: '0 12px', color: '#888', fontSize: '14px' }}>または</span>
          <hr style={{ flex: 1, borderColor: '#444' }} />
        </div>

        {/* ルーム参加 */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            部屋に参加する
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="6文字のコード"
              maxLength={6}
              style={{
                flex: 1,
                padding: '12px',
                fontSize: '18px',
                letterSpacing: '4px',
                textAlign: 'center',
                textTransform: 'uppercase',
                background: '#1a1a2e',
                border: '2px solid #444',
                borderRadius: '8px',
                color: '#fff',
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />
            <button
              onClick={handleJoin}
              disabled={isJoining}
              className="enter-button"
              style={{ padding: '12px 20px', whiteSpace: 'nowrap' }}
            >
              {isJoining ? '参加中...' : '参加する'}
            </button>
          </div>
        </div>

        <div className="instructions" style={{ marginTop: '32px' }}>
          <h3>🎮 操作方法</h3>
          <ul>
            <li>・←→: 左右移動</li>
            <li>・↑: ハードドロップ</li>
            <li>・↓: ソフトドロップ</li>
            <li>・Space: 回転</li>
            <li>・C: ホールド</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
