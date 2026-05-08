import React, { useState, useEffect } from 'react';
import './CommandPalette.css';

export function CommandPalette({ isOpen, onClose }) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div className="command-palette-modal" onClick={e => e.stopPropagation()}>
        <input 
          type="text" 
          className="command-input selectable" 
          placeholder="AIに質問、またはファイルを検索... (ここに入力)"
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
        />
        <div className="command-results">
          {query ? (
             <div className="result-item">検索中: {query}</div>
          ) : (
             <div className="result-item text-secondary">検索キーワードを入力してください...</div>
          )}
        </div>
      </div>
    </div>
  );
}
