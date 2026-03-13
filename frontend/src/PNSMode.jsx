import React, { useState, useEffect } from 'react';
import { User, UserMinus, ShieldAlert, Box, AlertTriangle, Ghost } from 'lucide-react';
import './PNSAttack.css'; // Keep this name or rename your CSS file to PNSMode.css if you prefer
import './TrustedNetwork.css'; 

const PNSMode = ({ results, speed = 1, isPaused = false, onAnimationComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const numBits = results?.alice_bits?.length || 0;
  const isFinished = currentIndex >= numBits;

  // Tell the parent App when the animation is done
  useEffect(() => {
    if (isFinished && onAnimationComplete) {
      onAnimationComplete();
    }
  }, [isFinished, onAnimationComplete]);

  // Animation logic loop
  useEffect(() => {
    if (!results || isPaused) return;
    if (currentIndex >= numBits) return;

    const timer = setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
    }, 1500 / speed);

    return () => clearTimeout(timer);
  }, [currentIndex, results, speed, isPaused, numBits]);

  if (!results) return null;

  const getPhotonSymbol = (basis, bit) => {
    if (basis === 0) return bit === 0 ? '→' : '↑';
    return bit === 0 ? '↗' : '↖';
  };

  const animationStyle = { 
    animationDuration: `${1.5 / speed}s`,
    animationPlayState: isPaused ? 'paused' : 'running' 
  };

  return (
    <div className="trusted-network-wrapper fade-in">
      <div className="glass-panel network-map-container pns-map-container">
        <div className="photon-counter">
          {isFinished ? `PHASE 1 COMPLETE: SIFTING BEGINS` : `TRANSMITTING PULSE ${currentIndex + 1} OF ${numBits}`}
        </div>
        
        <div className="network-map pns-layout">
          {/* ALICE */}
          <div className="network-node">
            <div className="icon-wrapper blue"><User size={32} strokeWidth={2.5}/></div>
            <h3>Alice</h3>
            <div className="node-stats-container">
              {!isFinished && (
                <div className="node-stats">
                  <span className="stat-label">Encoding</span>
                  <p>Pulse: <strong>{results.photon_counts[currentIndex]} Photons</strong></p>
                  <p>Bit: <strong>{results.alice_bits[currentIndex]}</strong></p>
                  <p>Basis: <strong>{results.alice_bases[currentIndex] === 0 ? '+' : 'x'}</strong></p>
                </div>
              )}
            </div>
          </div>

          {/* THE LINK (CENTERED) */}
          <div className="pns-link-segment">
            <div className="fiber-optic-cable"></div>
            
            {!isFinished && (
              <div className="pns-animation-layer">
                {[...Array(results.photon_counts[currentIndex])].map((_, i) => {
                  const isStolen = results.eve_actions[currentIndex] === 'Split & Stored' && i === 0;
                  const offset = (i - (results.photon_counts[currentIndex] - 1) / 2) * 12; 
                  
                  return (
                    <div 
                      key={i} 
                      className={`photon ${isStolen ? 'pns-stolen' : 'pns-direct'}`} 
                      style={{ ...animationStyle, marginLeft: `${offset}px` }}
                    >
                      {getPhotonSymbol(results.alice_bases[currentIndex], results.alice_bits[currentIndex])}
                    </div>
                  );
                })}
              </div>
            )}

            {/* EVE NODE (Absolute Positioned for Precision) */}
            <div className="pns-eve-anchor">
              <div className="eve-header-stack">
                <div className="icon-wrapper red"><Ghost size={28} strokeWidth={2.5} /></div>
                <h4>Eve (PNS)</h4>
              </div>
              
              <div className="pns-action-badge">
                {!isFinished ? (
                   <p className={results.eve_actions[currentIndex] === 'Split & Stored' ? 'text-red font-bold' : 'text-gray'}>
                     {results.eve_actions[currentIndex]}
                   </p>
                ) : (
                   <p className="text-red"><strong>Awaiting Basis Reveal</strong></p>
                )}
              </div>

              <div className="q-memory-box no-underlay">
                <Box size={20} />
                <span>Q-Memory</span>
              </div>
            </div>
          </div>

          {/* BOB */}
          <div className="network-node">
            <div className="icon-wrapper purple"><UserMinus size={32} strokeWidth={2.5}/></div>
            <h3>Bob</h3>
            <div className="node-stats-container">
              {!isFinished && (
                <div className="node-stats">
                  <span className="stat-label">Measurement</span>
                  <p>Receives: <strong>{results.photon_counts[currentIndex] === 1 ? '1 Photon' : `${results.photon_counts[currentIndex] - 1} Photons`}</strong></p>
                  <p>Basis: <strong>{results.bob_bases[currentIndex] === 0 ? '+' : 'x'}</strong></p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isFinished && (
        <div className="glass-panel alert-panel fade-in">
          <AlertTriangle size={36} className="text-red" strokeWidth={2.5} />
          <div className="alert-text">
            <h2>Silent Compromise Detected</h2>
            <p>Eve successfully exploited multi-photon pulses by storing split photons in quantum memory. This attack is invisible because it does not trigger any errors (QBER is 0%).</p>
            <div className="stats-row">
              <span className="stat-pill green">System QBER: {(results.qber * 100).toFixed(1)}%</span>
              <span className="stat-pill red">Key Stolen: {(results.theft_percentage * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PNSMode;