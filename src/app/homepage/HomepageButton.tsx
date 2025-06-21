'use client'; // クライアントコンポーネントであることを明示

import { useRouter } from 'next/navigation';
import React from 'react'; // Reactのインポートを追加

export default function HomepageButton() {
  const router = useRouter();

  // 配色ガイドラインからの色定義
  const mainGreenBright = '#56D364'; // メインの明るい緑
  const mainGreenDark = '#2DA042'; // メインの暗い緑 (ボタン)
  const textLight = '#F0F5FA'; // 背景/テキストの明るい色

  return (
    // ボタンを縦に並べるために flex-col を使用し、gap-4 で間隔を空ける
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => router.push('/game/single')} // 要件定義書のパスに合わせて修正
        style={{
          backgroundColor: mainGreenDark,
          color: textLight,
          border: 'none',
          padding: '15px 30px', // py-4 px-8 程度に相当
          fontSize: '1.5em', // text-lg 程度に相当
          cursor: 'pointer',
          borderRadius: '8px', // rounded-md 程度に相当
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '250px', // 幅を固定
          boxShadow: `0px 4px 8px rgba(0, 0, 0, 0.3)`, // 影を追加
          transition: 'background-color 0.3s ease', // ホバーアニメーション
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = mainGreenBright)
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = mainGreenDark)
        }
      >
        <span style={{ marginRight: '10px' }}>▶️</span> ゲームプレイ{' '}
        {/* テキストを要件定義書に合わせる  */}
      </button>
      <button
        type="button"
        onClick={() => router.push('/deck')}
        style={{
          backgroundColor: mainGreenDark,
          color: textLight,
          border: 'none',
          padding: '15px 30px',
          fontSize: '1.5em',
          cursor: 'pointer',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '250px', // 幅を固定
          boxShadow: `0px 4px 8px rgba(0, 0, 0, 0.3)`, // 影を追加
          transition: 'background-color 0.3s ease', // ホバーアニメーション
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = mainGreenBright)
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = mainGreenDark)
        }
      >
        <span style={{ marginRight: '10px' }}>▶️</span> デッキ編成
      </button>
    </div>
  );
}
