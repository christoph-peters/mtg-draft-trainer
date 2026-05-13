import React, { useState, useEffect } from 'react';
import GameScreen from './components/GameScreen';
import LearningScreen from './components/LearningScreen';
import ErrorBoundary from './components/ErrorBoundary';
import ManaSelector from './components/ManaSelector';
import { SETS, getGuildFromColors } from './utils';
import './index.css';

const LAYOUTS = [
  { id: 'stack', label: 'Stack', icon: '☰', desc: 'Cards stacked vertically' },
  { id: 'wide',  label: 'Wide',  icon: '↔', desc: 'Side-by-side (max width)' },
];

const MODES = [
  { id: 'learn', label: 'Learn', icon: '📖', subtitle: 'Swipe through top cards to build your mental map' },
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

  const [activeSet, setActiveSet] = useState('SOS');
  const [selectedColors, setSelectedColors] = useState([]);
  const [masterMetadata, setMasterMetadata] = useState(null);
  const [masterStats, setMasterStats] = useState(null);
  const [dataState, setDataState] = useState('loading'); // loading, ready, error
  const [loadWarning, setLoadWarning] = useState('');

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

  useEffect(() => {
    const loadSetData = async () => {
      setDataState('loading');
      setLoadWarning('');
      const baseUrl = import.meta.env.BASE_URL || '/';
      const prefix = activeSet.toLowerCase();

      try {
        const [metaRes, statsRes] = await Promise.all([
          fetch(`${baseUrl}data/${prefix}_metadata.json`),
          fetch(`${baseUrl}data/${prefix}_stats.json`)
        ]);

        if (!metaRes.ok || !statsRes.ok) throw new Error("Missing set files");

        const [meta, stats] = await Promise.all([metaRes.json(), statsRes.json()]);
        
        setMasterMetadata(meta);
        setMasterStats(stats);
        setDataState('ready');
      } catch (err) {
        console.error('Failed to load card data', err);
        setMasterMetadata(null);
        setMasterStats(null);
        setDataState('error');
      }
    };

    loadSetData();
  }, [activeSet]);

  const currentLayout = LAYOUTS.find(l => l.id === layout) || LAYOUTS[0];
  const currentMode = MODES.find(m => m.id === gameMode) || MODES[0];
  const currentGuild = getGuildFromColors(selectedColors);

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

        {/* Global Controls for Set and Colors */}
        <div style={{ width: '100%', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', padding: '0 12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <label htmlFor="set-select" style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 'bold' }}>SET</label>
            <select 
              id="set-select"
              className="mode-selector"
              value={activeSet} 
              onChange={(e) => setActiveSet(e.target.value)}
              disabled={dataState === 'loading'}
            >
              {SETS.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {(gameMode === 'draft' || gameMode === 'winrate' || gameMode === 'learn') && (
            <>
              <ManaSelector 
                selectedColors={selectedColors} 
                onChange={setSelectedColors} 
              />
              
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Data Source: <strong>{currentGuild === 'Overall' && selectedColors.length > 2 ? [...selectedColors].sort().join('') : currentGuild}</strong>
              </div>
            </>
          )}
          {loadWarning && (
            <div style={{ fontSize: '12px', color: '#f59e0b', marginTop: '4px' }}>
              {loadWarning}
            </div>
          )}
        </div>

        {gameMode === 'learn' ? (
          <LearningScreen 
            gameMode={gameMode}
            activeSet={activeSet}
            selectedColors={selectedColors}
            masterMetadata={masterMetadata}
            masterStats={masterStats}
            dataState={dataState}
            loadWarning={loadWarning}
          />
        ) : (
          <GameScreen 
            layout={layout} 
            gameMode={gameMode}
            activeSet={activeSet}
            selectedColors={selectedColors}
            masterMetadata={masterMetadata}
            masterStats={masterStats}
            dataState={dataState}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;
