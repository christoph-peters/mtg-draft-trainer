import React from 'react';

const MANA_SYMBOLS = [
  { id: 'W', label: 'W', color: '#f8fafc', bg: '#f1f5f9', text: '#000' }, // White
  { id: 'U', label: 'U', color: '#3b82f6', bg: '#dbeafe', text: '#000' }, // Blue
  { id: 'B', label: 'B', color: '#8b5cf6', bg: '#1e293b', text: '#fff' }, // Black
  { id: 'R', label: 'R', color: '#ef4444', bg: '#fee2e2', text: '#000' }, // Red
  { id: 'G', label: 'G', color: '#10b981', bg: '#d1fae5', text: '#000' }  // Green
];

const ManaSelector = ({ selectedColors, onChange }) => {
  const toggleColor = (colorId) => {
    if (selectedColors.includes(colorId)) {
      onChange(selectedColors.filter(c => c !== colorId));
    } else {
      onChange([...selectedColors, colorId]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 'bold' }}>
        COLORS (TAP TO TOGGLE)
      </label>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
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
    </div>
  );
};

export default ManaSelector;
