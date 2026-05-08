import React from 'react';
import './Sidebar.css';

export function Sidebar({ isOpen, onClose, currentView, setCurrentView }) {
  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}></div>
      <div className={`sidebar-drawer ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h3>メニュー</h3>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>
        <div className="sidebar-nav">
          <button 
            className={`nav-btn ${currentView === 'explorer' ? 'active' : ''}`}
            onClick={() => { setCurrentView('explorer'); onClose(); }}
          >
            エクスプローラ
          </button>
          <button 
            className={`nav-btn ${currentView === 'settings' ? 'active' : ''}`}
            onClick={() => { setCurrentView('settings'); onClose(); }}
          >
            設定
          </button>
        </div>
      </div>
    </>
  );
}
