'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { GameSession } from '../page';

interface WaitingRoomProps {
  passcode: string;
  gameSession: GameSession | null;
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  onGameStart: () => void;
  onReturnToEntry: () => void;
  setGameSession: (session: GameSession) => void;
  setSocket: (socket: WebSocket) => void;
  setConnectionStatus: (status: 'disconnected' | 'connecting' | 'connected') => void;
}

export default function WaitingRoom({
  passcode,
  gameSession,
  connectionStatus,
  onGameStart,
  onReturnToEntry,
  setGameSession,
  setSocket,
  setConnectionStatus
}: WaitingRoomProps) {
  const { session } = useAuth();
  const [userId] = useState(() => `user_${Math.random().toString(36).substr(2, 9)}`);
  const [authToken, setAuthToken] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  const [hasJoined, setHasJoined] = useState<boolean>(false); // 重複実行防止フラグ
  const [testUserId, setTestUserId] = useState<string>(''); // 認証バイパス用UserID
  const [isInitialized, setIsInitialized] = useState<boolean>(false); // 初期化完了フラグ
  const joinInProgress = useRef<boolean>(false); // ref による排他制御

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-19), `[${timestamp}] ${message}`]);
  };

  // 認証トークンを取得
  useEffect(() => {
    if (session?.access_token) {
      setAuthToken(`Bearer ${session.access_token}`);
      addLog('認証トークンを取得しました');
    } else {
      // 認証されていない場合（開発環境ではBYPASS_AUTHを使用）
      setAuthToken('');
      addLog('認証バイパスモードで動作します');
    }
    setIsInitialized(true); // 認証状態確定
  }, [session]);

  const joinByPasscode = async () => {
    addLog(`joinByPasscode called: hasJoined=${hasJoined}, inProgress=${joinInProgress.current}`);
    
    if (hasJoined || joinInProgress.current) {
      addLog('❌ 既に入室処理を実行済み/実行中です（重複実行防止）');
      return;
    }
    
    try {
      joinInProgress.current = true; // ref による排他制御
      setHasJoined(true); // 実行フラグを設定
      addLog('✅ 合言葉でのルーム参加処理を開始します...');
      
      // TODO: 実際のDeckID取得処理を実装
      const deckId = 'default_deck_id';

      // 環境変数からバックエンドURLを取得
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const backendUrl = `${apiUrl}/api/game/room/passcode/${passcode}/join`;
      
      // ヘッダーを構築（認証トークンがある場合のみ追加）
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (authToken) {
        headers['Authorization'] = authToken;
      }
      
      addLog(`🌐 HTTPリクエスト送信: ${backendUrl}`);
      addLog(`📋 ヘッダー: ${JSON.stringify(headers)}`);
      
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          deck_id: deckId
        })
      });

      const data = await response.json();
      addLog(`合言葉でのルーム参加結果: ${JSON.stringify(data)}`);
      
      if (data.success) {
        addLog(`🎉 入室成功: ${data.message}`);
        
        // レスポンスからUserIDを取得（認証バイパス時）
        if (data.user_id) {
          setTestUserId(data.user_id);
          addLog(`✅ サーバーから取得したUserID: ${data.user_id}`);
          
          // UserID設定完了後にWebSocket接続を強制実行
          addLog(`🔌 WebSocket接続を強制実行します...`);
          setTimeout(() => {
            addLog(`🚀 WebSocket接続開始（UserID: ${data.user_id}）`);
            connectWebSocket();
          }, 150); // 150ms遅延でstate更新を確実に
          
          // さらにバックアップとして2回目の接続試行
          setTimeout(() => {
            if (connectionStatus === 'disconnected') {
              addLog(`🔄 バックアップWebSocket接続試行`);
              connectWebSocket();
            }
          }, 1000); // 1秒後にバックアップ試行
        } else {
          // UserIDがない場合（通常の認証）
          addLog('✅ 合言葉でのマッチングが成功しました！WebSocketに接続します。');
          connectWebSocket();
        }
      } else {
        addLog(`❌ 入室失敗: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      addLog(`合言葉でのルーム参加エラー: ${error}`);
      setHasJoined(false); // エラー時はフラグをリセット
      joinInProgress.current = false; // ref もリセット
    } finally {
      joinInProgress.current = false; // 正常終了時も ref をリセット
    }
  };

  const [wsConnecting, setWsConnecting] = useState(false);

  const connectWebSocket = (retryCount = 0) => {
    addLog(`🔍 WebSocket接続チェック: testUserId="${testUserId}", authToken="${authToken ? 'あり' : 'なし'}", retry=${retryCount}`);
    
    // 既に接続済みまたは接続中の場合はスキップ
    if (connectionStatus === 'connected' || connectionStatus === 'connecting' || wsConnecting) {
      addLog('✅ WebSocket既に接続済み/接続中、スキップします');
      return;
    }
    
    setWsConnecting(true);
    
    // UserIDが設定されていない場合は少し待つ（最大8回まで延長）
    if (!testUserId && !authToken && retryCount < 8) {
      addLog(`⏳ UserIDが未設定のため、WebSocket接続を300ms遅延します... (${retryCount + 1}/8)`);
      setTimeout(() => connectWebSocket(retryCount + 1), 300);
      return;
    }
    
    // 8回試行してもUserIDが設定されない場合、エラー状態にする
    if (!testUserId && !authToken && retryCount >= 8) {
      addLog('❌ UserIDの設定に失敗しました。ルームへの参加に問題がある可能性があります。');
      setConnectionStatus('disconnected');
      setWsConnecting(false);
      return;
    }
    
    // 環境変数からWebSocketURLを構築
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const wsUrl = apiUrl.replace('http://', 'ws://').replace('https://', 'wss://') + `/api/game/ws/${passcode}`;
    
    addLog(`WebSocket接続を試行中: ${wsUrl}`);
    addLog(`使用予定UserID: ${testUserId || '認証トークンから取得'}`);
    setConnectionStatus('connecting');

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      addLog('WebSocket接続が開かれました');
      setConnectionStatus('connected');
      setWsConnecting(false);

      // 認証メッセージを送信
      const authMessage = {
        type: 'auth',
        token: authToken || 'BYPASS_AUTH',
        user_id: testUserId // 認証バイパス時のUserIDを指定
      };
      
      addLog(`WebSocket認証データ: ${JSON.stringify({
        type: authMessage.type,
        token: authMessage.token ? 'Bearer ...' : 'BYPASS_AUTH',
        user_id: authMessage.user_id || '(empty)'
      })}`);
      
      ws.send(JSON.stringify(authMessage));
      addLog(`認証メッセージを送信: UserID=${testUserId || 'auto'}`);
      
      if (!authToken) {
        addLog('認証バイパスモードでWebSocket接続しました');
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type) {
          if (data.type === 'auth_success') {
            addLog('認証が成功しました');
          } else {
            handleGameMessage(data);
          }
        } else if (data.id && (data.player1 || data.player2)) {
          setGameSession(data);
          
          // ゲームが開始されたかチェック
          if (data.status === 'playing') {
            addLog('ゲームが開始されました！');
            onGameStart();
          }
        }
      } catch (error) {
        addLog(`メッセージ解析エラー: ${error}`);
      }
    };

    ws.onerror = (event) => {
      addLog(`WebSocketエラー: ${event}`);
      setConnectionStatus('disconnected');
      setWsConnecting(false);
    };

    ws.onclose = (event) => {
      addLog(`WebSocket接続が閉じられました: ${event.code} - ${event.reason}`);
      setConnectionStatus('disconnected');
      setWsConnecting(false);
    };

    setSocket(ws);
  };

  const handleGameMessage = (data: any) => {
    switch(data.type) {
      case 'game_state':
        setGameSession(data);
        break;
      case 'room_status':
        // ルーム状態の更新
        break;
      case 'error':
        addLog(`エラー: ${data.message}`);
        break;
      default:
        addLog(`未対応のメッセージタイプ: ${data.type}`);
    }
  };

  useEffect(() => {
    // 初期化完了且つまだ入室していない場合のみ実行
    if (isInitialized && !hasJoined) {
      addLog(`🚀 初期化完了、入室処理開始: initialized=${isInitialized}, hasJoined=${hasJoined}`);
      joinByPasscode();
    }
  }, [isInitialized, hasJoined]); // sessionとauthTokenを依存配列から完全に除去

  // 2人揃った時の自動WebSocket接続チェック（一回だけ実行）
  const [autoConnectTriggered, setAutoConnectTriggered] = useState(false);
  
  useEffect(() => {
    if (gameSession && getPlayerCount() === 2 && gameSession.status === 'waiting' && 
        connectionStatus === 'disconnected' && !autoConnectTriggered) {
      addLog('👥 2人揃いました！WebSocket接続を自動開始します...');
      setAutoConnectTriggered(true);
      setTimeout(() => {
        connectWebSocket();
      }, 500); // 500ms遅延で接続開始
    }
    
    // プレイヤー数が2未満になったらフラグをリセット
    if (getPlayerCount() < 2) {
      setAutoConnectTriggered(false);
    }
  }, [gameSession?.player1, gameSession?.player2, gameSession?.status, connectionStatus, autoConnectTriggered]);

  const getConnectionStatusDisplay = () => {
    switch (connectionStatus) {
      case 'connected':
        return <span className="status-connected">接続済み</span>;
      case 'connecting':
        return <span className="status-connecting">接続中</span>;
      case 'disconnected':
      default:
        return <span className="status-disconnected">未接続</span>;
    }
  };

  const getPlayerCount = () => {
    if (!gameSession) return 0;
    let count = 0;
    if (gameSession.player1) count++;
    if (gameSession.player2) count++;
    return count;
  };

  return (
    <div className="waiting-room">
      <div className="waiting-card">
        <div className="waiting-header">
          <h2>⏳ 待機室</h2>
          <p>合言葉: <strong>{passcode}</strong></p>
        </div>

        <div className="connection-info">
          <div className="status-item">
            <span className="label">接続状態:</span>
            {getConnectionStatusDisplay()}
          </div>
          <div className="status-item">
            <span className="label">参加者:</span>
            <span className="value">{getPlayerCount()}/2人</span>
          </div>
          <div className="status-item">
            <span className="label">ゲーム状態:</span>
            <span className="value">{gameSession?.status || '待機中'}</span>
          </div>
        </div>

        <div className="players-status">
          <h3>👥 プレイヤー状況</h3>
          <div className="player-list">
            <div className={`player-slot ${gameSession?.player1 ? 'occupied' : 'empty'}`}>
              <span className="player-icon">👤</span>
              <span className="player-info">
                {gameSession?.player1 
                  ? `Player 1: ${gameSession.player1.user_id}`
                  : 'Player 1: 待機中...'
                }
              </span>
            </div>
            <div className={`player-slot ${gameSession?.player2 ? 'occupied' : 'empty'}`}>
              <span className="player-icon">👤</span>
              <span className="player-info">
                {gameSession?.player2 
                  ? `Player 2: ${gameSession.player2.user_id}`
                  : 'Player 2: 待機中...'
                }
              </span>
            </div>
          </div>
        </div>

        {getPlayerCount() < 2 && (
          <div className="waiting-message">
            <h3>🔄 相手を待っています...</h3>
            <p>同じ合言葉「{passcode}」を入力した相手が参加するまでお待ちください。</p>
            <div className="spinner"></div>
          </div>
        )}

        {getPlayerCount() === 2 && gameSession?.status === 'waiting' && (
          <div className="ready-message">
            <h3>✅ 2人揃いました！</h3>
            <p>まもなくゲームが開始されます...</p>
            {connectionStatus === 'disconnected' && (
              <div style={{ marginTop: '10px' }}>
                <p style={{ color: '#ff6b6b' }}>⚠️ WebSocket未接続のためゲームが開始されません</p>
                <p style={{ color: '#666', fontSize: '14px' }}>自動接続を待つか、下のボタンで手動接続してください</p>
                <button 
                  onClick={() => {
                    addLog(`🔄 手動WebSocket接続開始`);
                    connectWebSocket();
                  }} 
                  style={{ 
                    backgroundColor: '#4CAF50', 
                    color: 'white', 
                    padding: '10px 20px', 
                    border: 'none', 
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  🚀 手動でWebSocket接続
                </button>
              </div>
            )}
          </div>
        )}

        <div className="controls">
          <button onClick={onReturnToEntry} className="back-button">
            ← 戻る
          </button>
          <button 
            onClick={async () => {
              const confirmDelete = window.confirm(`セッション「${passcode}」を削除しますか？\n\n⚠️ 注意: 両方のプレイヤーが切断されます。`);
              if (confirmDelete) {
                addLog('🗑️ セッションを削除します...');
                try {
                  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/game/room/passcode/${passcode}/delete`, {
                    method: 'DELETE',
                    headers: {
                      'Content-Type': 'application/json',
                      ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
                    },
                  });

                  if (response.ok) {
                    const result = await response.json();
                    addLog(`✅ ${result.message}`);
                    setConnectionStatus('disconnected');
                    onReturnToEntry();
                  } else {
                    const error = await response.json();
                    addLog(`❌ セッション削除エラー: ${error.error}`);
                  }
                } catch (error) {
                  addLog(`❌ セッション削除に失敗しました: ${error}`);
                }
              }
            }} 
            className="delete-button"
            style={{ backgroundColor: '#ff6b6b', color: 'white', margin: '0 10px' }}
          >
            🗑️ セッション削除
          </button>
          {connectionStatus === 'disconnected' && (
            <button 
              onClick={() => {
                addLog(`再接続開始: testUserId=${testUserId}, authToken=${authToken ? 'あり' : 'なし'}`);
                connectWebSocket();
              }} 
              className="reconnect-button"
            >
              🔄 再接続
            </button>
          )}
        </div>

        <div className="logs-section">
          <h4>📋 ログ</h4>
          <div className="logs">
            {logs.map((log, index) => (
              <div key={index} className="log-entry">{log}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 