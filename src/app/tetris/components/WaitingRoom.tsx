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
  const [wsConnecting, setWsConnecting] = useState(false);
  
  // ポーリング用の状態
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-19), `[${timestamp}] ${message}`]);
  };

  // ゲームセッション情報を取得する関数
  const fetchGameSession = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const sessionUrl = `${apiUrl}/api/game/room/passcode/${passcode}/status`;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (authToken) {
        headers['Authorization'] = authToken;
      }
      
      const response = await fetch(sessionUrl, {
        method: 'GET',
        headers
      });

      if (response.ok) {
        const sessionData = await response.json();
        addLog(`📊 セッション情報取得: Player1=${sessionData.player1 ? '✅' : '❌'}, Player2=${sessionData.player2 ? '✅' : '❌'}, Status=${sessionData.status}`);
        
        // ゲームセッション情報を更新
        setGameSession(sessionData);
        
        return sessionData;
      } else {
        addLog(`❌ セッション情報取得エラー: ${response.status}`);
        return null;
      }
    } catch (error) {
      addLog(`❌ セッション情報取得失敗: ${error}`);
      return null;
    }
  };

  // ポーリング開始
  const startPolling = () => {
    if (isPolling || pollingInterval.current) {
      addLog('⚠️ ポーリング既に実行中');
      return;
    }
    
    addLog('🔄 ゲームセッション情報のポーリング開始');
    setIsPolling(true);
    
    // 即座に1回実行
    fetchGameSession();
    
    // 3秒間隔でポーリング
    pollingInterval.current = setInterval(async () => {
      const session = await fetchGameSession();
      
      // 2人揃ったらポーリング停止
      if (session && session.player1 && session.player2) {
        addLog('👥 2人揃いました！ポーリングを停止します');
        stopPolling();
      }
    }, 3000);
  };

  // ポーリング停止
  const stopPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
    setIsPolling(false);
    addLog('⏹️ ポーリング停止');
  };

  // コンポーネントのクリーンアップ
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

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
        }
        
        addLog('✅ 入室完了！WebSocket接続は手動で行ってください。');
        
        // 入室成功後、ゲームセッション情報のポーリングを開始
        addLog('🔄 ゲームセッション情報の監視を開始します...');
        setTimeout(() => {
          startPolling();
        }, 1000); // 1秒後にポーリング開始
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

  const connectWebSocket = (retryCount = 0) => {
    addLog(`🔍 WebSocket接続チェック: testUserId="${testUserId}", authToken="${authToken ? 'あり' : 'なし'}", retry=${retryCount}`);
    
    // 既に接続済みまたは接続中の場合はスキップ
    if (connectionStatus === 'connected' || connectionStatus === 'connecting' || wsConnecting) {
      addLog('✅ WebSocket既に接続済み/接続中、スキップします');
      return;
    }
    
    setWsConnecting(true);
    
    // 手動接続時はUserID チェックを緩和（認証トークンがあれば OK）
    if (!testUserId && !authToken) {
      addLog('❌ UserIDまたは認証トークンが必要です');
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
            addLog('🎮 ゲームが開始されました！WebSocket所有権を親コンポーネントに移譲します');
            
            // WebSocket所有権を親に移譲する前に、このコンポーネントでのイベントリスナーを削除
            ws.onmessage = null;
            ws.onerror = null;
            ws.onclose = null;
            
            // 親コンポーネントのGameStartハンドラーを呼び出し
            setTimeout(() => {
              onGameStart();
            }, 50); // 少し遅延させてWebSocket移譲を確実に
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

    // WebSocketを親コンポーネントに渡す（所有権移譲）
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

  // 初期化完了且つまだ入室していない場合のみ実行
  useEffect(() => {
    if (isInitialized && !hasJoined) {
      addLog(`🚀 初期化完了、入室処理開始: initialized=${isInitialized}, hasJoined=${hasJoined}`);
      joinByPasscode();
    }
  }, [isInitialized, hasJoined]); // sessionとauthTokenを依存配列から完全に除去

  // 自動WebSocket接続を完全に無効化
  // const [autoConnectTriggered, setAutoConnectTriggered] = useState(false);
  
  // useEffect(() => {
  //   if (gameSession && getPlayerCount() === 2 && gameSession.status === 'waiting' && 
  //       connectionStatus === 'disconnected' && !autoConnectTriggered) {
  //     addLog('👥 2人揃いました！WebSocket接続を自動開始します...');
  //     setAutoConnectTriggered(true);
  //     setTimeout(() => {
  //       connectWebSocket();
  //     }, 500); // 500ms遅延で接続開始
  //   }
    
  //   // プレイヤー数が2未満になったらフラグをリセット
  //   if (getPlayerCount() < 2) {
  //     setAutoConnectTriggered(false);
  //   }
  // }, [gameSession?.player1, gameSession?.player2, gameSession?.status, connectionStatus, autoConnectTriggered]);

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
          <h2>🔄 ルーム待機中</h2>
          <p><strong>合言葉:</strong> {passcode}</p>
          <p><strong>接続状態:</strong> {getConnectionStatusDisplay()}</p>
        </div>

        <div className="session-info" style={{ margin: '20px 0', padding: '15px', backgroundColor: '#1a1a1a', borderRadius: '8px' }}>
          <h3>📊 セッション情報</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
            <div>
              <strong>Player 1:</strong> 
              <span style={{ marginLeft: '8px', color: gameSession?.player1 ? '#4CAF50' : '#ff6b6b' }}>
                {gameSession?.player1 ? `✅ ${gameSession.player1.user_id}` : '❌ 空席'}
              </span>
            </div>
            <div>
              <strong>Player 2:</strong> 
              <span style={{ marginLeft: '8px', color: gameSession?.player2 ? '#4CAF50' : '#ff6b6b' }}>
                {gameSession?.player2 ? `✅ ${gameSession.player2.user_id}` : '❌ 空席'}
              </span>
            </div>
          </div>
          <div style={{ marginTop: '10px' }}>
            <strong>ゲーム状態:</strong> 
            <span style={{ marginLeft: '8px', color: gameSession?.status === 'waiting' ? '#ffd700' : '#4CAF50' }}>
              {gameSession?.status || '不明'}
            </span>
          </div>
          {isPolling && (
            <div style={{ marginTop: '10px', color: '#ffd700' }}>
              🔄 セッション情報を監視中... (3秒間隔)
            </div>
          )}
        </div>

        {getPlayerCount() < 2 && (
          <div className="waiting-message">
            <h3>🔄 相手を待っています...</h3>
            <p>同じ合言葉「{passcode}」を入力した相手が参加するまでお待ちください。</p>
            <div className="spinner"></div>
            
            {!isPolling && (
              <button 
                onClick={() => {
                  addLog('🔄 手動でセッション情報を更新します');
                  fetchGameSession();
                }}
                style={{ 
                  marginTop: '15px',
                  backgroundColor: '#2196F3', 
                  color: 'white', 
                  padding: '8px 16px', 
                  border: 'none', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                📊 セッション情報を更新
              </button>
            )}
          </div>
        )}

        {getPlayerCount() === 2 && gameSession?.status === 'waiting' && (
          <div className="ready-message">
            <h3>✅ 2人揃いました！</h3>
            <p>WebSocket接続を行ってゲームを開始してください</p>
            
            <div className="connection-controls" style={{ marginTop: '20px', padding: '15px', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
              <div style={{ marginBottom: '10px' }}>
                <strong>WebSocket接続状態: </strong>
                {getConnectionStatusDisplay()}
              </div>
              
              {connectionStatus === 'disconnected' && (
                <div>
                  <p style={{ color: '#ffd700', fontSize: '14px', marginBottom: '10px' }}>
                    ⚠️ ゲーム開始にはWebSocket接続が必要です
                  </p>
                  <button 
                    onClick={() => {
                      addLog(`🔄 手動WebSocket接続開始`);
                      connectWebSocket();
                    }} 
                    style={{ 
                      backgroundColor: '#4CAF50', 
                      color: 'white', 
                      padding: '12px 24px', 
                      border: 'none', 
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}
                  >
                    🚀 WebSocket接続開始
                  </button>
                </div>
              )}
              
              {connectionStatus === 'connecting' && (
                <div style={{ color: '#ffaa00' }}>
                  <p>🔄 WebSocket接続中...</p>
                </div>
              )}
              
              {connectionStatus === 'connected' && (
                <div style={{ color: '#4CAF50' }}>
                  <p>✅ WebSocket接続完了！ゲーム開始を待機中...</p>
                  <p style={{ fontSize: '14px', color: '#ccc' }}>
                    サーバーがゲームを開始するまでお待ちください
                  </p>
                </div>
              )}
            </div>
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
              🔄 WebSocket再接続
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