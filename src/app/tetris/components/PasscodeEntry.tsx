'use client';

import { useState } from 'react';

interface PasscodeEntryProps {
  onPasscodeSubmit: (passcode: string) => void;
}

export default function PasscodeEntry({ onPasscodeSubmit }: PasscodeEntryProps) {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passcode.trim()) {
      setError('合言葉を入力してください');
      return;
    }
    
    if (passcode.length < 3 || passcode.length > 20) {
      setError('合言葉は3文字以上20文字以下で入力してください');
      return;
    }
    
    setError('');
    onPasscodeSubmit(passcode.trim());
  };

  return (
    <div className="passcode-entry">
      <div className="passcode-card">
        <div className="passcode-header">
          <h2>🎯 合言葉でマッチング</h2>
          <p>同じ合言葉を入力した相手と対戦します</p>
        </div>
        
        <form onSubmit={handleSubmit} className="passcode-form">
          <div className="input-group">
            <label htmlFor="passcode">合言葉</label>
            <input
              id="passcode"
              type="text"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="3文字以上20文字以下で入力"
              maxLength={20}
              minLength={3}
              className={error ? 'error' : ''}
            />
            {error && <span className="error-message">{error}</span>}
          </div>
          
          <button type="submit" className="enter-button">
            🚀 入室する
          </button>
        </form>
        
        <div className="instructions">
          <h3>📋 遊び方</h3>
          <ul>
            <li>・合言葉を決めて「入室する」をクリック</li>
            <li>・同じ合言葉の相手が来るまで待機</li>
            <li>・2人揃ったら自動でゲーム開始！</li>
          </ul>
          
          <h3>🎮 操作方法</h3>
          <ul>
            <li>・←→: 左右移動</li>
            <li>・↑: ハードドロップ</li>
            <li>・↓: ソフトドロップ</li>
            <li>・Space: 回転</li>
            <li>・C: ホールド</li>
          </ul>
        </div>
        
        <div className="passcode-examples">
          <h4>💡 合言葉の例</h4>
          <div className="example-tags">
            <span className="example-tag" onClick={() => setPasscode('テトリス')}>テトリス</span>
            <span className="example-tag" onClick={() => setPasscode('対戦')}>対戦</span>
            <span className="example-tag" onClick={() => setPasscode('友達')}>友達</span>
            <span className="example-tag" onClick={() => setPasscode('github')}>github</span>
          </div>
        </div>
      </div>
    </div>
  );
} 