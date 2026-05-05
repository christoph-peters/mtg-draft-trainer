import React, { useState, useEffect } from 'react';
import CardButton from './CardButton';
import LivesCounter from './LivesCounter';
import GameOverScreen from './GameOverScreen';
import ManaSelector from './ManaSelector';

const BASIC_LANDS = new Set(["Plains", "Island", "Swamp", "Mountain", "Forest", "Snow-Covered Plains", "Snow-Covered Island", "Snow-Covered Swamp", "Snow-Covered Mountain", "Snow-Covered Forest", "Wastes"]);

// Ordered by release date, newest first
const SETS = [
  { id: 'FDN', name: 'Foundations (2024)' },
  { id: 'DSK', name: 'Duskmourn (2024)' },
  { id: 'BLB', name: 'Bloomburrow (2024)' },
  { id: 'MH3', name: 'Modern Horizons 3 (2024)' },
  { id: 'OTJ', name: 'Outlaws of Thunder Junction (2024)' },
  { id: 'MKM', name: 'Karlov Manor (2024)' },
  { id: 'LCI', name: 'Lost Caverns of Ixalan (2023)' },
  { id: 'WOE', name: 'Wilds of Eldraine (2023)' },
  { id: 'LTR', name: 'Lord of the Rings (2023)' },
  { id: 'MOM', name: 'March of the Machine (2023)' },
  { id: 'ONE', name: 'Phyrexia: All Will Be One (2023)' },
  { id: 'BRO', name: "Brothers' War (2022)" },
  { id: 'DMU', name: 'Dominaria United (2022)' },
  { id: 'SNC', name: 'New Capenna (2022)' },
  { id: 'NEO', name: 'Kamigawa: Neon Dynasty (2022)' },
  { id: 'VOW', name: 'Crimson Vow (2021)' }
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

const GameScreen = ({ layout = 'stack', gameMode = 'draft' }) => {
  const [activeSet, setActiveSet] = useState('MH3');
  const [selectedColors, setSelectedColors] = useState([]);
  
  const [masterMetadata, setMasterMetadata] = useState(null);
  const [masterStats, setMasterStats] = useState(null);
  
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameState, setGameState] = useState('loading'); // loading, playing, result, gameover
  const [currentPair, setCurrentPair] = useState([]);
  const [selectedCardIdx, setSelectedCardIdx] = useState(null);
  const [resultMsg, setResultMsg] = useState('');
  const [loadWarning, setLoadWarning] = useState('');
  // Track recently seen card names to avoid immediate repeats
  const recentlySeenRef = React.useRef(new Set());

  // Load data when set changes
  useEffect(() => {
    const loadSetData = async () => {
      setGameState('loading');
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
        setScore(0);
        setLives(3);
        setGameState('playing');
      } catch (err) {
        console.error('Failed to load card data', err);
        setMasterMetadata(null);
        setMasterStats(null);
        setGameState('error');
      }
    };

    loadSetData();
  }, [activeSet]);

  // Handle color/mode changes (just pick new pair)
  useEffect(() => {
    if (masterMetadata && masterStats) {
      pickNewPair();
    }
  }, [selectedColors, gameMode, masterMetadata]);

  const pickNewPair = () => {
    if (!masterMetadata || !masterStats) return;

    const mode = getGuildFromColors(selectedColors);
    
    // 1. Get base list of valid cards for this set/mode
    let validCards = Object.values(masterMetadata).filter(card => {
      // Basic Land Filter
      if (BASIC_LANDS.has(card.name)) return false;
      
      // Color Filter (only in draft/winrate mode)
      if (gameMode === 'draft' || gameMode === 'winrate') {
        if (selectedColors.length > 0) {
          if (!card.color || card.color === "") return true;
          for (let i = 0; i < card.color.length; i++) {
            if (!selectedColors.includes(card.color[i])) return false;
          }
        }
      }

      // Value mode specific price filter
      if (gameMode === 'value' && card.price < 1.00) return false;

      return true;
    });

    // 2. Attach stats for the selected archetype(s)
    // For simplicity, we'll use the 'mode' stats, or fallback to 'Overall'
    validCards = validCards.map(card => {
      const stats = masterStats[card.name] || {};
      const archetypeStats = stats[mode] || stats['Overall'] || {};
      
      return {
        ...card,
        avg_pick: archetypeStats.pick || 15.0,
        win_rate: archetypeStats.wr || null
      };
    }).filter(c => c.avg_pick > 0);

    if (validCards.length < 2) {
      setGameState('error');
      setCurrentPair([]);
      return;
    }

    setGameState('playing');

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

    if (weights.length === 0) {
      setGameState('error');
      return;
    }

    const pickWeighted = (excludeIdx = -1) => {
      const w = weights.map((wt, i) => (i === excludeIdx ? 0 : wt));
      const total = w.reduce((a, b) => a + b, 0);
      if (total === 0) return 0;
      let rand = Math.random() * total;
      for (let i = 0; i < w.length; i++) {
        rand -= w[i];
        if (rand <= 0) return i;
      }
      return w.length - 1;
    };

    const idx1 = pickWeighted();
    const idx2 = pickWeighted(idx1);

    if (!validCards[idx1] || !validCards[idx2]) {
      setGameState('error');
      return;
    }

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
    
    let success = false;
    
    if (gameMode === 'draft') {
      const diff = selectedCard.avg_pick - otherCard.avg_pick;
      const isTie = Math.abs(diff) <= 0.20;
      const isCorrect = diff <= 0;
      
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
    } else if (gameMode === 'value') {
      // Value Mode Logic
      const p1 = selectedCard.price || 0;
      const p2 = otherCard.price || 0;
      
      // Threshold for "Bulk"
      const BULK_THRESHOLD = 1.00;
      const isP1Bulk = p1 < BULK_THRESHOLD;
      const isP2Bulk = p2 < BULK_THRESHOLD;
      
      if (isP1Bulk && isP2Bulk) {
        success = true;
        setResultMsg('Both are bulk! (Tie)');
      } else if (p1 >= p2) {
        success = true;
        setResultMsg('Correct! Worth more.');
      } else {
        success = false;
        setResultMsg('Incorrect! Worth less.');
      }
    } else if (gameMode === 'winrate') {
      // Win Rate Logic
      const wr1 = selectedCard.win_rate || 0;
      const wr2 = otherCard.win_rate || 0;
      
      const diff = wr1 - wr2;
      const isTie = Math.abs(diff) <= 0.005; // 0.5% tie threshold
      
      if (isTie) {
        success = true;
        setResultMsg('Close enough! (Tie)');
      } else if (wr1 >= wr2) {
        success = true;
        setResultMsg('Correct! Higher win rate.');
      } else {
        success = false;
        setResultMsg('Incorrect! Lower win rate.');
      }
    }
    
    setTimeout(() => {
      if (success) {
        setScore(s => s + 1);
        pickNewPair();
        setGameState(prevState => prevState === 'gameover' ? 'gameover' : 'playing');
      } else {
        const newLives = lives - 1;
        setLives(newLives);
        if (newLives <= 0) {
          setGameState('gameover');
        } else {
          pickNewPair();
          setGameState('playing');
        }
      }
    }, 1500);
  };

  const handleRestart = () => {
    setScore(0);
    setLives(3);
    pickNewPair();
    setGameState('playing');
  };

  const currentMode = getGuildFromColors(selectedColors);

  return (
    <div className="glass-panel fade-in">
      <div style={{ width: '100%', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', padding: '0 12px' }}>
        
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

        {(gameMode === 'draft' || gameMode === 'winrate') && (
          <>
            <ManaSelector 
              selectedColors={selectedColors} 
              onChange={setSelectedColors} 
            />
            
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Data Source: <strong>{currentMode === 'Overall' && selectedColors.length > 2 ? [...selectedColors].sort().join('') : currentMode}</strong>
            </div>
          </>
        )}
        {loadWarning && (
          <div style={{ fontSize: '12px', color: '#f59e0b', marginTop: '4px' }}>
            {loadWarning}
          </div>
        )}

      </div>

      {gameState === 'error' && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
          <h2 style={{ fontSize: '18px', marginBottom: '12px' }}>No Cards Found</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6' }}>
            {gameMode === 'value' 
              ? "This set doesn't have enough cards worth > $1.00 for this mode yet. Try a different set like MH3 or BLB!"
              : "Not enough valid cards found for these colors in this set."}
          </p>
        </div>
      )}
      
      {gameState === 'gameover' && <GameOverScreen score={score} onRestart={handleRestart} />}

      {(gameState === 'playing' || gameState === 'result') && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '16px', alignItems: 'center', padding: '0 12px' }}>
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
                isCorrect={
                  gameMode === 'draft' 
                    ? (Math.abs(currentPair[0].avg_pick - currentPair[1].avg_pick) <= 0.20 || currentPair[0].avg_pick <= currentPair[1].avg_pick)
                    : gameMode === 'winrate'
                    ? (Math.abs((currentPair[0].win_rate || 0) - (currentPair[1].win_rate || 0)) <= 0.005 || (currentPair[0].win_rate || 0) >= (currentPair[1].win_rate || 0))
                    : (currentPair[0].price >= 1.0 || currentPair[1].price < 1.0) && (currentPair[0].price >= currentPair[1].price || (currentPair[0].price < 1 && currentPair[1].price < 1))
                }
                showResult={gameState === 'result'}
                resultType={gameMode === 'draft' ? 'ata' : gameMode === 'winrate' ? 'winrate' : 'price'}
              />
            </div>
            
            <div className="vs-divider">VS</div>

            <div className="card-wrapper">
              <CardButton 
                card={currentPair[1]} 
                onClick={() => handleCardClick(1)}
                disabled={gameState !== 'playing'}
                isCorrect={
                  gameMode === 'draft'
                    ? (Math.abs(currentPair[1].avg_pick - currentPair[0].avg_pick) <= 0.20 || currentPair[1].avg_pick <= currentPair[0].avg_pick)
                    : gameMode === 'winrate'
                    ? (Math.abs((currentPair[1].win_rate || 0) - (currentPair[0].win_rate || 0)) <= 0.005 || (currentPair[1].win_rate || 0) >= (currentPair[0].win_rate || 0))
                    : (currentPair[1].price >= 1.0 || currentPair[0].price < 1.0) && (currentPair[1].price >= currentPair[0].price || (currentPair[1].price < 1 && currentPair[0].price < 1))
                }
                showResult={gameState === 'result'}
                resultType={gameMode === 'draft' ? 'ata' : gameMode === 'winrate' ? 'winrate' : 'price'}
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
