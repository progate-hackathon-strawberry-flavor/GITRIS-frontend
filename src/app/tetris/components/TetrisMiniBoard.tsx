'use client';

import { useMemo } from 'react';

interface TetrisMiniBoardProps {
  piece?: {
    type: number;
    scoreData?: { [key: string]: number };
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

// スコアに基づく色分けクラスを返す関数
function getScoreClass(score: number): string {
  let scoreClass = '';
  
  // スコアに応じて5段階の色分けクラスを返す
  if (score >= 100) scoreClass = 'score-very-high'; // 非常に高い貢献度 (100+)
  else if (score >= 50) scoreClass = 'score-high';       // 高い貢献度 (50-99)
  else if (score >= 20) scoreClass = 'score-medium';     // 中程度の貢献度 (20-49)
  else if (score >= 5) scoreClass = 'score-low';         // 低い貢献度 (5-19)
  else scoreClass = 'score-very-low';                    // 非常に低い貢献度 (0-4)
  
  // デバッグ用のコンソールログ（常に表示）

  
  return scoreClass;
}

export default function TetrisMiniBoard({ piece }: TetrisMiniBoardProps) {

  
  if (!piece) {

    return (
      <div className="tetris-mini-board mobile-mini-board">
        {Array(16).fill(null).map((_, index) => (
          <div key={index} className="mini-cell mobile-mini-cell" />
        ))}
      </div>
    );
  }



  const pieceData = pieceShapes[piece.type];
  if (!pieceData) {

    return (
      <div className="tetris-mini-board mobile-mini-board">
        {Array(16).fill(null).map((_, index) => (
          <div key={index} className="mini-cell mobile-mini-cell" />
        ))}
      </div>
    );
  }

  const shape = pieceData; // ミニボードは基本の形状のみ使用


  return (
    <div className="tetris-mini-board mobile-mini-board">
      {Array(16).fill(null).map((_, index) => {
        const row = Math.floor(index / 4);
        const col = index % 4;
        
        // このセルがピースの一部かどうかチェック
        const blockIndex = shape.findIndex(([x, y]) => x === col && y === row);
        const isBlock = blockIndex !== -1;
        
        let scoreClass = '';
        if (isBlock && piece.scoreData) {
          
          
          // 1. ブロックインデックスベースのキーを優先（最も一貫性がある）
          const blockIndexKey = `${blockIndex}`;
          let score = piece.scoreData[blockIndexKey];
          
          // 2. フォールバック: テトリミノの相対座標をキーとしてスコアを取得
          if (score === undefined) {
            const relativeKey = `${col}_${row}`;
            score = piece.scoreData[relativeKey];
            
          }
          
          
          
          if (score !== undefined && score >= 0) {
            scoreClass = getScoreClass(score);
                        }
        }
        
        const classNames = `
          mini-cell mobile-mini-cell
          ${isBlock ? `type-${piece.type}` : ''}
          ${scoreClass}
        `.trim();
        
        if (isBlock) {

        }
        
        return (
          <div
            key={index}
            className={classNames}
          />
        );
      })}
    </div>
  );
} 