import React from 'react';

const GameOverScreen = ({ score, onRestart }) => {
  return (
    <div className="glass-panel fade-in" style={{ textAlign: 'center', marginTop: '20px' }}>
      <h2 style={{ fontSize: '28px', marginBottom: '16px', color: 'var(--incorrect)' }}>Game Over!</h2>
      <p style={{ fontSize: '18px', marginBottom: '24px' }}>
        You got <strong style={{ color: 'var(--accent)', fontSize: '24px' }}>{score}</strong> correct in a row.
      </p>
      <button className="btn-primary" onClick={onRestart}>
        Play Again
      </button>
    </div>
  );
};

export default GameOverScreen;
