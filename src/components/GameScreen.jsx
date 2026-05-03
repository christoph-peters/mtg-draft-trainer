import React, { useState, useEffect } from 'react';
import CardButton from './CardButton';
import LivesCounter from './LivesCounter';
import GameOverScreen from './GameOverScreen';
import ManaSelector from './ManaSelector';

const SETS = [
  { id: 'OTJ', name: 'Outlaws of Thunder Junction' },
  { id: 'SOS', name: 'Secrets of Strixhaven' },
  { id: 'TMT', name: 'TMNT' },
  { id: 'ECL', name: 'Lorwyn Eclipsed' }
];

const getGuildFromColors = (colors) => {
  if (colors.length !== 2) return 'Overall';
  
  const guilds = ['WU', 'UB', 'BR', 'RG', 'WG', 'WB', 'UR', 'BG', 'WR', 'UG'];
  const str1 = colors[0] + colors[1];
  const str2 = colors[1] + colors[0];
  
  if (guilds.includes(str1)) return str1;
  if (guilds.includes(str2)) return str2;
  
  return 'Overall';
};

const GameScreen = () => {
  const [activeSet, setActiveSet] = useState('OTJ');
  const [selectedColors, setSelectedColors] = useState([]);
  
  const [cards, setCards] = useState([]);
  const [currentPair, setCurrentPair] = useState([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameState, setGameState] = useState('loading'); // loading, playing, result, gameover
  const [selectedCardIdx, setSelectedCardIdx] = useState(null);
  const [resultMsg, setResultMsg] = useState('');

  // Load data when set or selectedColors (meaning mode) changes
  useEffect(() => {
    setGameState('loading');
    const mode = getGuildFromColors(selectedColors);
    const filename = mode === 'Overall' ? `${activeSet.toLowerCase()}_top_players.json` : `${activeSet.toLowerCase()}_top_players_${mode}.json`;
    const baseUrl = import.meta.env.BASE_URL || '/';
    
    fetch(`${baseUrl}data/${filename}`)
      .then(res => res.json())
      .then(data => {
        setCards(data);
        setScore(0);
        setLives(3);
        pickNewPair(data, selectedColors);
        setGameState('playing');
      })
      .catch(err => {
        console.error("Failed to load card data", err);
        setGameState('error');
      });
  }, [activeSet, selectedColors]);

  const pickNewPair = (cardData, currentColors) => {
    if (!cardData || cardData.length < 2) {
      setGameState('error');
      return;
    }

    // Filter cards to only include on-color and colorless cards for the selected colors
    const validCards = cardData.filter(card => {
      // Colorless is always allowed
      if (!card.color || card.color === "") return true;
      
      // If no colors selected, allow all
      if (currentColors.length === 0) return true;
      
      // Every character in card.color must exist in currentColors
      for (let i = 0; i < card.color.length; i++) {
        if (!currentColors.includes(card.color[i])) {
          return false;
        }
      }
      return true;
    });

    if (validCards.length < 2) {
      setGameState('error');
      return;
    }
    
    let idx1 = Math.floor(Math.random() * validCards.length);
    let idx2 = Math.floor(Math.random() * validCards.length);
    while (idx1 === idx2) {
      idx2 = Math.floor(Math.random() * validCards.length);
    }
    
    const pair = [validCards[idx1], validCards[idx2]];
    if (Math.random() > 0.5) pair.reverse();
    
    setCurrentPair(pair);
    setSelectedCardIdx(null);
    setResultMsg('');
  };

  const handleCardClick = (idx) => {
    if (gameState !== 'playing') return;
    
    setSelectedCardIdx(idx);
    setGameState('result');
    
    const selectedCard = currentPair[idx];
    const otherCard = currentPair[idx === 0 ? 1 : 0];
    
    const diff = selectedCard.avg_pick - otherCard.avg_pick;
    const isTie = Math.abs(diff) <= 0.20;
    
    // Lower avg_pick is better. If diff is negative, selected card was drafted earlier.
    const isCorrect = diff <= 0;
    
    let success = false;
    if (isTie) {
      success = true;
      setResultMsg('Close enough! (Tie)');
    } else if (isCorrect) {
      success = true;
      setResultMsg('Correct!');
    } else {
      success = false;
      setResultMsg('Incorrect!');
    }
    
    setTimeout(() => {
      if (success) {
        setScore(s => s + 1);
        pickNewPair(cards, selectedColors);
        setGameState(prevState => prevState === 'gameover' ? 'gameover' : 'playing');
      } else {
        const newLives = lives - 1;
        setLives(newLives);
        if (newLives <= 0) {
          setGameState('gameover');
        } else {
          pickNewPair(cards, selectedColors);
          setGameState('playing');
        }
      }
    }, 1500);
  };

  const handleRestart = () => {
    setScore(0);
    setLives(3);
    pickNewPair(cards, selectedColors);
    setGameState('playing');
  };

  const currentMode = getGuildFromColors(selectedColors);

  return (
    <div className="glass-panel fade-in">
      <div style={{ width: '100%', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <label htmlFor="set-select" style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 'bold' }}>SET</label>
          <select 
            id="set-select"
            className="mode-selector"
            value={activeSet} 
            onChange={(e) => setActiveSet(e.target.value)}
            disabled={gameState === 'loading'}
          >
            {SETS.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <ManaSelector 
          selectedColors={selectedColors} 
          onChange={setSelectedColors} 
        />
        
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Data Source: <strong>{currentMode === 'Overall' ? 'Overall' : currentMode}</strong>
        </div>

      </div>

      {gameState === 'loading' && <div className="subtitle">Loading card data...</div>}
      {gameState === 'error' && <div className="subtitle" style={{ color: 'var(--incorrect)' }}>Error loading data. Not enough valid cards.</div>}
      
      {gameState === 'gameover' && <GameOverScreen score={score} onRestart={handleRestart} />}

      {(gameState === 'playing' || gameState === 'result') && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '16px', alignItems: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
              Score: <span style={{ color: 'var(--accent)' }}>{score}</span>
            </div>
            <LivesCounter lives={lives} />
          </div>
          
          <div style={{ display: 'flex', gap: '16px', width: '100%', alignItems: 'stretch' }}>
            <CardButton 
              card={currentPair[0]} 
              onClick={() => handleCardClick(0)}
              disabled={gameState !== 'playing'}
              isCorrect={Math.abs(currentPair[0].avg_pick - currentPair[1].avg_pick) <= 0.20 ? true : currentPair[0].avg_pick <= currentPair[1].avg_pick}
              showResult={gameState === 'result'}
            />
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--text-muted)' }}>
              VS
            </div>

            <CardButton 
              card={currentPair[1]} 
              onClick={() => handleCardClick(1)}
              disabled={gameState !== 'playing'}
              isCorrect={Math.abs(currentPair[1].avg_pick - currentPair[0].avg_pick) <= 0.20 ? true : currentPair[1].avg_pick <= currentPair[0].avg_pick}
              showResult={gameState === 'result'}
            />
          </div>
          
          {gameState === 'result' && (
            <div className="pop-anim" style={{ 
              marginTop: '24px', 
              fontSize: '20px', 
              fontWeight: 'bold',
              color: resultMsg === 'Incorrect!' ? 'var(--incorrect)' : 'var(--correct)'
            }}>
              {resultMsg}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GameScreen;
