import React, { useState } from 'react';

const CardButton = ({ card, onClick, disabled, isCorrect, showResult, resultType = 'ata' }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Use a transparent border by default to prevent layout shift
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
  } else if (isHovered && !disabled && window.matchMedia('(hover: hover)').matches) {
    // Only show hover glow on devices that actually support hovering (desktops)
    borderStyle = '2px solid var(--accent)';
    filterStyle = 'drop-shadow(0 4px 12px rgba(0, 229, 255, 0.3))';
  }

  const renderResult = () => {
    if (resultType === 'ata') {
      return (
        <>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ATA:</span>
          <span style={{ fontWeight: 'bold', marginLeft: '4px', color: isCorrect ? 'var(--correct)' : 'var(--text-main)', fontSize: '14px' }}>
            {card.avg_pick.toFixed(2)}
          </span>
        </>
      );
    } else if (resultType === 'winrate') {
      const wr = (card.win_rate || 0) * 100;
      return (
        <>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>WR:</span>
          <span style={{ fontWeight: 'bold', marginLeft: '4px', color: isCorrect ? 'var(--correct)' : 'var(--text-main)', fontSize: '14px' }}>
            {wr.toFixed(1)}%
          </span>
        </>
      );
    } else {
      const price = card.price || 0;
      const isBulk = price < 1.00;
      return (
        <>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>USD:</span>
          <span style={{ fontWeight: 'bold', marginLeft: '4px', color: isCorrect ? 'var(--correct)' : 'var(--text-main)', fontSize: '14px' }}>
            {isBulk ? 'Bulk' : `$${price.toFixed(2)}`}
          </span>
          {!isBulk && price > 0 && (
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '-2px' }}>
              ${price.toFixed(2)}
            </div>
          )}
        </>
      );
    }
  };

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
        width: '100%',
        height: '100%',
        maxHeight: '100%',
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
        position: 'relative'
      }}
    >
      <img 
        src={card.image_url} 
        alt={card.name} 
        style={{
          width: 'auto',
          height: 'auto',
          maxWidth: '100%',
          maxHeight: '100%',
          borderRadius: '4.75% / 3.5%',
          border: borderStyle,
          filter: filterStyle,
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
          display: 'block',
          objectFit: 'contain',
          outline: 'none'
        }}
      />
      {showResult && (
        <div className="fade-in" style={{ 
          position: 'absolute',
          bottom: '-30px',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center', 
          background: 'rgba(0,0,0,0.6)', 
          padding: '4px 10px', 
          borderRadius: '4px',
          whiteSpace: 'nowrap',
          zIndex: 5,
          border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          {renderResult()}
        </div>
      )}
    </div>
  );
};

export default CardButton;
