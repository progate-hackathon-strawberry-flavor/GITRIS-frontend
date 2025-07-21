'use client';

import { useState, useEffect, useCallback } from 'react';
import { GameSession, PlayerState, GameResult } from '../page';
import TetrisBoard from './TetrisBoard';
import TetrisMiniBoard from './TetrisMiniBoard';
import GameControls from './GameControls';
import { useUserDisplayName, useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';

interface TetrisGameRoomProps {
  gameSession: GameSession | null;
  socket: WebSocket | null;
  onGameEnd: (result: GameResult) => void;
  setGameSession: (session: GameSession) => void;
  currentUserId: string | null;
}

export default function TetrisGameRoom({
  gameSession,
  socket,
  onGameEnd,
  setGameSession,
  currentUserId
}: TetrisGameRoomProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [gameEnded, setGameEnded] = useState<boolean>(false);

  // タッチ関連の状態
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; time: number } | null>(null);
  const [isLongPress, setIsLongPress] = useState<boolean>(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

  // 認証情報を取得
  const { user } = useAuth();

  // プレイヤーの役割を判定（デバッグ情報付き）
  const isPlayer1 = currentUserId === gameSession?.player1?.user_id;
  const isPlayer2 = currentUserId === gameSession?.player2?.user_id;

  // デバッグ: 判定結果をログ出力
  useEffect(() => {
    if (gameSession && currentUserId) {
      console.log('[TetrisGameRoom] プレイヤー判定:', {
        currentUserId,
        player1_id: gameSession?.player1?.user_id,
        player2_id: gameSession?.player2?.user_id,
        isPlayer1,
        isPlayer2
      });
    }
  }, [currentUserId, gameSession?.player1?.user_id, gameSession?.player2?.user_id, isPlayer1, isPlayer2]);

  // 自分と相手のデータを判定
  const myPlayerState = isPlayer1 ? gameSession?.player1 : isPlayer2 ? gameSession?.player2 : null;
  const opponentPlayerState = isPlayer1 ? gameSession?.player2 : isPlayer2 ? gameSession?.player1 : null;

  // プレイヤー名を取得
  const { displayName: player1Name } = useUserDisplayName(gameSession?.player1?.user_id || null);
  const { displayName: player2Name } = useUserDisplayName(gameSession?.player2?.user_id || null);
  
  // 自分と相手の名前を判定
  const myPlayerName = isPlayer1 ? player1Name : isPlayer2 ? player2Name : 'Unknown';
  const opponentPlayerName = isPlayer1 ? player2Name : isPlayer2 ? player1Name : 'Unknown';

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-19), `[${timestamp}] ${message}`]);
  };

  const sendAction = useCallback((action: string) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      addLog('WebSocketが接続されていません');
      return;
    }

    const message = {
      action: action
    };

    socket.send(JSON.stringify(message));
    addLog(`送信: ${action}`);
  }, [socket]);

  // タッチ操作ハンドラー
  const handleTouchStart = useCallback((e: TouchEvent) => {
    e.preventDefault(); // スクロールを防ぐ
    
    const touch = e.touches[0];
    const startTime = Date.now();
    
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY,
      time: startTime
    });
    
    setIsLongPress(false);
    
    // 長押し検出用のタイマー（500ms）
    const timer = setTimeout(() => {
      setIsLongPress(true);
      sendAction('hold'); // ホールド操作
      addLog('📱 長押し: ホールド');
    }, 500);
    
    setLongPressTimer(timer);
  }, [sendAction]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    e.preventDefault();
    
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    if (!touchStart) return;
    
    const touch = e.changedTouches[0];
    const endTime = Date.now();
    const duration = endTime - touchStart.time;
    
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    
    // フリック検出の閾値
    const minSwipeDistance = 50; // 最小スワイプ距離
    const maxTapDuration = 300; // タップとみなす最大時間
    
    // 長押しだった場合は他の操作を実行しない
    if (isLongPress) {
      setTouchStart(null);
      return;
    }
    
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    
    // フリック操作の判定
    if (absX > minSwipeDistance || absY > minSwipeDistance) {
      if (absX > absY) {
        // 水平方向のフリック
        if (deltaX > 0) {
          sendAction('move_right'); // 右フリック
          addLog('📱 右フリック: 右移動');
        } else {
          sendAction('move_left'); // 左フリック
          addLog('📱 左フリック: 左移動');
        }
      } else {
        // 垂直方向のフリック
        if (deltaY < 0) {
          sendAction('hard_drop'); // 上フリック
          addLog('📱 上フリック: ハードドロップ');
        } else {
          sendAction('soft_drop'); // 下フリック
          addLog('📱 下フリック: ソフトドロップ');
        }
      }
    } else if (duration < maxTapDuration) {
      // タップ操作
      sendAction('rotate'); // 回転
      addLog('📱 タップ: 回転');
    }
    
    setTouchStart(null);
  }, [touchStart, isLongPress, longPressTimer, sendAction]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault(); // スクロールを防ぐ
  }, []);

  useEffect(() => {
    if (!socket) return;
    
    // WebSocket接続状態を確認
    if (socket.readyState !== WebSocket.OPEN) {
      addLog(`⚠️ WebSocket接続状態異常: ${socket.readyState} (0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED)`);
      
      // 接続中の場合は待機
      if (socket.readyState === WebSocket.CONNECTING) {
        addLog('🔄 WebSocket接続中... 少し待機します');
        
        const waitForConnection = () => {
          if (socket.readyState === WebSocket.OPEN) {
            addLog('✅ WebSocket接続完了、ゲーム処理を開始します');
          } else if (socket.readyState === WebSocket.CLOSED || socket.readyState === WebSocket.CLOSING) {
            addLog('❌ WebSocket接続に失敗しました');
          } else {
            // まだ接続中の場合は再度チェック
            setTimeout(waitForConnection, 100);
          }
        };
        
        setTimeout(waitForConnection, 100);
      }
    } else {
      addLog('✅ WebSocket接続確認済み、ゲーム処理を開始します');
    }

    const handleMessage = (event: MessageEvent) => {
      // ゲーム終了後はメッセージ処理を停止
      if (gameEnded) {
        addLog('🚫 ゲーム終了後のメッセージを無視');
        return;
      }
      
      try {
        const data = JSON.parse(event.data);
        
        if (data.type) {
          handleGameMessage(data);
        } else if (data.id && (data.player1 || data.player2)) {
          // ゲーム状態の変化をログ
          if (data.status !== gameSession?.status) {
            addLog(`🔄 ゲーム状態変更: ${gameSession?.status || 'unknown'} → ${data.status}`);
          }
          
          setGameSession(data);
          
          // ゲーム終了判定 - 複数の条件でチェック
          if (data.status === 'finished') {
            addLog('🚨 ゲーム終了ステータス検出！');
            handleGameFinished(data);
          } else if (data.player1 && data.player2 && 
                     data.player1.is_game_over && data.player2.is_game_over) {
            addLog('🚨 両プレイヤーゲームオーバー検出！');
            handleGameFinished(data);
          }
        }
      } catch (error) {
        addLog(`メッセージ解析エラー: ${error}`);
      }
    };

    const handleGameMessage = (data: any) => {
      switch(data.type) {
        case 'game_state':
          setGameSession(data);
          break;
        case 'error':
          addLog(`エラー: ${data.message}`);
          break;
        default:
          addLog(`未対応のメッセージタイプ: ${data.type}`);
      }
    };

    const handleGameFinished = (data: GameSession) => {
      addLog('🏁 ゲーム終了処理開始');
      addLog(`📊 Player1: ${data.player1?.is_game_over ? 'GAME OVER' : 'PLAYING'}, Score: ${data.player1?.score || 0}`);
      addLog(`📊 Player2: ${data.player2?.is_game_over ? 'GAME OVER' : 'PLAYING'}, Score: ${data.player2?.score || 0}`);
      addLog(`⏰ 残り時間: ${data.remaining_time || 0}秒`);
      
      let winner: string | undefined;
      let reason: 'time_up' | 'game_over' | 'disconnect' = 'game_over';

      if (data.player1 && data.player2) {
        if (data.player1.is_game_over && !data.player2.is_game_over) {
          winner = data.player2.user_id;
          addLog(`🏆 Player2 (${winner}) の勝利！ Player1がゲームオーバー`);
        } else if (!data.player1.is_game_over && data.player2.is_game_over) {
          winner = data.player1.user_id;
          addLog(`🏆 Player1 (${winner}) の勝利！ Player2がゲームオーバー`);
        } else if (data.remaining_time === 0) {
          reason = 'time_up';
          if (data.player1.score > data.player2.score) {
            winner = data.player1.user_id;
            addLog(`⏰ 時間切れ！ Player1 (${winner}) の勝利！`);
          } else if (data.player2.score > data.player1.score) {
            winner = data.player2.user_id;
            addLog(`⏰ 時間切れ！ Player2 (${winner}) の勝利！`);
          } else {
            addLog(`⏰ 時間切れ！ 引き分け！`);
          }
        } else if (data.player1.is_game_over && data.player2.is_game_over) {
          addLog(`🏁 両プレイヤーがゲームオーバー`);
        }
      }

      const result: GameResult = {
        winner,
        player1_score: data.player1?.score || 0,
        player2_score: data.player2?.score || 0,
        reason
      };

      addLog(`🎯 リザルト画面に遷移: 勝者=${winner || '引き分け'}, 理由=${reason}`);
      
      // ゲーム終了フラグを設定（これ以降のメッセージは無視）
      setGameEnded(true);
      
      // WebSocket接続を切断
      if (socket && socket.readyState === WebSocket.OPEN) {
        addLog('🔌 WebSocket接続を切断中...');
        socket.close();
      }
      
      try {
        onGameEnd(result);
        addLog('✅ リザルト画面への遷移が完了しました');
      } catch (error) {
        addLog(`❌ リザルト画面への遷移でエラー: ${error}`);
        console.error('Failed to transition to result screen:', error);
      }
    };

    const handleDisconnect = () => {
      addLog('🔌 WebSocket接続が切断されました');
      
      // ゲーム中または終了済みの場合はリザルト画面に遷移
      if (gameSession && (gameSession.status === 'playing' || gameSession.status === 'finished')) {
        addLog('🏁 WebSocket切断によりゲーム終了処理開始');
        
        // 両プレイヤーがゲームオーバーかどうかチェック
        const bothGameOver = gameSession.player1?.is_game_over && gameSession.player2?.is_game_over;
        
        let winner: string | undefined;
        let reason: 'time_up' | 'game_over' | 'disconnect' = 'disconnect';
        
        if (bothGameOver) {
          reason = 'game_over';
          // スコアで勝敗を決定
          if (gameSession.player1 && gameSession.player2) {
            if (gameSession.player1.score > gameSession.player2.score) {
              winner = gameSession.player1.user_id;
            } else if (gameSession.player2.score > gameSession.player1.score) {
              winner = gameSession.player2.user_id;
            }
          }
        }
        
        const result: GameResult = {
          winner,
          player1_score: gameSession.player1?.score || 0,
          player2_score: gameSession.player2?.score || 0,
          reason
        };
        
        addLog(`🎯 切断時リザルト: 勝者=${winner || '引き分け'}, 理由=${reason}`);
        
        // ゲーム終了フラグを設定
        setGameEnded(true);
        
        setTimeout(() => {
          try {
            onGameEnd(result);
            addLog('✅ 切断時のリザルト画面遷移完了');
          } catch (error) {
            addLog(`❌ 切断時のリザルト画面遷移でエラー: ${error}`);
          }
        }, 1000); // 1秒後にリザルト画面に遷移
      }
    };

    socket.addEventListener('message', handleMessage);
    socket.addEventListener('close', handleDisconnect);
    socket.addEventListener('error', handleDisconnect);

    return () => {
      socket.removeEventListener('message', handleMessage);
      socket.removeEventListener('close', handleDisconnect);
      socket.removeEventListener('error', handleDisconnect);
    };
  }, [socket, setGameSession, onGameEnd, gameSession, gameEnded]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!socket || socket.readyState !== WebSocket.OPEN) return;

      switch(event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          sendAction('move_left');
          break;
        case 'ArrowRight':
          event.preventDefault();
          sendAction('move_right');
          break;
        case 'ArrowDown':
          event.preventDefault();
          sendAction('soft_drop');
          break;
        case 'ArrowUp':
          event.preventDefault();
          sendAction('hard_drop');
          break;
        case ' ':
          event.preventDefault();
          sendAction('rotate');
          break;
        case 'c':
        case 'C':
          event.preventDefault();
          sendAction('hold');
          break;
      }
    };

    // キーボードイベントリスナー
    document.addEventListener('keydown', handleKeyDown);
    
    // タッチイベントリスナー（ゲームエリアに対して）
    const gameElement = document.querySelector('.tetris-game-room');
    if (gameElement) {
      gameElement.addEventListener('touchstart', handleTouchStart, { passive: false });
      gameElement.addEventListener('touchend', handleTouchEnd, { passive: false });
      gameElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      
      if (gameElement) {
        gameElement.removeEventListener('touchstart', handleTouchStart);
        gameElement.removeEventListener('touchend', handleTouchEnd);
        gameElement.removeEventListener('touchmove', handleTouchMove);
      }
      
      // タイマークリーンアップ
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [sendAction, handleTouchStart, handleTouchEnd, handleTouchMove, longPressTimer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = (remainingTime: number) => {
    if (remainingTime <= 3) return 'time-critical';
    if (remainingTime <= 10) return 'time-warning';
    return 'time-normal';
  };

  if (!gameSession) {
    return (
      <div className="game-loading mobile-game-loading">
        <h2>ゲームデータを読み込み中...</h2>
      </div>
    );
  }

  if (!currentUserId) {
    return (
      <div className="game-loading mobile-game-loading">
        <h2>ユーザー情報を読み込み中...</h2>
        <p>currentUserId: {String(currentUserId)}</p>
      </div>
    );
  }

  return (
    <div className="tetris-game-room mobile-responsive">
      <div className="game-header mobile-game-header">
        <div className="game-status mobile-game-status">
          <span className="status-label">状態:</span>
          <span className="status-value">{gameSession.status}</span>
        </div>
        {gameSession.time_limit && (
          <div className="time-info mobile-time-info">
            <span className="time-label">制限時間:</span>
            <span className="time-value">{formatTime(gameSession.time_limit)}</span>
          </div>
        )}
        {gameSession.remaining_time !== undefined && (
          <div className="time-info mobile-time-info">
            <span className="time-label">残り時間:</span>
            <span className={`time-value ${getTimeColor(gameSession.remaining_time)}`}>
              {formatTime(gameSession.remaining_time)}
            </span>
          </div>
        )}
      </div>

      <div className="game-content mobile-game-content">
        {/* PC版レイアウト */}
        <div className="pc-layout">
          {/* ゲームボードエリア */}
          <div className="game-boards">
            {/* Player 1 */}
            <div className="player-area player1">
              <div className="player-header">
                <h3>👤 Player 1</h3>
                <span className="player-name">
                  {player1Name}
                </span>
              </div>
              
              {gameSession.player1 && (
                <>
                  <TetrisBoard
                    board={gameSession.player1.board}
                    currentPiece={gameSession.player1.current_piece}
                    contributionScores={gameSession.player1.contribution_scores}
                    currentPieceScores={gameSession.player1.current_piece_scores}
                  />
                  
                  <div className="player-stats">
                    <div className="stat-item">
                      <span className="stat-label">スコア</span>
                      <span className="stat-value">{gameSession.player1.score}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">レベル</span>
                      <span className="stat-value">{gameSession.player1.level}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">ライン</span>
                      <span className="stat-value">{gameSession.player1.lines_cleared}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">状態</span>
                      <span className={`stat-value ${gameSession.player1.is_game_over ? 'game-over' : 'playing'}`}>
                        {gameSession.player1.is_game_over ? 'GAME OVER' : 'PLAYING'}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* 中央のミニボード（Hold/Next）と操作エリア */}
            <div className="center-mini-boards">
              {gameSession.player1 && gameSession.player2 && (
                <>
                  <div className="mini-boards-row">
                    <div className="player1-hold">
                      <h4>Player 1 Hold</h4>
                      <TetrisMiniBoard 
                        piece={gameSession.player1.held_piece ? {
                          type: gameSession.player1.held_piece.type,
                          scoreData: gameSession.player1.held_piece.score_data
                        } : null} 
                      />
                    </div>
                    <div className="player2-hold">
                      <h4>Player 2 Hold</h4>
                      <TetrisMiniBoard 
                        piece={gameSession.player2.held_piece ? {
                          type: gameSession.player2.held_piece.type,
                          scoreData: gameSession.player2.held_piece.score_data
                        } : null} 
                      />
                    </div>
                  </div>
                  <div className="mini-boards-row">
                    <div className="player1-next">
                      <h4>Player 1 Next</h4>
                      <TetrisMiniBoard 
                        piece={gameSession.player1.next_piece ? {
                          type: gameSession.player1.next_piece.type,
                          scoreData: gameSession.player1.next_piece.score_data
                        } : null} 
                      />
                    </div>
                    <div className="player2-next">
                      <h4>Player 2 Next</h4>
                      <TetrisMiniBoard 
                        piece={gameSession.player2.next_piece ? {
                          type: gameSession.player2.next_piece.type,
                          scoreData: gameSession.player2.next_piece.score_data
                        } : null} 
                      />
                    </div>
                  </div>
                  
                  {/* コンパクトな操作エリア */}
                  <div className="compact-controls">
                    <div className="control-buttons">
                      <GameControls onAction={sendAction} />
                    </div>
                    
                    <div className="control-help-compact">
                      <div className="control-section-compact">
                        <span className="control-title">⌨️ キー:</span>
                        <span className="control-text">←→移動 ↑ハード ↓ソフト Space回転 Cホールド</span>
                      </div>
                      <div className="control-section-compact">
                        <span className="control-title">📱 タッチ:</span>
                        <span className="control-text">フリック移動/ドロップ タップ回転 長押しホールド</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Player 2 */}
            <div className="player-area player2">
              <div className="player-header">
                <h3>👤 Player 2</h3>
                <span className="player-name">
                  {player2Name}
                </span>
              </div>
              
              {gameSession.player2 && (
                <>
                  <TetrisBoard
                    board={gameSession.player2.board}
                    currentPiece={gameSession.player2.current_piece}
                    contributionScores={gameSession.player2.contribution_scores}
                    currentPieceScores={gameSession.player2.current_piece_scores}
                  />
                  
                  <div className="player-stats">
                    <div className="stat-item">
                      <span className="stat-label">スコア</span>
                      <span className="stat-value">{gameSession.player2.score}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">レベル</span>
                      <span className="stat-value">{gameSession.player2.level}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">ライン</span>
                      <span className="stat-value">{gameSession.player2.lines_cleared}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">状態</span>
                      <span className={`stat-value ${gameSession.player2.is_game_over ? 'game-over' : 'playing'}`}>
                        {gameSession.player2.is_game_over ? 'GAME OVER' : 'PLAYING'}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* モバイル版テトリス風レイアウト */}
        <div className="mobile-tetris-layout">
          {/* 上部エリア (Hold, Next, スコア) - 自分のデータを表示 */}
          <div className="top-area">
            {/* Hold (左上) */}
            <div className="hold-area">
              <h4>HOLD</h4>
              {myPlayerState && (
                <TetrisMiniBoard 
                  piece={myPlayerState.held_piece ? {
                    type: myPlayerState.held_piece.type,
                    scoreData: myPlayerState.held_piece.score_data
                  } : null} 
                />
              )}
            </div>
            
            {/* 中央のスコアエリア - 自分のスコア */}
            <div className="score-area">
              {myPlayerState && (
                <div className="player-score">
                  <div className="score-label">SCORE</div>
                  <div className="score-value">{myPlayerState.score}</div>
                  <div className="level-lines">
                    <span>LEVEL {myPlayerState.level}</span>
                    <span>LINES {myPlayerState.lines_cleared}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Next (右上) */}
            <div className="next-area">
              <h4>NEXT</h4>
              {myPlayerState && (
                <TetrisMiniBoard 
                  piece={myPlayerState.next_piece ? {
                    type: myPlayerState.next_piece.type,
                    scoreData: myPlayerState.next_piece.score_data
                  } : null} 
                />
              )}
            </div>
          </div>

          {/* メインゲームエリア */}
          <div className="main-game-area">
            {/* 相手のボード (左側・小さく表示) */}
            <div className="opponent-area">
              {opponentPlayerState && (
                <>
                  <div className="opponent-header">
                    <h5>対戦相手</h5>
                    <span className="opponent-name">{opponentPlayerName}</span>
                  </div>
                  <TetrisBoard
                    board={opponentPlayerState.board}
                    currentPiece={opponentPlayerState.current_piece}
                    contributionScores={opponentPlayerState.contribution_scores}
                    currentPieceScores={opponentPlayerState.current_piece_scores}
                  />
                  <div className="opponent-stats">
                    <div>スコア: {opponentPlayerState.score}</div>
                    <div className={opponentPlayerState.is_game_over ? 'game-over' : 'playing'}>
                      {opponentPlayerState.is_game_over ? 'GAME OVER' : 'PLAYING'}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* メインプレイヤーのボード (中央・大きく表示) */}
            <div className="main-player-area">
              {myPlayerState && (
                <TetrisBoard
                  board={myPlayerState.board}
                  currentPiece={myPlayerState.current_piece}
                  contributionScores={myPlayerState.contribution_scores}
                  currentPieceScores={myPlayerState.current_piece_scores}
                />
              )}
            </div>

            {/* 左下の操作説明エリア */}
            <div className="control-help-area">
              <div className="control-help-mobile">
                <div className="help-section">
                  <span className="help-title">⌨️ キー操作</span>
                  <div className="help-text">
                    <div>←→ 移動</div>
                    <div>↑ ハードドロップ</div>
                    <div>↓ ソフトドロップ</div>
                    <div>Space 回転</div>
                    <div>C ホールド</div>
                  </div>
                </div>
                <div className="help-section">
                  <span className="help-title">📱 タッチ操作</span>
                  <div className="help-text">
                    <div>左右フリック 移動</div>
                    <div>上フリック ハード</div>
                    <div>下フリック ソフト</div>
                    <div>タップ 回転</div>
                    <div>長押し ホールド</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 操作エリア */}
          <div className="controls-area">
            {/* コントローラーボタンを削除 */}
          </div>
        </div>
      </div>
    </div>
  );
} 