import React, { useState, useEffect, useMemo } from 'react';
import { getGuildFromColors, BASIC_LANDS } from '../utils';

const SortOptions = [
  { id: 'winrate', label: 'Top Win Rate' },
  { id: 'value', label: 'Top Value' },
  { id: 'hidden_gems', label: 'Hidden Gems' }
];

const LearningScreen = ({ 
  gameMode, 
  activeSet, 
  selectedColors, 
  masterMetadata, 
  masterStats, 
  dataState, 
  loadWarning 
}) => {
  const [sortBy, setSortBy] = useState('winrate');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);

  // Generate Deck
  const deck = useMemo(() => {
    if (dataState !== 'ready' || !masterMetadata || !masterStats) return [];

    const mode = getGuildFromColors(selectedColors);
    
    let validCards = Object.values(masterMetadata).filter(card => {
      if (BASIC_LANDS.has(card.name)) return false;
      
      // Color Filter
      if (selectedColors.length > 0) {
        if (!card.color || card.color === "") return true;
        for (let i = 0; i < card.color.length; i++) {
          if (!selectedColors.includes(card.color[i])) return false;
        }
      }

      return true;
    });

    validCards = validCards.map(card => {
      const stats = masterStats[card.name] || {};
      const specific = stats[mode] || {};
      const overall = stats['Overall'] || {};
      
      return {
        ...card,
        avg_pick: specific.pick ?? overall.pick ?? 15.0,
        win_rate: specific.wr ?? overall.wr ?? null
      };
    }).filter(c => c.avg_pick > 0);

    // Sort based on selected option
    if (sortBy === 'winrate') {
      validCards.sort((a, b) => (b.win_rate || 0) - (a.win_rate || 0));
    } else if (sortBy === 'value') {
      validCards.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === 'hidden_gems') {
      validCards = validCards.filter(c => c.avg_pick >= 5.0 && (c.win_rate || 0) >= 0.58);
      validCards.sort((a, b) => (b.win_rate || 0) - (a.win_rate || 0));
    }

    return validCards.slice(0, 20); // Top 20 cards
  }, [masterMetadata, masterStats, selectedColors, sortBy, dataState]);

  // Reset index when deck changes
  useEffect(() => {
    setCurrentIndex(0);
    setIsRevealed(false);
  }, [deck]);

  if (dataState === 'loading') {
    return <div className="glass-panel fade-in" style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>;
  }

  if (dataState === 'error') {
    return <div className="glass-panel fade-in" style={{ textAlign: 'center', padding: '40px' }}>Error loading data.</div>;
  }

  if (deck.length === 0) {
    return (
      <div className="glass-panel fade-in" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '12px' }}>No Cards Found</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6' }}>
          Try a different set or sort option.
        </p>
      </div>
    );
  }

  const card = deck[currentIndex];

  const handleNext = () => {
    if (currentIndex < deck.length - 1) {
      setCurrentIndex(c => c + 1);
      setIsRevealed(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(c => c - 1);
      setIsRevealed(false);
    }
  };

  return (
    <div className="glass-panel fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* Sort Options Segmented Control */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px' }}>
        {SortOptions.map(opt => (
          <button
            key={opt.id}
            onClick={() => setSortBy(opt.id)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              background: sortBy === opt.id ? 'var(--accent)' : 'transparent',
              color: sortBy === opt.id ? '#fff' : 'var(--text-muted)',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Flashcard Area */}
      <div style={{ position: 'relative', width: '100%', maxWidth: '340px', aspectRatio: '2.5/3.5', cursor: 'pointer' }} onClick={() => setIsRevealed(!isRevealed)}>
        <img 
          src={card.image_url} 
          alt={card.name} 
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4.75% / 3.5%', boxShadow: '0 10px 20px rgba(0,0,0,0.5)' }} 
        />
        
        {/* Data Overlay */}
        {isRevealed && (
          <div className="fade-in" style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.8) 70%, transparent 100%)',
            padding: '40px 20px 20px',
            borderBottomLeftRadius: '4.75% / 3.5%',
            borderBottomRightRadius: '4.75% / 3.5%',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            color: '#fff'
          }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--accent)' }}>
              #{currentIndex + 1} {SortOptions.find(o => o.id === sortBy)?.label}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Win Rate</span>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: card.win_rate >= 0.62 ? 'gold' : card.win_rate >= 0.58 ? 'var(--correct)' : '#fff' }}>
                {card.win_rate ? (card.win_rate * 100).toFixed(1) + '%' : 'N/A'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Avg Pick</span>
              <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
                {card.avg_pick?.toFixed(2)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Market Value</span>
              <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
                ${card.price?.toFixed(2) || '0.00'}
              </span>
            </div>
          </div>
        )}
      </div>

      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px', fontStyle: 'italic' }}>
        {isRevealed ? 'Tap card to hide stats' : 'Tap card to reveal stats'}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '340px', marginTop: '24px' }}>
        <button 
          onClick={handlePrev}
          disabled={currentIndex === 0}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: '8px',
            opacity: currentIndex === 0 ? 0.3 : 1,
            cursor: currentIndex === 0 ? 'default' : 'pointer'
          }}
        >
          &larr; Previous
        </button>
        <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
          {currentIndex + 1} / {deck.length}
        </div>
        <button 
          onClick={handleNext}
          disabled={currentIndex === deck.length - 1}
          style={{
            background: 'var(--accent)',
            border: 'none',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: '8px',
            opacity: currentIndex === deck.length - 1 ? 0.3 : 1,
            cursor: currentIndex === deck.length - 1 ? 'default' : 'pointer'
          }}
        >
          Next &rarr;
        </button>
      </div>

    </div>
  );
};

export default LearningScreen;
