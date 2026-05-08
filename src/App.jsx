import React, { useState, useEffect } from 'react';
import { CommandPalette } from './components/CommandPalette';
import { Sidebar } from './components/Sidebar';
import './App.css';

function App() {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState('explorer'); // 'explorer', 'settings'
  const [theme, setTheme] = useState('dark'); // 'dark' or 'light'
  const [selectedCategory, setSelectedCategory] = useState('imported'); // 'imported', 'desktop', 'pictures', 'documents'

  // File System State
  const [currentPath, setCurrentPath] = useState([]); // Array of directory handles { name, handle }
  const [currentFolders, setCurrentFolders] = useState([]);
  const [currentFiles, setCurrentFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFileIdx, setActiveFileIdx] = useState(null);

  const categories = [
    { id: 'imported', name: '取り込み済み', icon: '📂' },
    { id: 'desktop', name: 'デスクトップ', icon: '💻' },
    { id: 'pictures', name: 'ピクチャ', icon: '🖼️' },
    { id: 'documents', name: 'ドキュメント', icon: '📄' },
  ];

  // Initialize theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Global shortcut listener
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault(); // Prevent browser's default search bar
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Load directory contents
  const loadDirectory = async (dirHandle) => {
    try {
      const folders = [];
      const files = [];
      
      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'directory') {
          folders.push({ name: entry.name, handle: entry });
        } else if (entry.kind === 'file') {
          files.push({ name: entry.name, handle: entry });
        }
      }
      
      // Sort alphabetically
      folders.sort((a, b) => a.name.localeCompare(b.name));
      files.sort((a, b) => a.name.localeCompare(b.name));
      
      setCurrentFolders(folders);
      setCurrentFiles(files);
      setActiveFileIdx(null);
    } catch (err) {
      console.error("Failed to load directory:", err);
      alert("フォルダの読み込みに失敗しました。権限が許可されていない可能性があります。");
    }
  };

  // Select root folder
  const handleOpenFolder = async () => {
    try {
      const dirHandle = await window.showDirectoryPicker({
        mode: 'read'
      });
      setCurrentPath([{ name: dirHandle.name, handle: dirHandle }]);
      await loadDirectory(dirHandle);
    } catch (err) {
      console.error("User cancelled or failed to open folder:", err);
    }
  };

  // Navigate into a subfolder
  const handleFolderClick = async (folder) => {
    setCurrentPath(prev => [...prev, folder]);
    await loadDirectory(folder.handle);
    setSearchQuery(''); // フォルダ移動時に検索バーをクリア
  };

  // Navigate to a specific path index via breadcrumb
  const handleBreadcrumbClick = async (index) => {
    const targetFolder = currentPath[index];
    const newPath = currentPath.slice(0, index + 1);
    setCurrentPath(newPath);
    await loadDirectory(targetFolder.handle);
    setSearchQuery(''); // フォルダ移動時に検索バーをクリア
  };

  const filteredFolders = currentFolders.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredFiles = currentFiles.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const activeCategory = categories.find(c => c.id === selectedCategory);

  const explorerPane = (
    <div className="explorer-layout">
      <div className="navigation-bar">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-primary)', padding: '4px' }}
        >
          ☰
        </button>
        <div className="breadcrumb">
          {selectedCategory !== 'imported' ? (
            <span className="breadcrumb-item" style={{color: 'var(--text-primary)'}}>
              {activeCategory?.name}
            </span>
          ) : currentPath.length === 0 ? (
            <span className="breadcrumb-item" style={{color: 'var(--text-primary)'}}>取り込み済み (フォルダ未選択)</span>
          ) : (
            currentPath.map((folder, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span>/</span>}
                <span 
                  className="breadcrumb-item" 
                  style={{ color: idx === currentPath.length - 1 ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                  onClick={() => handleBreadcrumbClick(idx)}
                >
                  {folder.name}
                </span>
              </React.Fragment>
            ))
          )}
        </div>
        <div className="search-container">
          <span style={{color: 'var(--text-secondary)', marginRight: '8px', fontSize: '0.9rem'}}>🔍</span>
          <input 
            type="text" 
            className="search-input selectable" 
            placeholder={
              selectedCategory !== 'imported' 
                ? `${activeCategory?.name} の検索...` 
                : currentPath.length > 0 
                  ? `${currentPath[currentPath.length - 1].name} の検索...` 
                  : "検索..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={selectedCategory !== 'imported' || currentPath.length === 0}
          />
        </div>
      </div>

      <div className="explorer-content">
        <div className="directory-tree">
          <div style={{ padding: '10px 16px', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
            クイックアクセス
          </div>
          {categories.map(cat => (
            <div 
              key={cat.id} 
              className={`tree-item ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => {
                setSelectedCategory(cat.id);
                setSearchQuery('');
              }}
            >
              <span style={{marginRight: '8px', fontSize: '1.1rem'}}>{cat.icon}</span> {cat.name}
            </div>
          ))}
        </div>
        
        <div className="file-list" onClick={() => setActiveFileIdx(null)}>
          {selectedCategory !== 'imported' ? (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-secondary)' }}>
               <div style={{ fontSize: '4rem', marginBottom: '16px', opacity: 0.5 }}>{activeCategory?.icon}</div>
               <p style={{ fontSize: '1.1rem' }}>何も表示されません</p>
            </div>
          ) : currentPath.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <div style={{ fontSize: '4rem', marginBottom: '16px' }}>📂</div>
              <h2 style={{ marginBottom: '24px', color: 'var(--text-secondary)' }}>取り込み済みのフォルダがありません</h2>
              <button 
                onClick={handleOpenFolder}
                style={{ padding: '12px 24px', fontSize: '1.1rem', backgroundColor: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'background-color 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-hover)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-color)'}
              >
                フォルダを開く
              </button>
            </div>
          ) : (
            <div className="file-grid">
              {/* Folders in main view */}
              {filteredFolders.map((folder, idx) => (
                <div 
                  key={`folder-${idx}`} 
                  className="file-item"
                  onDoubleClick={() => handleFolderClick(folder)}
                  onClick={(e) => { e.stopPropagation(); setActiveFileIdx(`folder-${idx}`); }}
                  style={activeFileIdx === `folder-${idx}` ? { backgroundColor: 'var(--item-active)', outline: '1px solid var(--accent-color)' } : {}}
                >
                  <div className="file-icon">📁</div>
                  <div className="file-name">{folder.name}</div>
                </div>
              ))}
              
              {/* Files in main view */}
              {filteredFiles.map((file, idx) => (
                <div 
                  key={`file-${idx}`} 
                  className={`file-item ${activeFileIdx === `file-${idx}` ? 'active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); setActiveFileIdx(`file-${idx}`); }}
                >
                  <div className="file-icon">
                    {file.name.endsWith('.md') ? '📝' : 
                     file.name.match(/\.(png|jpg|jpeg|gif|svg)$/i) ? '🖼️' : 
                     file.name.match(/\.(xlsx|csv|xls)$/i) ? '📊' : 
                     file.name.match(/\.(html|jsx|js|ts|tsx|css|json)$/i) ? '💻' : '📄'}
                  </div>
                  <div className="file-name">{file.name}</div>
                </div>
              ))}
              
              {filteredFolders.length === 0 && filteredFiles.length === 0 && (
                <p style={{color: 'var(--text-secondary)', gridColumn: '1 / -1', textAlign: 'center', marginTop: '2rem'}}>
                  {searchQuery ? `"${searchQuery}" に一致する項目はありません。` : "このフォルダは空です。"}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const settingsPane = (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-primary)', padding: '4px' }}
        >
          ☰
        </button>
        <h1 style={{ margin: 0 }}>設定</h1>
      </div>
      
      <div style={{ backgroundColor: 'var(--panel-bg)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <h3 style={{ marginBottom: '16px' }}>外観</h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>テーマ設定</span>
          <button 
            onClick={toggleTheme} 
            style={{ 
              padding: '8px 16px', 
              cursor: 'pointer',
              backgroundColor: 'var(--item-hover)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px'
            }}>
            {theme === 'dark' ? 'ダークモード' : 'ライトモード'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderView = () => {
    switch (currentView) {
      case 'explorer':
        return explorerPane;
      case 'settings':
        return settingsPane;
      default:
        return explorerPane;
    }
  };

  return (
    <>
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        currentView={currentView}
        setCurrentView={setCurrentView}
      />
      
      <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--bg-color)' }}>
        {renderView()}
        <CommandPalette 
          isOpen={isCommandPaletteOpen} 
          onClose={() => setIsCommandPaletteOpen(false)} 
        />
      </div>
    </>
  );
}

export default App;
