'use client';

import { useState, useEffect, useCallback } from 'react';
import { GameSession, PlayerState, GameResult } from '../page';
import TetrisBoard from './TetrisBoard';
import TetrisMiniBoard from './TetrisMiniBoard';
import GameControls from './GameControls';
import { useUserDisplayName } from '@/hooks/useAuth';

interface TetrisGameRoomProps {
  gameSession: GameSession | null;
  socket: WebSocket | null;
  onGameEnd: (result: GameResult) => void;
  setGameSession: (session: GameSession) => void;
}

export default function TetrisGameRoom({
  gameSession,
  socket,
  onGameEnd,
  setGameSession
}: TetrisGameRoomProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [gameEnded, setGameEnded] = useState<boolean>(false);

  // ユーザー名を取得するフック
  const { displayName: player1Name } = useUserDisplayName(gameSession?.player1?.user_id || null);
  const { displayName: player2Name } = useUserDisplayName(gameSession?.player2?.user_id || null);

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

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [sendAction]);

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
      <div className="game-loading">
        <h2>ゲームデータを読み込み中...</h2>
      </div>
    );
  }

  return (
    <div className="tetris-game-room">
      <div className="game-header">
        <div className="game-status">
          <span className="status-label">状態:</span>
          <span className="status-value">{gameSession.status}</span>
        </div>
        {gameSession.time_limit && (
          <div className="time-info">
            <span className="time-label">制限時間:</span>
            <span className="time-value">{formatTime(gameSession.time_limit)}</span>
          </div>
        )}
        {gameSession.remaining_time !== undefined && (
          <div className="time-info">
            <span className="time-label">残り時間:</span>
            <span className={`time-value ${getTimeColor(gameSession.remaining_time)}`}>
              {formatTime(gameSession.remaining_time)}
            </span>
          </div>
        )}
      </div>

      <div className="game-content">
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

                <div className="mini-boards">
                  <div className="next-piece">
                    <h4>Next</h4>
                    <TetrisMiniBoard piece={gameSession.player1.next_piece} />
                  </div>
                  <div className="hold-piece">
                    <h4>Hold</h4>
                    <TetrisMiniBoard piece={gameSession.player1.held_piece} />
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

                <div className="mini-boards">
                  <div className="next-piece">
                    <h4>Next</h4>
                    <TetrisMiniBoard piece={gameSession.player2.next_piece} />
                  </div>
                  <div className="hold-piece">
                    <h4>Hold</h4>
                    <TetrisMiniBoard piece={gameSession.player2.held_piece} />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="game-sidebar">
          <GameControls onAction={sendAction} />
          
          <div className="control-help">
            <h4>🎮 操作方法</h4>
            <ul>
              <li>←→: 左右移動</li>
              <li>↑: ハードドロップ</li>
              <li>↓: ソフトドロップ</li>
              <li>Space: 回転</li>
              <li>C: ホールド</li>
            </ul>
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
    </div>
  );
} 