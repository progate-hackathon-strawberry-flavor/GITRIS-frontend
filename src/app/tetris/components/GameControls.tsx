'use client';

interface GameControlsProps {
  onAction: (action: string) => void;
}

export default function GameControls({ onAction }: GameControlsProps) {
  return (
    <div className="game-controls">
      <h4>🎮 ゲーム操作</h4>
      <div className="controls-grid">
        <button
          className="control-button move-left"
          onClick={() => onAction('move_left')}
          title="左移動 (←)"
        >
          ⬅️ 左
        </button>
        <button
          className="control-button move-right"
          onClick={() => onAction('move_right')}
          title="右移動 (→)"
        >
          ➡️ 右
        </button>
        <button
          className="control-button rotate"
          onClick={() => onAction('rotate')}
          title="回転 (Space)"
        >
          🔄 回転
        </button>
        <button
          className="control-button soft-drop"
          onClick={() => onAction('soft_drop')}
          title="ソフトドロップ (↓)"
        >
          ⬇️ ソフト
        </button>
        <button
          className="control-button hard-drop"
          onClick={() => onAction('hard_drop')}
          title="ハードドロップ (↑)"
        >
          ⚡ ハード
        </button>
        <button
          className="control-button hold"
          onClick={() => onAction('hold')}
          title="ホールド (C)"
        >
          📦 ホールド
        </button>
      </div>
    </div>
  );
} 