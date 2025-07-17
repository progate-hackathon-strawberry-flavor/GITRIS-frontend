'use client';

import { useMemo } from 'react';

interface TetrisBoardProps {
  board: number[][];
  currentPiece?: {
    type: number;
    x: number;
    y: number;
    rotation: number;
    score_data?: { [key: string]: number };
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
  console.log(`[getScoreClass] スコア: ${score} → クラス: ${scoreClass}`);
  
  return scoreClass;
}

export default function TetrisBoard({
  board,
  currentPiece,
  contributionScores,
  currentPieceScores
}: TetrisBoardProps) {
  
  // デバッグ用：スコアデータを確認（常に表示）
  console.log('=== TetrisBoard デバッグ（詳細版） ===');
  console.log('contributionScores全体:', contributionScores);
  console.log('contributionScoresのキー数:', contributionScores ? Object.keys(contributionScores).length : 0);
  if (contributionScores) {
    console.log('contributionScoresのサンプルキー:', Object.keys(contributionScores).slice(0, 5));
    console.log('contributionScoresのサンプル値:', Object.entries(contributionScores).slice(0, 5));
  }
  console.log('現在ピース:', currentPiece);
  console.log('現在ピースのスコアデータ:', currentPiece?.score_data);
  
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

    console.log('ボードデータ処理開始...');

    // 1. 既存のボードデータを適用（配置済みブロック）
    if (board && Array.isArray(board)) {
      console.log('配置済みブロック処理開始...');
      for (let row = 0; row < Math.min(BOARD_HEIGHT, board.length); row++) {
        if (Array.isArray(board[row])) {
          for (let col = 0; col < Math.min(BOARD_WIDTH, board[row].length); col++) {
            const cellValue = board[row][col];
            if (cellValue && cellValue > 0) {
              boardCopy[row][col].type = cellValue - 1; // BlockType (1-7) を PieceType (0-6) に変換
              boardCopy[row][col].isEmpty = false;
              
              // 配置済みブロックのスコア情報を取得 - 複数の可能性をテスト
              const possibleKeys = [
                `${row}_${col}`,     // "row_col" 形式
                `${col}_${row}`,     // "col_row" 形式  
                `${row},${col}`,     // "row,col" 形式
                `${col},${row}`,     // "col,row" 形式
                `${row}-${col}`,     // "row-col" 形式
                `${col}-${row}`      // "col-row" 形式
              ];
              
              let score: number | undefined;
              let usedKey = '';
              
              for (const key of possibleKeys) {
                if (contributionScores && contributionScores[key] !== undefined) {
                  score = contributionScores[key];
                  usedKey = key;
                  break;
                }
              }
              
              if (score !== undefined && score >= 0) {
                boardCopy[row][col].scoreClass = getScoreClass(score);
                console.log(`配置済み[${row},${col}]: type=${cellValue-1}, score=${score}, scoreClass="${boardCopy[row][col].scoreClass}", キー="${usedKey}"`);
              } else {
                console.log(`配置済み[${row},${col}]: type=${cellValue-1}, スコアが見つからない。試したキー:`, possibleKeys);
              }
            }
          }
        }
      }
    }

    // 2. 現在のピースを描画（落下中のピース）
    if (currentPiece && 
        typeof currentPiece.x === 'number' && 
        typeof currentPiece.y === 'number' && 
        typeof currentPiece.type === 'number') {
      
      console.log('現在ピース処理開始...', currentPiece);
      const pieceBlocks = getPieceBlocks(currentPiece.type, currentPiece.rotation || 0);
      console.log('ピースブロック相対座標:', pieceBlocks);
      console.log('現在ピースのスコアデータ:', currentPiece.score_data);
      
      for (let blockIndex = 0; blockIndex < pieceBlocks.length; blockIndex++) {
        const block = pieceBlocks[blockIndex];
        const boardRow = currentPiece.y + block[1];
        const boardCol = currentPiece.x + block[0];
        
        if (boardRow >= 0 && boardRow < BOARD_HEIGHT && boardCol >= 0 && boardCol < BOARD_WIDTH) {
          boardCopy[boardRow][boardCol].type = currentPiece.type; // PieceType (0-6) をそのまま使用
          boardCopy[boardRow][boardCol].isCurrent = true;
          boardCopy[boardRow][boardCol].isEmpty = false;
          
          console.log(`現在ピース処理[${boardRow},${boardCol}]: ブロック${blockIndex}, type=${currentPiece.type}, 相対座標=(${block[0]},${block[1]})`);
          
          // 現在のピースの各マス目のスコアを適用
          // ブロックインデックスを基準にスコアを取得（回転に関係なく一貫性を保つ）
          let score: number | undefined;
          
          if (currentPiece.score_data) {
            // 1. ブロックインデックスベースのキーを優先（最も一貫性がある）
            const blockIndexKey = `${blockIndex}`;
            score = currentPiece.score_data[blockIndexKey];
            
            if (score !== undefined) {
              console.log(`✓ ブロック${blockIndex}スコア取得成功: インデックスキー="${blockIndexKey}", score=${score}`);
            }
            
            // 2. フォールバック: 現在の回転状態での相対座標キー
            if (score === undefined) {
              const relativeKey = `${block[0]}_${block[1]}`;
              score = currentPiece.score_data[relativeKey];
              if (score !== undefined) {
                console.log(`✓ ブロック${blockIndex}スコア取得成功: 相対座標キー="${relativeKey}", score=${score}`);
              }
            }
            
            // 3. フォールバック: 回転状態別キー
            if (score === undefined) {
              const rotationKey = `rot_${currentPiece.rotation || 0}_${block[0]}_${block[1]}`;
              score = currentPiece.score_data[rotationKey];
              if (score !== undefined) {
                console.log(`✓ ブロック${blockIndex}スコア取得成功: 回転キー="${rotationKey}", score=${score}`);
              }
            }
            
            // デバッグ: スコアが見つからない場合
            if (score === undefined) {
              console.log(`❌ ブロック${blockIndex}スコア取得失敗: 利用可能キー=`, Object.keys(currentPiece.score_data));
            }
          }
          
          // フォールバック: currentPieceScoresから取得（古い実装との互換性）
          if (score === undefined && currentPieceScores) {
            const boardPosKey = `${boardRow}_${boardCol}`;
            const blockIndexKey = `${blockIndex}`;
            score = currentPieceScores[blockIndexKey] || currentPieceScores[boardPosKey];
            
            if (score !== undefined) {
              console.log(`✓ ブロック${blockIndex}スコア取得成功: フォールバック, score=${score}`);
            }
          }
          
          if (score !== undefined && score >= 0) {
            boardCopy[boardRow][boardCol].scoreClass = getScoreClass(score);
            console.log(`🎨 現在ピース[${boardRow},${boardCol}]: ブロック${blockIndex}, score=${score}, class="${boardCopy[boardRow][boardCol].scoreClass}"`);
          } else {
            console.log(`⚠️ 現在ピース[${boardRow},${boardCol}]: ブロック${blockIndex}, スコアが見つからない`);
          }
        }
      }
    }

    console.log('ボードデータ処理完了');
    return boardCopy;
  }, [board, currentPiece, contributionScores, currentPieceScores]);

  return (
    <div className="tetris-board mobile-tetris-board">
      {boardWithCurrentPiece.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          // セルのクラス名を構築
          const classNames = `
              cell mobile-cell
              ${!cell.isEmpty ? `type-${cell.type}` : ''}
              ${cell.isCurrent ? 'current' : ''}
              ${cell.scoreClass}
            `.trim();
          
          // すべてのセルの情報をログ出力（重要なもののみ）
          if (!cell.isEmpty) {
            console.log(`[TetrisBoard] Cell[${rowIndex},${colIndex}]: type=${cell.type}, scoreClass="${cell.scoreClass}", isCurrent=${cell.isCurrent}, classes="${classNames}"`);
          }
          
          return (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={classNames}
            />
          );
        })
      )}
    </div>
  );
} 