import React, { useState, useEffect } from 'react';
import GameScreen from './components/GameScreen';
import './index.css';

const LAYOUTS = [
  { id: 'stack', label: 'Stack', icon: '☰', desc: 'Cards stacked vertically' },
  { id: 'side',  label: 'Side',  icon: '⧉', desc: 'Cards side-by-side' },
  { id: 'split', label: 'Split', icon: '⬒', desc: 'Cards split screen' },
];

function App() {
  const [layout, setLayout] = useState(
    () => localStorage.getItem('mtg_layout') || 'stack'
  );

  const cycleLayout = () => {
    const idx = LAYOUTS.findIndex(l => l.id === layout);
    const next = LAYOUTS[(idx + 1) % LAYOUTS.length];
    setLayout(next.id);
    localStorage.setItem('mtg_layout', next.id);
  };

  const currentLayout = LAYOUTS.find(l => l.id === layout);

  return (
    <div className="app-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: '4px' }}>
        <h1 style={{ margin: 0 }}>MTG Draft Trainer</h1>
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
      <p className="subtitle">Pick the card drafted earlier by Top Players</p>
      <GameScreen layout={layout} />
    </div>
  );
}

export default App;
