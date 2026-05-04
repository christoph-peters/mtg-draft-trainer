import React, { useState, useEffect } from 'react';
import CardButton from './CardButton';
import LivesCounter from './LivesCounter';
import GameOverScreen from './GameOverScreen';
import ManaSelector from './ManaSelector';

// Ordered by release date, newest first
const SETS = [
  { id: 'SOS', name: 'Secrets of Strixhaven (2026)' },
  { id: 'TMT', name: 'TMNT (2026)' },
  { id: 'ECL', name: 'Lorwyn Eclipsed (2026)' },
  { id: 'TLA', name: 'Avatar: The Last Airbender (2025)' },
  { id: 'SPM', name: "Marvel's Spider-Man (2025)" },
  { id: 'EOE', name: 'Edge of Eternities (2025)' },
  { id: 'FIN', name: 'Final Fantasy (2025)' },
  { id: 'TDM', name: 'Tarkir: Dragonstorm (2025)' },
  { id: 'DFT', name: 'Aetherdrift (2025)' },
  { id: 'INR', name: 'Innistrad Remastered (2025)' },
  { id: 'FDN', name: 'Foundations (2024)' },
  { id: 'DSK', name: 'Duskmourn: House of Horror (2024)' },
  { id: 'BLB', name: 'Bloomburrow (2024)' },
  { id: 'MH3', name: 'Modern Horizons 3 (2024)' },
  { id: 'OTJ', name: 'Outlaws of Thunder Junction (2024)' }
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

const GameScreen = ({ layout = 'stack' }) => {
  const [activeSet, setActiveSet] = useState('SOS');
  const [selectedColors, setSelectedColors] = useState([]);
  
  const [cards, setCards] = useState([]);
  const [currentPair, setCurrentPair] = useState([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameState, setGameState] = useState('loading'); // loading, playing, result, gameover
  const [selectedCardIdx, setSelectedCardIdx] = useState(null);
  const [resultMsg, setResultMsg] = useState('');
  const [loadWarning, setLoadWarning] = useState('');
  // Track recently seen card names to avoid immediate repeats
  const recentlySeenRef = React.useRef(new Set());

  // Load data when set or selectedColors (meaning mode) changes
  useEffect(() => {
    setGameState('loading');
    setLoadWarning('');
    const mode = getGuildFromColors(selectedColors);
    const baseUrl = import.meta.env.BASE_URL || '/';
    const overallFilename = `${activeSet.toLowerCase()}_top_players.json`;

    const fetchJson = async (url) => {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to fetch ${url}: ${res.status}`);
      }
      return res.json();
    };

    const loadOverall = async () => {
      const overallUrl = `${baseUrl}data/${overallFilename}`;
      const data = await fetchJson(overallUrl);
      setLoadWarning(`Using overall ${activeSet} data because set-specific data was unavailable.`);
      return data;
    };

    const loadSingleMode = async () => {
      const filename = mode === 'Overall' ? overallFilename : `${activeSet.toLowerCase()}_top_players_${mode}.json`;
      const url = `${baseUrl}data/${filename}`;
      try {
        return await fetchJson(url);
      } catch (err) {
        console.warn(`Could not load ${filename}; falling back to overall data.`, err);
        return await loadOverall();
      }
    };

    const loadMulticolor = async () => {
      const colorCombos = [];
      for (let i = 0; i < selectedColors.length; i++) {
        for (let j = i + 1; j < selectedColors.length; j++) {
          colorCombos.push(selectedColors[i] + selectedColors[j]);
        }
      }

      const dataArrays = await Promise.all(
        colorCombos.map(async (combo) => {
          const filename = `${activeSet.toLowerCase()}_top_players_${combo}.json`;
          const url = `${baseUrl}data/${filename}`;
          try {
            return await fetchJson(url);
          } catch (err) {
            console.warn(`Failed to load ${filename}; skipping`, err);
            return [];
          }
        })
      );

      const combinedData = [];
      const seenNames = new Set();
      dataArrays.flat().forEach((card) => {
        if (!card || !card.name) return;
        if (!seenNames.has(card.name)) {
          seenNames.add(card.name);
          combinedData.push(card);
        }
      });

      if (combinedData.length >= 2) {
        return combinedData;
      }

      console.warn('No multi-color archetype files available; falling back to overall data.');
      return await loadOverall();
    };

    (async () => {
      try {
        const data = selectedColors.length >= 3 ? await loadMulticolor() : await loadSingleMode();
        setCards(data);
        setScore(0);
        setLives(3);
        pickNewPair(data, selectedColors);
        setGameState('playing');
      } catch (err) {
        console.error('Failed to load card data', err);
        setGameState('error');
      }
    })();
  }, [activeSet, selectedColors]);

  const pickNewPair = (cardData, currentColors) => {
    if (!cardData || cardData.length < 2) {
      setGameState('error');
      return;
    }

    // Filter cards to only include on-color and colorless cards for the selected colors
    const validCards = cardData.filter(card => {
      if (!card.color || card.color === "") return true;
      if (currentColors.length === 0) return true;
      for (let i = 0; i < card.color.length; i++) {
        if (!currentColors.includes(card.color[i])) return false;
      }
      return true;
    });

    if (validCards.length < 2) {
      setGameState('error');
      return;
    }

    // --- Weighted random selection ---
    // Prefer cards not recently seen, and apply a weight so mid-pack cards
    // appear more often than the same top-5 bombs every round.
    // Cards are sorted by avg_pick asc; idx 0 = best. We weight by position
    // so that every card has a reasonable chance while still being seen.
    const n = validCards.length;
    const COOLDOWN = Math.min(10, Math.floor(n / 3)); // how many to cool down
    const recentlySeen = recentlySeenRef.current;

    const weights = validCards.map((card, i) => {
      if (recentlySeen.has(card.name)) return 0.05; // heavily de-prioritise recent
      // Mild ramp: cards in the middle of the list get a small boost
      const midBonus = 1 + 0.5 * Math.sin((i / n) * Math.PI);
      return midBonus;
    });

    const pickWeighted = (excludeIdx = -1) => {
      const w = weights.map((wt, i) => (i === excludeIdx ? 0 : wt));
      const total = w.reduce((a, b) => a + b, 0);
      let rand = Math.random() * total;
      for (let i = 0; i < w.length; i++) {
        rand -= w[i];
        if (rand <= 0) return i;
      }
      return w.length - 1;
    };

    const idx1 = pickWeighted();
    const idx2 = pickWeighted(idx1);

    // Update cooldown set
    recentlySeen.add(validCards[idx1].name);
    recentlySeen.add(validCards[idx2].name);
    if (recentlySeen.size > COOLDOWN * 2) {
      // Remove oldest entries by recreating the set from the tail
      const entries = Array.from(recentlySeen);
      recentlySeenRef.current = new Set(entries.slice(entries.length - COOLDOWN));
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
          Data Source: <strong>{currentMode === 'Overall' && selectedColors.length > 2 ? [...selectedColors].sort().join('') : currentMode}</strong>
        </div>
        {loadWarning && (
          <div style={{ fontSize: '12px', color: '#f59e0b', marginTop: '4px' }}>
            {loadWarning}
          </div>
        )}

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
          
          <div className={`card-pair card-pair--${layout}`}>
            <div className="card-wrapper">
              <CardButton 
                card={currentPair[0]} 
                onClick={() => handleCardClick(0)}
                disabled={gameState !== 'playing'}
                isCorrect={Math.abs(currentPair[0].avg_pick - currentPair[1].avg_pick) <= 0.20 ? true : currentPair[0].avg_pick <= currentPair[1].avg_pick}
                showResult={gameState === 'result'}
              />
            </div>
            
            <div className="vs-divider">VS</div>

            <div className="card-wrapper">
              <CardButton 
                card={currentPair[1]} 
                onClick={() => handleCardClick(1)}
                disabled={gameState !== 'playing'}
                isCorrect={Math.abs(currentPair[1].avg_pick - currentPair[0].avg_pick) <= 0.20 ? true : currentPair[1].avg_pick <= currentPair[0].avg_pick}
                showResult={gameState === 'result'}
              />
            </div>
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
