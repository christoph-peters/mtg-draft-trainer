import React from 'react';
import GameScreen from './components/GameScreen';
import './index.css';

function App() {
  return (
    <div className="app-container">
      <h1>MTG Draft Trainer</h1>
      <p className="subtitle">Pick the card drafted earlier by Top Players</p>
      <GameScreen />
    </div>
  );
}

export default App;
