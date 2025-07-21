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
    score_data?: { [key: string]: number };
  };
  next_piece?: {
    type: number;
    score_data?: { [key: string]: number };
  };
  held_piece?: {
    type: number;
    score_data?: { [key: string]: number };
  };
  contribution_scores?: { [key: string]: number };
  current_piece_scores?: { [key: string]: number };
}

export interface GameResult {
  winner: string | null;
  player1_score: number;
  player2_score: number;
  reason: 'time_up' | 'game_over' | 'disconnect';
}

type GamePhase = 'passcode_entry' | 'waiting' | 'playing' | 'game_over';

export default function TetrisGame() {
  const [gamePhase, setGamePhase] = useState<GamePhase>('passcode_entry');
  const [passcode, setPasscode] = useState<string>('');
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const handlePasscodeSubmit = (inputPasscode: string) => {
    setPasscode(inputPasscode);
    setGamePhase('waiting');
  };

  const handleGameStart = () => {
    setGamePhase('playing');
  };

  const handleGameEnd = (result: GameResult) => {
    setGameResult(result);
    setGamePhase('game_over');
  };

  const handleReturnToEntry = () => {
    setGamePhase('passcode_entry');
    setPasscode('');
    setGameSession(null);
    setSocket(null);
    setConnectionStatus('disconnected');
    setGameResult(null);
    setCurrentUserId(null);
  };

  // WebSocketの自動切断処理
  useEffect(() => {
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [socket]);

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
            setCurrentUserId={setCurrentUserId}
          />
        );
      
      case 'playing':
        return (
          <TetrisGameRoom
            gameSession={gameSession}
            socket={socket}
            onGameEnd={handleGameEnd}
            setGameSession={setGameSession}
            currentUserId={currentUserId}
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