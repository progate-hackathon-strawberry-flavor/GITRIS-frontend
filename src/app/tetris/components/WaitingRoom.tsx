'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { GameSession } from '../page';
import { useAuth, useUserDisplayName } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/api';

interface WaitingRoomProps {
  passcode: string;
  gameSession: GameSession | null;
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  onGameStart: () => void;
  onReturnToEntry: () => void;
  setGameSession: (session: GameSession) => void;
  setSocket: (socket: WebSocket | null) => void;
  setConnectionStatus: (status: 'disconnected' | 'connecting' | 'connected') => void;
  setCurrentUserId: (userId: string | null) => void;
}

export default function WaitingRoom({
  passcode,
  gameSession,
  connectionStatus,
  onGameStart,
  onReturnToEntry,
  setGameSession,
  setSocket,
  setConnectionStatus,
  setCurrentUserId
}: WaitingRoomProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [testUserId, setTestUserId] = useState<string>('test-user-001');
  const [isPolling, setIsPolling] = useState(false);
  const [pollIntervalId, setPollIntervalId] = useState<NodeJS.Timeout | null>(null);

  // ユーザー名を取得するフック
  const { token } = useAuth();
  const { displayName: player1Name } = useUserDisplayName(gameSession?.player1?.user_id || null);
  const { displayName: player2Name } = useUserDisplayName(gameSession?.player2?.user_id || null);

  const [hasJoined, setHasJoined] = useState<boolean>(false); // 重複実行防止フラグ
  const [isInitialized, setIsInitialized] = useState<boolean>(false); // 初期化完了フラグ
  const joinInProgress = useRef<boolean>(false); // ref による排他制御
  const [wsConnecting, setWsConnecting] = useState(false);
  
  // ポーリング用の状態
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  // ログ機能を無効化
  const addLog = (message: string) => {
    // ログ出力を無効化
    // const timestamp = new Date().toLocaleTimeString();
    // setLogs(prev => [...prev.slice(-19), `[${timestamp}] ${message}`]);
  };

  // ゲームセッション情報を取得する関数
  const fetchGameSession = useCallback(async () => {
    try {
      const response = await apiRequest(`/api/game/room/passcode/${passcode}/status`, {
        method: 'GET',
        credentials: 'include',
      })

      if (response.ok) {
        const sessionData = await response.json()
        setGameSession(sessionData)
        return sessionData
      }
      return null
    } catch (error) {
      return null
    }
  }, [passcode, setGameSession])

  // ポーリング停止
  const stopPolling = useCallback(() => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current)
      pollingInterval.current = null
    }
    setIsPolling(false)
  }, [])

  // ポーリング開始
  const startPolling = useCallback(() => {
    if (isPolling || pollingInterval.current) {
      return
    }

    setIsPolling(true)

    // 即座に1回実行
    void fetchGameSession()

    // 3秒間隔でポーリング
    pollingInterval.current = setInterval(async () => {
      const session = await fetchGameSession()

      // 2人揃ったらポーリング停止
      if (session && session.player1 && session.player2) {
        stopPolling()
      }
    }, 3000)
  }, [fetchGameSession, isPolling, stopPolling])

  // コンポーネントのクリーンアップ
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  // 認証情報をサーバー経由で取得（httpOnly cookie を利用）
  useEffect(() => {
    const getToken = async () => {
      try {
        const res = await apiRequest('/api/protected/auth/me', { credentials: 'include' })
        if (!res.ok) {
          setCurrentUserId(testUserId)
        } else {
          const { user: me } = await res.json()
          const resolvedUserId = me?.id || me?.user_id || me?.userId
          if (resolvedUserId) {
            setTestUserId(resolvedUserId)
            setCurrentUserId(resolvedUserId)
          } else {
            setCurrentUserId(testUserId)
          }
        }
      } catch (err) {
        setCurrentUserId(testUserId)
      } finally {
        setIsInitialized(true)
      }
    }

    getToken()
  }, [setCurrentUserId, testUserId])

  const connectWebSocket = (retryCount = 0) => {
    // 既に接続済みまたは接続中の場合はスキップ
    if (connectionStatus === 'connected' || connectionStatus === 'connecting' || wsConnecting) {
      return;
    }
    
    setWsConnecting(true);
    
    // JWT がなければ認証できないので中断する
    if (!token) {
      setConnectionStatus('disconnected');
      setWsConnecting(false);
      return;
    }
    
    // 環境変数からWebSocketURLを構築
    const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
    const wsUrl = apiUrl.replace('http://', 'ws://').replace('https://', 'wss://') + `/api/game/ws/${passcode}`;
    
    setConnectionStatus('connecting');

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setConnectionStatus('connected');
      setWsConnecting(false);

      // 認証はJWTで行うため、WebSocket には token を送る。
      const authMessage = {
        type: 'auth',
        token: `Bearer ${token}`,
      }

      ws.send(JSON.stringify(authMessage))
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type) {
          if (data.type === 'auth_success') {
            // 認証成功の処理（ログなし）
          } else {
            handleGameMessage(data);
          }
        } else if (data.id && (data.player1 || data.player2)) {
          setGameSession(data);
          
          // ゲームが開始されたかチェック
          if (data.status === 'playing') {
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
        // エラーログを削除
      }
    };

    ws.onerror = (event) => {
      setConnectionStatus('disconnected');
      setWsConnecting(false);
    };

    ws.onclose = (event) => {
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
    if (!isInitialized || hasJoined) {
      return;
    }

    const joinByPasscode = async () => {
      try {
        joinInProgress.current = true;
        setHasJoined(true);

        const deckId = 'guest';
        const response = await apiRequest(`/api/game/room/passcode/${passcode}/join`, {
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify({ deck_id: deckId }),
        })

        const data = await response.json();

        if (data.success) {
          if (data.user_id) {
            setTestUserId(data.user_id);
            setCurrentUserId(data.user_id);
          } else {
            setCurrentUserId(testUserId);
          }

          setTimeout(() => {
            startPolling();
          }, 1000);
        }
      } catch (error) {
        setHasJoined(false);
      } finally {
        joinInProgress.current = false;
      }
    };

    void joinByPasscode();
  }, [hasJoined, isInitialized, passcode, setCurrentUserId, startPolling, testUserId]);

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
          <h2>ルーム待機中</h2>
          <p><strong>合言葉:</strong> {passcode}</p>
          <p><strong>接続状態:</strong> {getConnectionStatusDisplay()}</p>
        </div>

        <div className="session-info" style={{ margin: '20px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '15px' }}>
              <img 
                src="https://github.com/github.png" 
                alt="GitHub" 
                style={{ width: '32px', height: '32px', marginRight: '15px' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 'bold', fontSize: '16px' }}>Player 1</span>
                <span style={{ fontSize: '14px', color: gameSession?.player1 ? '#4CAF50' : '#ff6b6b', marginTop: '4px' }}>
                  {gameSession?.player1 ? player1Name : '待機中...'}
                </span>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', padding: '15px' }}>
              <img 
                src="https://github.com/github.png" 
                alt="GitHub" 
                style={{ width: '32px', height: '32px', marginRight: '15px' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 'bold', fontSize: '16px' }}>Player 2</span>
                <span style={{ fontSize: '14px', color: gameSession?.player2 ? '#4CAF50' : '#ff6b6b', marginTop: '4px' }}>
                  {gameSession?.player2 ? player2Name : '待機中...'}
                </span>
              </div>
            </div>
          </div>
          
          <div style={{ textAlign: 'center', padding: '15px' }}>
            <strong>ゲーム状態:</strong> 
            <span style={{ marginLeft: '8px', color: gameSession?.status === 'waiting' ? '#ffd700' : '#4CAF50' }}>
              {gameSession?.status === 'waiting' ? '待機中' : gameSession?.status || '不明'}
            </span>
          </div>
        </div>

        {getPlayerCount() < 2 && (
          <div className="waiting-message">
            <h3>相手を待っています...</h3>
            <p>同じ合言葉「{passcode}」を入力した相手が参加するまでお待ちください。</p>
            <div className="spinner"></div>
            
            {!isPolling && (
              <button 
                onClick={() => {
                  fetchGameSession();
                }}
                style={{ 
                  marginTop: '15px',
                  backgroundColor: 'white', 
                  color: 'black', 
                  padding: '8px 16px', 
                  border: '1px solid #ccc', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                セッション情報を更新
              </button>
            )}
          </div>
        )}

        {getPlayerCount() === 2 && gameSession?.status === 'waiting' && (
          <div className="connection-controls" style={{ marginTop: '20px', textAlign: 'center' }}>
            {connectionStatus === 'disconnected' && (
              <button 
                onClick={() => {
                  connectWebSocket();
                }} 
                style={{ 
                  backgroundColor: '#4CAF50', 
                  color: 'white', 
                  padding: '15px 30px', 
                  border: 'none', 
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                }}
              >
                準備完了
              </button>
            )}
            
            {connectionStatus === 'connecting' && (
              <div style={{ padding: '15px 30px' }}>
                <div style={{ color: '#ffaa00', fontSize: '18px', fontWeight: 'bold' }}>
                  接続中...
                </div>
              </div>
            )}
            
            {connectionStatus === 'connected' && (
              <div style={{ padding: '15px 30px' }}>
                <div style={{ color: '#4CAF50', fontSize: '18px', fontWeight: 'bold' }}>
                  準備完了
                </div>
                <div style={{ fontSize: '14px', color: '#ccc', marginTop: '5px' }}>
                  ゲーム開始をお待ちください
                </div>
              </div>
            )}
          </div>
        )}

        <div className="controls">
          <button onClick={onReturnToEntry} className="back-button">
            戻る
          </button>
          <button 
            onClick={async () => {
              const confirmDelete = window.confirm(`セッション「${passcode}」を削除しますか？\n\n注意: 両方のプレイヤーが切断されます。`);
              if (confirmDelete) {
                try {
                  const response = await apiRequest(`/api/game/room/passcode/${passcode}/delete`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                  });

                  if (response.ok) {
                    setConnectionStatus('disconnected');
                    onReturnToEntry();
                  }
                } catch (error) {
                  // エラーハンドリング（ログなし）
                }
              }
            }} 
            className="delete-button"
            style={{ 
              backgroundColor: 'white', 
              color: 'black', 
              margin: '0 10px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              padding: '8px 16px',
              cursor: 'pointer'
            }}
          >
            セッション削除
          </button>
          {connectionStatus === 'disconnected' && (
            <button 
              onClick={() => {
                connectWebSocket();
              }} 
              className="reconnect-button"
              style={{ 
                backgroundColor: 'white', 
                color: 'black', 
                border: '1px solid #ccc',
                borderRadius: '4px',
                padding: '8px 16px',
                cursor: 'pointer'
              }}
            >
              再接続
            </button>
          )}
        </div>

        {/* ログセクションを非表示 */}
        {/* 
        <div className="logs-section">
          <h4>📋 ログ</h4>
          <div className="logs">
            {logs.map((log, index) => (
              <div key={index} className="log-entry">{log}</div>
            ))}
          </div>
        </div>
        */}
      </div>
    </div>
  );
} 