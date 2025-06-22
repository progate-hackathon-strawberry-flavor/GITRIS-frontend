'use client';

import { useMemo } from 'react';

interface TetrisBoardProps {
  board: number[][];
  currentPiece?: {
    type: number;
    x: number;
    y: number;
    rotation: number;
  };
  contributionScores?: { [key: string]: number };
  currentPieceScores?: { [key: string]: number };
}

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

// テトリミノの形状データ
const pieceShapes: { [key: number]: number[][][] } = {
  0: [ // TypeI
    [[0, 1], [1, 1], [2, 1], [3, 1]], // 0度 (横)
    [[2, 0], [2, 1], [2, 2], [2, 3]], // 90度 (縦)
    [[0, 2], [1, 2], [2, 2], [3, 2]], // 180度 (横)
    [[1, 0], [1, 1], [1, 2], [1, 3]], // 270度 (縦)
  ],
  1: [ // TypeO
    [[0, 0], [1, 0], [0, 1], [1, 1]], // 全ての回転で同じ
  ],
  2: [ // TypeT
    [[1, 0], [0, 1], [1, 1], [2, 1]], // 0度
    [[1, 0], [1, 1], [2, 1], [1, 2]], // 90度
    [[0, 1], [1, 1], [2, 1], [1, 2]], // 180度
    [[0, 1], [1, 0], [1, 1], [1, 2]], // 270度
  ],
  3: [ // TypeS
    [[1, 0], [2, 0], [0, 1], [1, 1]], // 0度
    [[1, 0], [1, 1], [2, 1], [2, 2]], // 90度
    [[1, 1], [2, 1], [0, 2], [1, 2]], // 180度
    [[0, 0], [0, 1], [1, 1], [1, 2]], // 270度
  ],
  4: [ // TypeZ
    [[0, 0], [1, 0], [1, 1], [2, 1]], // 0度
    [[2, 0], [1, 1], [2, 1], [1, 2]], // 90度
    [[0, 1], [1, 1], [1, 2], [2, 2]], // 180度
    [[1, 0], [0, 1], [1, 1], [0, 2]], // 270度
  ],
  5: [ // TypeJ
    [[0, 0], [0, 1], [1, 1], [2, 1]], // 0度
    [[1, 0], [2, 0], [1, 1], [1, 2]], // 90度
    [[0, 1], [1, 1], [2, 1], [2, 2]], // 180度
    [[1, 0], [1, 1], [0, 2], [1, 2]], // 270度
  ],
  6: [ // TypeL
    [[2, 0], [0, 1], [1, 1], [2, 1]], // 0度
    [[1, 0], [1, 1], [1, 2], [2, 2]], // 90度
    [[0, 1], [1, 1], [2, 1], [0, 2]], // 180度
    [[0, 0], [1, 0], [1, 1], [1, 2]], // 270度
  ],
};

// テトリミノの形状を取得する関数
function getPieceBlocks(pieceType: number, rotation: number): number[][] {
  const shapes = pieceShapes[pieceType];
  if (!shapes) return [];

  // Oミノは回転しない
  if (pieceType === 1) {
    return shapes[0];
  }

  const rotIdx = Math.floor((rotation || 0) / 90) % 4;
  return shapes[rotIdx] || shapes[0];
}

// スコアに応じた色クラスを取得する関数
function getScoreClass(score: number): string {
  if (score >= 400) return 'score-very-high';
  if (score >= 300) return 'score-high';
  if (score >= 200) return 'score-medium';
  return 'score-low';
}

export default function TetrisBoard({
  board,
  currentPiece,
  contributionScores,
  currentPieceScores
}: TetrisBoardProps) {
  
  const boardWithCurrentPiece = useMemo(() => {
    // ボードデータのコピーを作成
    const boardCopy: Array<Array<{
      type: number;
      isCurrent: boolean;
      scoreClass: string;
      isEmpty: boolean;
    }>> = Array(BOARD_HEIGHT).fill(null).map(() =>
      Array(BOARD_WIDTH).fill(null).map(() => ({
        type: 0,
        isCurrent: false,
        scoreClass: '',
        isEmpty: true
      }))
    );

    // 既存のボードデータを適用
    if (board && Array.isArray(board)) {
      for (let row = 0; row < Math.min(BOARD_HEIGHT, board.length); row++) {
        if (Array.isArray(board[row])) {
          for (let col = 0; col < Math.min(BOARD_WIDTH, board[row].length); col++) {
            const cellValue = board[row][col];
            if (cellValue && cellValue > 0) {
              boardCopy[row][col].type = cellValue - 1; // BlockType (1-7) を PieceType (0-6) に変換
              boardCopy[row][col].isEmpty = false;
              
              // スコアベースの色分けを適用
              if (contributionScores) {
                const scoreKey = `${row}_${col}`;
                const score = contributionScores[scoreKey];
                if (score !== undefined) {
                  boardCopy[row][col].scoreClass = getScoreClass(score);
                }
              }
            }
          }
        }
      }
    }

    // 現在のピースを描画
    if (currentPiece && typeof currentPiece.x === 'number' && typeof currentPiece.y === 'number' && typeof currentPiece.type === 'number') {
      const pieceBlocks = getPieceBlocks(currentPiece.type, currentPiece.rotation || 0);
      
      for (const block of pieceBlocks) {
        const boardRow = currentPiece.y + block[1];
        const boardCol = currentPiece.x + block[0];
        
        if (boardRow >= 0 && boardRow < BOARD_HEIGHT && boardCol >= 0 && boardCol < BOARD_WIDTH) {
          boardCopy[boardRow][boardCol].type = currentPiece.type; // PieceType (0-6) をそのまま使用
          boardCopy[boardRow][boardCol].isCurrent = true;
          boardCopy[boardRow][boardCol].isEmpty = false;
          
          // 現在のピースには専用のスコアデータを使用
          if (currentPieceScores) {
            const scoreKey = `${boardRow}_${boardCol}`;
            const score = currentPieceScores[scoreKey];
            if (score !== undefined) {
              boardCopy[boardRow][boardCol].scoreClass = getScoreClass(score);
            }
          } else if (contributionScores) {
            // フォールバック: 従来のcontributionScoresを使用
            const scoreKey = `${boardRow}_${boardCol}`;
            const score = contributionScores[scoreKey];
            if (score !== undefined) {
              boardCopy[boardRow][boardCol].scoreClass = getScoreClass(score);
            }
          }
        }
      }
    }

    return boardCopy;
  }, [board, currentPiece, contributionScores, currentPieceScores]);

  return (
    <div className="tetris-board">
      {boardWithCurrentPiece.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            className={`
              cell
              ${!cell.isEmpty ? `type-${cell.type}` : ''}
              ${cell.isCurrent ? 'current' : ''}
              ${cell.scoreClass}
            `}
          />
        ))
      )}
    </div>
  );
} 