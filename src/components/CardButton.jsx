import React, { useState } from 'react';

const CardButton = ({ card, onClick, disabled, isCorrect, showResult }) => {
  const [isHovered, setIsHovered] = useState(false);

  let borderStyle = '2px solid transparent';
  let filterStyle = 'none';

  if (showResult) {
    if (isCorrect) {
      borderStyle = '2px solid var(--correct)';
      filterStyle = 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.5))';
    } else {
      borderStyle = '2px solid var(--incorrect)';
      filterStyle = 'grayscale(100%) opacity(0.5)';
    }
  } else if (isHovered && !disabled) {
    borderStyle = '2px solid var(--accent)';
    filterStyle = 'drop-shadow(0 4px 12px rgba(0, 229, 255, 0.3))';
  }

  return (
    <div 
      onClick={() => !disabled && onClick()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        cursor: disabled ? 'default' : 'pointer',
        transition: 'all 0.2s ease',
        transform: isHovered && !disabled ? 'translateY(-4px)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flex: 1,
        maxWidth: '100%'
      }}
    >
      <img 
        src={card.image_url} 
        alt={card.name} 
        style={{
          width: '100%',
          borderRadius: '4.75% / 3.5%', // Typical MTG card corner radius ratio
          border: borderStyle,
          filter: filterStyle,
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
          display: 'block'
        }}
      />
      {showResult && (
        <div className="fade-in" style={{ marginTop: '12px', textAlign: 'center', background: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: '4px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ATA:</span>
          <span style={{ fontWeight: 'bold', marginLeft: '4px', color: isCorrect ? 'var(--correct)' : 'var(--text-main)' }}>
            {card.avg_pick.toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
};

export default CardButton;
