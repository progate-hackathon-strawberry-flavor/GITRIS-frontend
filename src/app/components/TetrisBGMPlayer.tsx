'use client'; // このコンポーネントはクライアントコンポーネントです

import React, { useEffect, useRef, useState, useCallback } from 'react';

export default function TetrisBGMPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false); // 再生中かどうか
  const [hasTriedToPlay, setHasTriedToPlay] = useState(false); // 再生を一度試みたかどうか
  const [volume, setVolume] = useState(0.5); // ★追加★ 音量 (0.0から1.0)

  useEffect(() => {
    if (!audioRef.current) return;

    audioRef.current.volume = volume; // ★修正★ 初期音量を state から設定
    audioRef.current.loop = true; // ループ再生

    // コンポーネントがマウントされたらすぐに再生を試みる
    if (!hasTriedToPlay) {
      // 一度だけ自動再生を試みる
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true); // 再生が開始できたら状態を更新
          setHasTriedToPlay(true); // 再生を試みたことを記録
        })
        .catch((error) => {
          // 自動再生ポリシーなどにより再生がブロックされた場合
          console.log(
            '音楽の自動再生がブロックされました。ユーザー操作が必要です:',
            error
          );
          setIsPlaying(false); // 再生できていないので状態をfalseに
          setHasTriedToPlay(true); // 再生を試みたことを記録
          // この場合でもボタンは表示されるので、ユーザーが手動で再生可能
        });
    }

    // クリーンアップ関数
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [hasTriedToPlay]); // hasTriedToPlayが変化したときに実行 (初回のみ)

  // ★追加★ 音量スライダーの変更ハンドラ
  const handleVolumeChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newVolume = parseFloat(event.target.value);
      setVolume(newVolume);
      if (audioRef.current) {
        audioRef.current.volume = newVolume;
      }
    },
    []
  );

  // 音楽再生/停止ボタン切り替え
  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((error) => {
        console.log('音楽の再生に失敗しました:', error);
      });
    }
    setIsPlaying((prev) => !prev); // 再生状態を切り替える
  };

  // 音楽再生/停止ボタンのスタイル
  const playerBlockStyle = {
    backgroundColor: isPlaying ? '#dc2626' : '#2DA042', // 再生中は赤、停止中は暗い緑
    color: '#F0F5FA', // 背景/テキストの明るい色
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1.2em',
    position: 'fixed' as 'fixed', // 固定位置
    top: '20px', // ★変更点★ 上から20px
    left: '50%', // 左から50%
    transform: 'translateX(-50%)', // 中央揃え
    zIndex: 100, // 他のUIの上に表示
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',
    transition: 'background-color 0.3s ease',
    display: 'flex', // ★追加★ Flexboxで並べる
    alignItems: 'center', // ★追加★ 垂直方向中央揃え
    gap: '10px', // ★追加★ ボタンとスライダーの間隔
  };

  const hoverStyle = {
    backgroundColor: isPlaying ? '#ff4c4c' : '#56D364', // 再生中は明るい赤、停止中は明るい緑
  };

  // ★追加★ スライダーのスタイル
  const sliderStyle = {
    width: '80px', // スライダーの幅を調整
    appearance: 'none' as 'none', // デフォルトスタイルをリセット
    height: '8px',
    borderRadius: '4px',
    background: '#F0F5FA', // スライダーの背景色
    outline: 'none',
    opacity: 0.8,
    transition: 'opacity .2s',
  };

  // スライダーのつまみのスタイル (Webkit/Firefox)
  const thumbStyle = {
    WebkitAppearance: 'none' as 'none',
    appearance: 'none' as 'none',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    background: isPlaying ? '#ff4c4c' : '#56D364', // 再生中は明るい赤、停止中は明るい緑
    cursor: 'pointer',
    boxShadow: '0px 0px 4px rgba(0, 0, 0, 0.5)',
  };

  return (
    <>
      <audio ref={audioRef} src="/audio/tetris_bgm.mp3" preload="auto" />
      {hasTriedToPlay && (
        <div // ★変更点★ buttonからdivに変更し、その中にbuttonとinputを配置
          style={playerBlockStyle}
          onMouseEnter={(e) => {
            // ホバーエフェクトはdiv全体ではなく、ボタン自体に適用するのが理想的ですが、
            // 全体的なスタイルを維持するためdivに適用
            e.currentTarget.style.backgroundColor = hoverStyle.backgroundColor;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isPlaying
              ? '#dc2626'
              : '#2DA042';
          }}
        >
          <button
            onClick={togglePlay}
            style={{
              backgroundColor: 'transparent', // 親divが背景を持つので透明に
              border: 'none',
              color: 'inherit', // 親divの色を継承
              fontSize: 'inherit', // 親divのフォントサイズを継承
              cursor: 'pointer',
              padding: 0, // パディングをリセット
              display: 'flex',
              alignItems: 'center',
              gap: '5px', // アイコンとテキストの間隔
            }}
          >
            {isPlaying ? '♪ 音楽停止' : '▶︎ 音楽再生'}
          </button>
          {/* ★追加★ 音量スライダー */}
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            style={
              {
                ...sliderStyle,
                // つまみのスタイルを直接適用
                '--thumb-bg': thumbStyle.background, // カスタムプロパティでつまみ色を渡す
                WebkitSliderThumb: thumbStyle, // Webkit (Chrome, Safari)
                MozRangeThumb: thumbStyle, // Firefox
              } as React.CSSProperties & { [key: string]: string }
            } // 型アサーション
          />
        </div>
      )}
    </>
  );
}
