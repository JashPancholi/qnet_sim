import React, { useState, useEffect } from 'react';
import { User, UserMinus, ShieldAlert, Info } from 'lucide-react';
import './QuantumChannel.css';

const QuantumChannel = ({ results, evePresent, speed, isPaused, onAnimationComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const getPhotonSymbol = (basis, bit) => {
    if (basis === undefined || bit === undefined) return '';
    if (basis === 0) return bit === 0 ? '→' : '↑';
    return bit === 0 ? '↗' : '↖';
  };

  useEffect(() => {
    if (!results || isPaused) return;

    if (currentIndex >= results.alice_bits.length) {
        if(onAnimationComplete) onAnimationComplete();
        return;
    }

    const timer = setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
    }, 1500 / speed); 

    return () => clearTimeout(timer);
  }, [currentIndex, results, speed, isPaused, onAnimationComplete]);

  if (!results) return null;

  const currentAliceBit = results.alice_bits[currentIndex];
  const currentAliceBasis = results.alice_bases[currentIndex];
  
  // Fetch Eve's data for the current photon
  const currentEveBit = evePresent && results.eve_results ? results.eve_results[currentIndex] : null;
  const currentEveBasis = evePresent && results.eve_bases ? results.eve_bases[currentIndex] : null;

  const isFinished = currentIndex >= results.alice_bits.length;

  const animationStyle = { 
    animationDuration: `${1.5 / speed}s`,
    animationPlayState: isPaused ? 'paused' : 'running' 
  };

  return (
    <div className="quantum-channel-wrapper glass-panel">
      <div className="quantum-network">
        
        <div className="photon-counter">
          {isFinished 
            ? `Transmission Complete: ${results.alice_bits.length} Photons Sent` 
            : `Transmitting Photon ${currentIndex + 1} of ${results.alice_bits.length}`
          }
        </div>

        <div className="node alice">
          <div className="icon-wrapper blue"><User size={32} strokeWidth={2.5} /></div>
          <h3>Alice</h3>
          {!isFinished && (
            <div className="node-stats">
              <span className="stat-label">Encoding</span>
              <p>Bit: <strong>{currentAliceBit}</strong></p>
              <p>Basis: <strong>{currentAliceBasis === 0 ? 'Rectilinear (+)' : 'Diagonal (x)'}</strong></p>
            </div>
          )}
        </div>

        <div className="channel">
          <div className="fiber-optic-cable"></div>
          
          {!isFinished && (
            <div className={`photon ${evePresent ? 'intercepted' : 'direct'}`} key={currentIndex} style={animationStyle}>
               {/* NEW: The arrow splits into two spans to handle the halfway swap! */}
               {evePresent ? (
                 <>
                   <span className="alice-arrow">{getPhotonSymbol(currentAliceBasis, currentAliceBit)}</span>
                   <span className="eve-arrow">{getPhotonSymbol(currentEveBasis, currentEveBit)}</span>
                 </>
               ) : (
                 <span className="alice-arrow">{getPhotonSymbol(currentAliceBasis, currentAliceBit)}</span>
               )}
            </div>
          )}

          {evePresent && (
            <div className="node eve">
              <div className="icon-wrapper red"><ShieldAlert size={32} strokeWidth={2.5} /></div>
              <h3>Eve</h3>
              {!isFinished && results.eve_bases && (
                <div className="node-stats eve-stats">
                  <span className="stat-label">Intercepted</span>
                  <p>Guessed Bit: <strong>{results.eve_results[currentIndex]}</strong></p>
                  <p>Basis: <strong>{results.eve_bases[currentIndex] === 0 ? 'Rectilinear (+)' : 'Diagonal (x)'}</strong></p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="node bob">
          <div className="icon-wrapper purple"><UserMinus size={32} strokeWidth={2.5} /></div>
          <h3>Bob</h3>
          {currentIndex > 0 && !isFinished && (
             <div className="node-stats">
               <span className="stat-label">Measurement</span>
               <p>Result: <strong>{results.bob_results[currentIndex - 1]}</strong></p>
               <p>Basis: <strong>{results.bob_bases[currentIndex - 1] === 0 ? 'Rectilinear (+)' : 'Diagonal (x)'}</strong></p>
             </div>
          )}
        </div>
      </div>

      <div className="qubit-legend">
        <div className="legend-header">
          <Info size={18} strokeWidth={2.5}/> <h4>Qubit Polarization Legend</h4>
        </div>
        <div className="legend-grid">
          <div className="legend-col">
            <h5>Rectilinear Basis (+)</h5>
            <div className="legend-item"><span className="arrow">→</span> Bit 0 (0°)</div>
            <div className="legend-item"><span className="arrow">↑</span> Bit 1 (90°)</div>
          </div>
          <div className="legend-col">
            <h5>Diagonal Basis (x)</h5>
            <div className="legend-item"><span className="arrow">↗</span> Bit 0 (45°)</div>
            <div className="legend-item"><span className="arrow">↖</span> Bit 1 (135°)</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuantumChannel;