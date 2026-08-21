import React from 'react';

const MANA_SYMBOLS = [
  { id: 'W', label: 'W', color: '#f8fafc', bg: '#f1f5f9', text: '#000' }, // White
  { id: 'U', label: 'U', color: '#3b82f6', bg: '#dbeafe', text: '#000' }, // Blue
  { id: 'B', label: 'B', color: '#8b5cf6', bg: '#1e293b', text: '#fff' }, // Black
  { id: 'R', label: 'R', color: '#ef4444', bg: '#fee2e2', text: '#000' }, // Red
  { id: 'G', label: 'G', color: '#10b981', bg: '#d1fae5', text: '#000' }, // Green
  { id: 'C', label: 'C', color: '#94a3b8', bg: '#1e293b', text: '#fff' }, // Colorless
];

const ManaSelector = ({ selectedColors, onChange, includeMulticolor, onMulticolorChange }) => {
  const toggleColor = (colorId) => {
    if (selectedColors.includes(colorId)) {
      onChange(selectedColors.filter(c => c !== colorId));
    } else {
      onChange([...selectedColors, colorId]);
    }
  };

  // Multicolor toggle is only relevant when at least one color is selected (but not only C)
  const hasNonColorless = selectedColors.some(c => c !== 'C');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '10px' }}>
      <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'bold' }}>
        COLORS (TAP TO TOGGLE)
      </label>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {MANA_SYMBOLS.map(mana => {
          const isActive = selectedColors.includes(mana.id);
          return (
            <button
              key={mana.id}
              className={`mana-button ${isActive ? 'active' : ''}`}
              onClick={() => toggleColor(mana.id)}
              style={{
                '--mana-color': mana.color,
                '--mana-bg': mana.bg,
                '--mana-text': mana.text
              }}
            >
              {mana.label}
            </button>
          );
        })}
      </div>

      {/* Multicolor toggle — only visible when a non-colorless color is selected */}
      {hasNonColorless && (
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontSize: '12px',
            color: includeMulticolor ? 'var(--accent)' : 'var(--text-muted)',
            userSelect: 'none',
            transition: 'color 0.2s',
          }}
        >
          <div
            onClick={() => onMulticolorChange(!includeMulticolor)}
            style={{
              width: '32px',
              height: '18px',
              borderRadius: '9px',
              background: includeMulticolor
                ? 'var(--accent)'
                : 'rgba(255,255,255,0.15)',
              position: 'relative',
              transition: 'background 0.2s',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                background: '#fff',
                position: 'absolute',
                top: '2px',
                left: includeMulticolor ? '16px' : '2px',
                transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }}
            />
          </div>
          Include Multicolor
        </label>
      )}
    </div>
  );
};

export default ManaSelector;
