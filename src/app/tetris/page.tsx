'use client';

import { useState, useEffect } from 'react';
import TetrisGameRoom from './components/TetrisGameRoom';
import PasscodeEntry from './components/PasscodeEntry';
import WaitingRoom from './components/WaitingRoom';
import GameOverScreen from './components/GameOverScreen';
import './styles/tetris.css';

export interface GameSession {
  id: string;
  status: 'waiting' | 'playing' | 'finished';
  player1?: PlayerState;
  player2?: PlayerState;
  time_limit?: number;
  remaining_time?: number;
}

export interface PlayerState {
  user_id: string;
  score: number;
  level: number;
  lines_cleared: number;
  is_game_over: boolean;
  board: number[][];
  current_piece?: {
    type: number;
    x: number;
    y: number;
    rotation: number;
  };
  next_piece?: {
    type: number;
  };
  held_piece?: {
    type: number;
  };
  contribution_scores?: { [key: string]: number };
  current_piece_scores?: { [key: string]: number };
}

export interface GameResult {
  winner?: string;
  player1_score: number;
  player2_score: number;
  reason: 'time_up' | 'game_over' | 'disconnect';
}

type GamePhase = 'passcode_entry' | 'waiting' | 'playing' | 'game_over';

export default function TetrisGame() {
  const [gamePhase, setGamePhase] = useState<GamePhase>('passcode_entry');
  const [passcode, setPasscode] = useState<string>('');
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

  useEffect(() => {
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [socket]);

  const handlePasscodeSubmit = (passcode: string) => {
    setPasscode(passcode);
    setGamePhase('waiting');
  };

  const handleGameStart = () => {
    setGamePhase('playing');
  };

  const handleGameEnd = (result: GameResult) => {
    setGameResult(result);
    setGamePhase('game_over');
    
    // ゲーム終了時にWebSocket接続を切断
    if (socket && socket.readyState === WebSocket.OPEN) {
      console.log('🔌 ゲーム終了時WebSocket切断');
      socket.close();
    }
    setConnectionStatus('disconnected');
  };

  const handleReturnToEntry = () => {
    setPasscode('');
    setGameSession(null);
    setGameResult(null);
    setGamePhase('passcode_entry');
    if (socket) {
      socket.close();
      setSocket(null);
    }
    setConnectionStatus('disconnected');
  };

  const renderCurrentPhase = () => {
    switch (gamePhase) {
      case 'passcode_entry':
        return (
          <PasscodeEntry
            onPasscodeSubmit={handlePasscodeSubmit}
          />
        );
      
      case 'waiting':
        return (
          <WaitingRoom
            passcode={passcode}
            gameSession={gameSession}
            connectionStatus={connectionStatus}
            onGameStart={handleGameStart}
            onReturnToEntry={handleReturnToEntry}
            setGameSession={setGameSession}
            setSocket={setSocket}
            setConnectionStatus={setConnectionStatus}
          />
        );
      
      case 'playing':
        return (
          <TetrisGameRoom
            gameSession={gameSession}
            socket={socket}
            onGameEnd={handleGameEnd}
            setGameSession={setGameSession}
          />
        );
      
      case 'game_over':
        return (
          <GameOverScreen
            gameResult={gameResult}
            gameSession={gameSession}
            onReturnToEntry={handleReturnToEntry}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="tetris-app">
      <div className="tetris-container">
        {renderCurrentPhase()}
      </div>
    </div>
  );
} 