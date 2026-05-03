import React from 'react';

const LivesCounter = ({ lives }) => {
  return (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', justifyContent: 'center' }}>
      {[1, 2, 3].map((heart) => (
        <span 
          key={heart}
          style={{
            fontSize: '24px',
            opacity: heart <= lives ? 1 : 0.2,
            transition: 'opacity 0.3s ease',
            filter: heart <= lives ? 'drop-shadow(0 0 5px rgba(239,68,68,0.5))' : 'none'
          }}
        >
          🎲
        </span>
      ))}
    </div>
  );
};

export default LivesCounter;
