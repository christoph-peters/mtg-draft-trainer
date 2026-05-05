import React, { useState, useEffect } from 'react';
import GameScreen from './components/GameScreen';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

const LAYOUTS = [
  { id: 'stack', label: 'Stack', icon: '☰', desc: 'Cards stacked vertically' },
  { id: 'wide',  label: 'Wide',  icon: '↔', desc: 'Side-by-side (max width)' },
];

const MODES = [
  { id: 'draft', label: 'Draft', icon: '🏆', subtitle: 'Pick the card drafted earlier by Top Players' },
  { id: 'value', label: 'Value', icon: '💰', subtitle: 'Pick the card with higher market value (>$1)' },
  { id: 'winrate', label: 'Win Rate', icon: '📈', subtitle: 'Pick the card with higher Games-In-Hand Win Rate' },
];

function App() {
  const [layout, setLayout] = useState(
    () => {
      const saved = localStorage.getItem('mtg_layout');
      return saved === 'side' ? 'wide' : (saved || 'stack');
    }
  );
  const [gameMode, setGameMode] = useState(
    () => localStorage.getItem('mtg_game_mode') || 'draft'
  );

  const cycleLayout = () => {
    const idx = LAYOUTS.findIndex(l => l.id === layout);
    const next = LAYOUTS[(idx + 1) % LAYOUTS.length];
    setLayout(next.id);
    localStorage.setItem('mtg_layout', next.id);
  };

  const cycleGameMode = () => {
    const idx = MODES.findIndex(m => m.id === gameMode);
    const next = MODES[(idx + 1) % MODES.length];
    setGameMode(next.id);
    localStorage.setItem('mtg_game_mode', next.id);
  };

  const currentLayout = LAYOUTS.find(l => l.id === layout) || LAYOUTS[0];
  const currentMode = MODES.find(m => m.id === gameMode) || MODES[0];

  return (
    <ErrorBoundary>
      <div className="app-container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: '4px' }}>
          <button
            onClick={cycleGameMode}
            title={`Mode: ${currentMode.label}. Click to switch.`}
            style={{
              position: 'absolute',
              left: 0,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '8px',
              color: 'var(--text-main)',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 700,
              padding: '6px 10px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>{currentMode.icon}</span>
            <span className="hide-mobile">{currentMode.label}</span>
          </button>

          <h1 style={{ margin: 0, fontSize: '20px' }}>MTG Trainer</h1>
          <button
            onClick={cycleLayout}
            title={`Layout: ${currentLayout?.desc || 'Select layout'}. Click to switch.`}
            style={{
              position: 'absolute',
              right: 0,
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '8px',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '11px',
              fontFamily: 'var(--font-main)',
              fontWeight: 600,
              padding: '4px 8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              lineHeight: 1.2,
              gap: '1px',
              transition: 'border-color 0.2s, color 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <span style={{ fontSize: '16px' }}>{currentLayout.icon}</span>
            <span>{currentLayout.label}</span>
          </button>
        </div>
        <p className="subtitle">{currentMode.subtitle}</p>
        <GameScreen layout={layout} gameMode={gameMode} />
      </div>
    </ErrorBoundary>
  );
}

export default App;
