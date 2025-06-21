'use client';

import { GameResult, GameSession } from '../page';

interface GameOverScreenProps {
  gameResult: GameResult | null;
  gameSession: GameSession | null;
  onReturnToEntry: () => void;
}

export default function GameOverScreen({
  gameResult,
  gameSession,
  onReturnToEntry
}: GameOverScreenProps) {
  
  const getResultMessage = () => {
    if (!gameResult || !gameSession) return '結果を取得中...';

    const { winner, player1_score, player2_score, reason } = gameResult;

    if (reason === 'time_up') {
      if (winner) {
        return `⏰ 時間切れ！ ${winner} の勝利！`;
      } else {
        return `⏰ 時間切れ！ 引き分け！`;
      }
    } else if (reason === 'game_over') {
      if (winner) {
        return `🏆 ${winner} の勝利！`;
      } else {
        return `🏁 ゲーム終了`;
      }
    } else {
      return `🔌 接続が切断されました`;
    }
  };

  const getResultIcon = () => {
    if (!gameResult) return '🏁';

    const { reason } = gameResult;

    switch (reason) {
      case 'time_up':
        return '⏰';
      case 'game_over':
        return '🏆';
      case 'disconnect':
        return '🔌';
      default:
        return '🏁';
    }
  };

  const getWinnerDisplay = () => {
    if (!gameResult || !gameSession) return null;

    const { winner, player1_score, player2_score } = gameResult;
    const player1Name = gameSession.player1?.user_id || 'Player 1';
    const player2Name = gameSession.player2?.user_id || 'Player 2';

    return (
      <div className="match-summary">
        <div className={`player-result ${winner === player1Name ? 'winner' : ''}`}>
          <div className="player-name">{player1Name}</div>
          <div className="player-score">{player1_score.toLocaleString()} pts</div>
          {winner === player1Name && <div className="winner-badge">👑 勝者</div>}
        </div>
        
        <div className="vs-separator">VS</div>
        
        <div className={`player-result ${winner === player2Name ? 'winner' : ''}`}>
          <div className="player-name">{player2Name}</div>
          <div className="player-score">{player2_score.toLocaleString()} pts</div>
          {winner === player2Name && <div className="winner-badge">👑 勝者</div>}
        </div>
      </div>
    );
  };

  const getGameStats = () => {
    if (!gameSession) return null;

    return (
      <div className="game-stats">
        <h3>📊 ゲーム統計</h3>
        <div className="stats-grid">
          {gameSession.player1 && (
            <div className="stats-column">
              <h4>{gameSession.player1.user_id}</h4>
              <div className="stat-item">
                <span className="label">スコア:</span>
                <span className="value">{gameSession.player1.score.toLocaleString()}</span>
              </div>
              <div className="stat-item">
                <span className="label">レベル:</span>
                <span className="value">{gameSession.player1.level}</span>
              </div>
              <div className="stat-item">
                <span className="label">ライン消去:</span>
                <span className="value">{gameSession.player1.lines_cleared}</span>
              </div>
            </div>
          )}
          
          {gameSession.player2 && (
            <div className="stats-column">
              <h4>{gameSession.player2.user_id}</h4>
              <div className="stat-item">
                <span className="label">スコア:</span>
                <span className="value">{gameSession.player2.score.toLocaleString()}</span>
              </div>
              <div className="stat-item">
                <span className="label">レベル:</span>
                <span className="value">{gameSession.player2.level}</span>
              </div>
              <div className="stat-item">
                <span className="label">ライン消去:</span>
                <span className="value">{gameSession.player2.lines_cleared}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="game-over-screen">
      <div className="game-over-card">
        <div className="result-header">
          <div className="result-icon">{getResultIcon()}</div>
          <h2 className="result-title">ゲーム終了</h2>
          <p className="result-message">{getResultMessage()}</p>
        </div>

        {getWinnerDisplay()}
        
        {getGameStats()}

        <div className="game-over-actions">
          <button
            onClick={onReturnToEntry}
            className="return-button"
          >
            🏠 ホームに戻る
          </button>
          <button
            onClick={() => window.location.reload()}
            className="play-again-button"
          >
            🔄 もう一度プレイ
          </button>
        </div>

        <div className="sharing-section">
          <h4>📤 結果をシェア</h4>
          <div className="share-buttons">
            <button
              onClick={() => {
                const text = `GITRIS で対戦しました！\n${getResultMessage()}\n${gameResult?.player1_score || 0} vs ${gameResult?.player2_score || 0}`;
                navigator.clipboard.writeText(text);
                alert('クリップボードにコピーしました！');
              }}
              className="share-button"
            >
              📋 結果をコピー
            </button>
            <button
              onClick={() => {
                const url = window.location.href;
                navigator.clipboard.writeText(url);
                alert('URLをクリップボードにコピーしました！');
              }}
              className="share-button"
            >
              🔗 URLをコピー
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 