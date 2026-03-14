import React, { useState, useEffect } from 'react';
import { User, UserMinus, ShieldAlert, Info, ArrowRight, ArrowUp, ArrowUpRight, ArrowUpLeft } from 'lucide-react';
import './QuantumChannel.css';

const QuantumChannel = ({ results, evePresent, speed, isPaused, onAnimationComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const getPhotonSymbol = (basis, bit) => {
    if (basis === undefined || bit === undefined) return null;
    const props = { size: 36, strokeWidth: 3 };
    if (basis === 0) return bit === 0 ? <ArrowRight {...props} /> : <ArrowUp {...props} />;
    return bit === 0 ? <ArrowUpRight {...props} /> : <ArrowUpLeft {...props} />;
  };

  useEffect(() => {
    if (!results || isPaused) return;

    if (currentIndex >= results.alice_bits.length) {
      if (onAnimationComplete) onAnimationComplete();
      return;
    }

    const timer = setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
    }, 1500 / speed);

    return () => clearTimeout(timer);
  }, [currentIndex, results, speed, isPaused, onAnimationComplete]);

  if (!results) return null;

  // --- LOGIC VARIABLES (The missing pieces that caused the crash) ---
  const isFinished = currentIndex >= results.alice_bits.length;
  const currentAliceBit = results.alice_bits[currentIndex];
  const currentAliceBasis = results.alice_bases[currentIndex];
  
  const isPNS = evePresent && results.attack_type === 'PNS';
  const isMultiPhoton = isPNS && results.pulse_types?.[currentIndex] === 2;
  
  const currentEveBit = evePresent && results.eve_results ? results.eve_results[currentIndex] : null;
  const currentEveBasis = evePresent && results.eve_bases ? results.eve_bases[currentIndex] : null;

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
            <>
              {/* PRIMARY PHOTON */}
              <div className={`photon ${evePresent && !isPNS ? 'intercepted' : 'direct'}`} key={`main-${currentIndex}`} style={animationStyle}>
                 <span className="alice-arrow">{getPhotonSymbol(currentAliceBasis, currentAliceBit)}</span>
                 {evePresent && !isPNS && (
                   <span className="eve-arrow">{getPhotonSymbol(currentEveBasis, currentEveBit)}</span>
                 )}
              </div>

              {/* SECONDARY PHOTON (PNS STOLEN COPY) */}
              {isMultiPhoton && (
                <div className="photon pns-stolen" key={`stolen-${currentIndex}`} style={animationStyle}>
                   <span className="alice-arrow">{getPhotonSymbol(currentAliceBasis, currentAliceBit)}</span>
                </div>
              )}
            </>
          )}

          {evePresent && (
            <div className="node eve">
              <div className="icon-wrapper red"><ShieldAlert size={32} strokeWidth={2.5} /></div>
              <h3>Eve</h3>
              {!isFinished && (
                <div className="node-stats eve-stats">
                  {isPNS ? (
                    <>
                      <span className="stat-label">PNS Attack Vector</span>
                      {isMultiPhoton ? (
                        <>
                          <p className="text-purple" style={{ fontSize: '0.8rem', marginBottom: '4px' }}>
                            <strong>Multi-Photon Split</strong>
                          </p>
                          <div style={{ background: 'rgba(211, 47, 47, 0.1)', padding: '5px', borderRadius: '4px' }}>
                            <p className="text-red" style={{ margin: 0 }}><strong>Status:</strong> Stored</p>
                            <p className="text-red" style={{ margin: 0 }}><strong>Action:</strong> Await Basis</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-gray" style={{ fontSize: '0.8rem', marginBottom: '4px' }}>Single Photon</p>
                          <p style={{ fontStyle: 'italic', color: '#666' }}>Pass-through</p>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="stat-label">Intercepted (I-R)</span>
                      <p>Bit: <strong>{currentEveBit}</strong></p>
                      <p>Basis: <strong>{currentEveBasis === 0 ? 'Rectilinear (+)' : 'Diagonal (x)'}</strong></p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="node bob">
          <div className="icon-wrapper purple"><UserMinus size={32} strokeWidth={2.5} /></div>
          <h3>Bob</h3>
          {!isFinished && (
             <div className="node-stats">
               <span className="stat-label">Measurement</span>
               <p>Result: <strong>{results.bob_results[currentIndex]}</strong></p>
               <p>Basis: <strong>{results.bob_bases[currentIndex] === 0 ? 'Rectilinear (+)' : 'Diagonal (x)'}</strong></p>
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
            <div className="legend-item"><span className="arrow"><ArrowRight size={24} strokeWidth={3}/></span> Bit 0 (0°)</div>
            <div className="legend-item"><span className="arrow"><ArrowUp size={24} strokeWidth={3}/></span> Bit 1 (90°)</div>
          </div>
          <div className="legend-col">
            <h5>Diagonal Basis (x)</h5>
            <div className="legend-item"><span className="arrow"><ArrowUpRight size={24} strokeWidth={3}/></span> Bit 0 (45°)</div>
            <div className="legend-item"><span className="arrow"><ArrowUpLeft size={24} strokeWidth={3}/></span> Bit 1 (135°)</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuantumChannel;