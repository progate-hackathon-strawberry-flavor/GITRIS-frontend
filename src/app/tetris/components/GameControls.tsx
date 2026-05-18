'use client';

interface GameControlsProps {
  onAction: (action: string) => void;
}

export default function GameControls({ onAction }: GameControlsProps) {
  return (
    <div className="game-controls mobile-game-controls">
      <div className="controls-grid mobile-controls-grid">
        <button
          className="control-button move-left mobile-control-btn"
          onClick={() => onAction('move_left')}
          title="左移動 (←)"
        >
          ⬅️
        </button>
        <button
          className="control-button rotate mobile-control-btn"
          onClick={() => onAction('rotate')}
          title="回転 (Space)"
        >
          🔄
        </button>
        <button
          className="control-button move-right mobile-control-btn"
          onClick={() => onAction('move_right')}
          title="右移動 (→)"
        >
          ➡️
        </button>
        <button
          className="control-button soft-drop mobile-control-btn"
          onClick={() => onAction('soft_drop')}
          title="ソフトドロップ (↓)"
        >
          ⬇️
        </button>
        <button
          className="control-button hard-drop mobile-control-btn"
          onClick={() => onAction('hard_drop')}
          title="ハードドロップ (↑)"
        >
          ⚡
        </button>
        <button
          className="control-button hold mobile-control-btn"
          onClick={() => onAction('hold')}
          title="ホールド (C)"
        >
          📦
        </button>
      </div>
    </div>
  );
} 