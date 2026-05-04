import React, { useState, useEffect } from 'react';
import GameScreen from './components/GameScreen';
import './index.css';

const LAYOUTS = [
  { id: 'stack', label: 'Stack', icon: '☰', desc: 'Cards stacked vertically' },
  { id: 'side',  label: 'Side',  icon: '⧉', desc: 'Cards side-by-side' },
  { id: 'wide',  label: 'Wide',  icon: '↔', desc: 'Side-by-side (max width)' },
];

function App() {
  const [layout, setLayout] = useState(
    () => localStorage.getItem('mtg_layout') || 'stack'
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

  const toggleGameMode = () => {
    const next = gameMode === 'draft' ? 'value' : 'draft';
    setGameMode(next);
    localStorage.setItem('mtg_game_mode', next);
  };

  const currentLayout = LAYOUTS.find(l => l.id === layout);

  return (
    <div className="app-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: '4px' }}>
        <button
          onClick={toggleGameMode}
          title={`Switch to ${gameMode === 'draft' ? 'Value' : 'Draft'} mode`}
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
            letterSpacing: '0.5px'
          }}
        >
          {gameMode === 'draft' ? '🏆 Draft' : '💰 Value'}
        </button>

        <h1 style={{ margin: 0, fontSize: '20px' }}>MTG Trainer</h1>
        <button
          onClick={cycleLayout}
          title={`Layout: ${currentLayout.desc}. Click to switch.`}
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
      <p className="subtitle">
        {gameMode === 'draft' 
          ? 'Pick the card drafted earlier by Top Players' 
          : 'Pick the card with higher secondary market value'}
      </p>
      <GameScreen layout={layout} gameMode={gameMode} />
    </div>
  );
}

export default App;
