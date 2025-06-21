'use client';

import { useMemo } from 'react';

interface TetrisMiniBoardProps {
  piece?: {
    type: number;
  } | null;
}

const MINI_BOARD_SIZE = 4;

// テトリミノの形状データ（ミニボードは0度回転のみ）
const pieceShapes: { [key: number]: number[][] } = {
  0: [[0, 1], [1, 1], [2, 1], [3, 1]], // TypeI (横)
  1: [[0, 0], [1, 0], [0, 1], [1, 1]], // TypeO
  2: [[1, 0], [0, 1], [1, 1], [2, 1]], // TypeT
  3: [[1, 0], [2, 0], [0, 1], [1, 1]], // TypeS
  4: [[0, 0], [1, 0], [1, 1], [2, 1]], // TypeZ
  5: [[0, 0], [0, 1], [1, 1], [2, 1]], // TypeJ
  6: [[2, 0], [0, 1], [1, 1], [2, 1]], // TypeL
};

export default function TetrisMiniBoard({ piece }: TetrisMiniBoardProps) {
  const miniBoard = useMemo(() => {
    // 4x4の空のボードを作成
    const board: Array<Array<{
      type: number;
      hasBlock: boolean;
    }>> = Array(MINI_BOARD_SIZE).fill(null).map(() =>
      Array(MINI_BOARD_SIZE).fill(null).map(() => ({
        type: 0,
        hasBlock: false
      }))
    );

    // ピースがある場合は描画
    if (piece && typeof piece.type === 'number') {
      const pieceBlocks = pieceShapes[piece.type];
      
      if (pieceBlocks && pieceBlocks.length > 0) {
        // ピースを中央寄せするためのオフセット計算
        const minX = Math.min(...pieceBlocks.map(b => b[0]));
        const minY = Math.min(...pieceBlocks.map(b => b[1]));
        const maxX = Math.max(...pieceBlocks.map(b => b[0]));
        const maxY = Math.max(...pieceBlocks.map(b => b[1]));
        
        const pieceWidth = maxX - minX + 1;
        const pieceHeight = maxY - minY + 1;
        const offsetX = Math.floor((MINI_BOARD_SIZE - pieceWidth) / 2) - minX;
        const offsetY = Math.floor((MINI_BOARD_SIZE - pieceHeight) / 2) - minY;
        
        for (const block of pieceBlocks) {
          const row = block[1] + offsetY;
          const col = block[0] + offsetX;
          
          if (row >= 0 && row < MINI_BOARD_SIZE && col >= 0 && col < MINI_BOARD_SIZE) {
            board[row][col].type = piece.type;
            board[row][col].hasBlock = true;
          }
        }
      }
    }

    return board;
  }, [piece]);

  return (
    <div className="tetris-mini-board">
      {miniBoard.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            className={`
              mini-cell
              ${cell.hasBlock ? `type-${cell.type}` : ''}
            `}
          />
        ))
      )}
    </div>
  );
} 