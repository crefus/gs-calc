import { useState } from 'react';
import './index.css';
import ManualCalculator from './components/manual/ManualCalculator';
import AutoCalculator from './components/auto/AutoCalculator';

function App() {
  const [activeTab, setActiveTab] = useState('manual');

  return (
    <div className="app-container">
      <header className="main-header glass-panel">
        <div className="container">
          <h1 className="logo text-gradient-gold">グラサマ ダメージ計算機</h1>
          <nav className="main-nav">
            <button
              className={`nav-btn ${activeTab === 'manual' ? 'active' : ''}`}
              onClick={() => setActiveTab('manual')}
            >
              手動モード
            </button>
            <button
              className={`nav-btn ${activeTab === 'auto' ? 'active' : ''}`}
              onClick={() => setActiveTab('auto')}
            >
              自動モード
            </button>
          </nav>
        </div>
      </header>

      <main className="main-content container">
        <div className={`mode-view ${activeTab !== 'manual' ? 'hidden' : ''}`}>
          <h2>手動計算モード</h2>
          <p className="mb-md">補正値などを手動で入力してダメージを計算します。</p>
          <ManualCalculator />
        </div>
        <div className={`mode-view ${activeTab !== 'auto' ? 'hidden' : ''}`}>
          <h2>パーティー自動計算モード</h2>
          <p className="mb-md">パーティーを編成してダメージを計算します。</p>
          <AutoCalculator />
        </div>
      </main>

      <footer className="main-footer">
        <p>Grand Summoners Damage Simulator</p>
        <p>このサイトは非公式のファンサイトです。Made by <a href="https://x.com/cre_fus">@crefus</a></p>
      </footer>

      {/* Temporary Styles for this Layout */}
      <style>{`
        .app-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }
        .container {
          max-width: 1440px;
          margin: 0 auto;
          padding: 0 var(--spacing-md);
          width: 100%;
        }
        .main-header {
          position: sticky;
          top: var(--spacing-md);
          margin: var(--spacing-md) auto;
          padding: var(--spacing-md);
          z-index: 100;
          display: flex;
          justify-content: center;
          width: calc(100% - var(--spacing-md) * 2);
          max-width: 1440px;
        }
        .main-header .container {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .main-nav {
          display: flex;
          gap: var(--spacing-md);
        }
        .nav-btn {
          background: transparent;
          border: 1px solid var(--glass-border);
          color: var(--text-secondary);
          padding: 8px 16px;
          border-radius: var(--radius-full);
          cursor: pointer;
          transition: var(--transition-normal);
        }
        .nav-btn:hover {
          background: var(--glass-highlight);
          color: var(--text-primary);
        }
        .nav-btn.active {
          background: var(--accent-gold);
          color: var(--bg-primary);
          font-weight: bold;
          box-shadow: var(--shadow-glow);
          border-color: var(--accent-gold);
        }
        .main-content {
          flex: 1;
          padding-top: var(--spacing-xl);
          padding-bottom: var(--spacing-xl);
        }
        .main-footer {
          text-align: center;
          padding: var(--spacing-xl);
          color: var(--text-muted);
          font-size: 0.9rem;
        }
        .main-footer a {
          color: var(--text-muted);
          text-decoration: underline;
        }
        .main-footer a:hover {
          color: var(--text-link-hover);
        }
        .hidden {
          display: none;
        }
      `}</style>
    </div >
  );
}

export default App;
