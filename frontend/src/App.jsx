import React, { useState } from 'react';
import { Shield, AlertTriangle, Play, Square, Pause, Network } from 'lucide-react';
import './App.css';
import QuantumChannel from './QuantumChannel';
import TrustedNetwork from './TrustedNetwork';

function App() {
  const [mode, setMode] = useState('standard');
  const [numBits, setNumBits] = useState(20);
  const [evePresent, setEvePresent] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [results, setResults] = useState(null);

  const [numNodes, setNumNodes] = useState(1);
  const [compromisedLink, setCompromisedLink] = useState(-1);
  const [networkResults, setNetworkResults] = useState(null);

  const [loading, setLoading] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const runSimulation = async () => {
    setLoading(true); setResults(null); setNetworkResults(null);
    setAnimationComplete(false); setIsPaused(false);
    
    try {
      if (mode === 'standard') {
        const response = await fetch('http://127.0.0.1:5000/api/simulate/bb84', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ num_bits: numBits, eve_present: evePresent })
        });
        const data = await response.json();
        if (data.success) {
          // THE FAKE MATH IS GONE! We just pass the real Qiskit data straight to state.
          setResults(data.data);
        }
      } else {
        const response = await fetch('http://127.0.0.1:5000/api/simulate/network', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ num_nodes: numNodes, num_bits: numBits, compromised_link_index: compromisedLink })
        });
        const data = await response.json();
        if (data.success) {
          // THE FAKE MATH IS GONE! Trusted nodes gets the pure backend payload.
          setNetworkResults(data.data);
        }
      }
    } catch (error) {
      console.error("Error:", error); alert("Failed to connect to backend.");
    }
    setLoading(false);
  };

  const stopSimulation = () => {
    setResults(null); setNetworkResults(null); setLoading(false);
    setAnimationComplete(false); setIsPaused(false);
  };

  return (
    <div className={`app-wrapper ${mode === 'network' ? 'wide-wrapper' : ''}`}>
      <div className="main-content">
        <header className="app-header">
          <h1>Q-Net Simulator</h1>
          <p>Quantum Key Distribution Architecture</p>
        </header>

        <div className="glass-panel segmented-control">
          <button className={`segment ${mode === 'standard' ? 'active' : ''}`} onClick={() => { setMode('standard'); stopSimulation(); }}>
            Point-to-Point (BB84)
          </button>
          <button className={`segment ${mode === 'network' ? 'active' : ''}`} onClick={() => { setMode('network'); stopSimulation(); }}>
            <Network size={16} /> Trusted Nodes Relay
          </button>
        </div>

        <section className="glass-panel controls">
          <div className="settings-row">
            <div className="input-group">
              <label>Photons Per Link</label>
              <input type="number" value={numBits} onChange={(e) => setNumBits(parseInt(e.target.value))} min="20" max="100" />
            </div>

            <div className="input-group">
              <label>Simulation Speed</label>
              <select value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))}>
                <option value="0.25">0.25x (Slow)</option>
                <option value="0.5">0.5x</option>
                <option value="1">1x (Normal)</option>
                <option value="1.5">1.5x</option>
                <option value="2">2x (Fast)</option>
                <option value="3">3x (Very Fast)</option>
                <option value="4">4x (Ultra)</option>
                <option value="5">5x (Warp Speed)</option>
              </select>
            </div>

            {mode === 'network' && (
              <div className="input-group">
                <label>Trusted Nodes (Max 2)</label>
                <input type="number" value={numNodes} onChange={(e) => setNumNodes(Math.min(2, Math.max(1, parseInt(e.target.value))))} min="1" max="2" />
              </div>
            )}
          </div>
          
          {mode === 'standard' ? (
            <label className="toggle-switch">
              <input type="checkbox" checked={evePresent} onChange={(e) => setEvePresent(e.target.checked)} />
              <span className="slider"></span>
              <span className="toggle-label">Simulate Eavesdropper (Eve)</span>
            </label>
          ) : (
            <div className="input-group" style={{ width: '100%', marginTop: '10px' }}>
              <label>Attacker (Eve) Position</label>
              <select value={compromisedLink} onChange={(e) => setCompromisedLink(parseInt(e.target.value))}>
                <option value="-1">None (Network is Secure)</option>
                {[...Array(numNodes + 1)].map((_, i) => (
                  <option key={i} value={i}>
                    Compromise Link {i + 1} ({i === 0 ? 'Alice' : `Node ${i}`} ➔ {i === numNodes ? 'Bob' : `Node ${i + 1}`})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="action-buttons">
            {(!results && !networkResults) ? (
              <button className="btn-primary" onClick={runSimulation} disabled={loading}>
                <Play size={18} strokeWidth={2.5} /> {loading ? 'Computing...' : 'Run Simulation'}
              </button>
            ) : (
              <>
                {!animationComplete && (
                  <button className="btn-secondary" onClick={() => setIsPaused(!isPaused)}>
                    {isPaused ? <Play size={18} strokeWidth={2.5}/> : <Pause size={18} strokeWidth={2.5}/>} 
                    {isPaused ? 'Resume' : 'Pause'}
                  </button>
                )}
                <button className="btn-danger" onClick={stopSimulation}>
                  <Square size={18} strokeWidth={2.5} /> Reset
                </button>
              </>
            )}
          </div>
        </section>

        {mode === 'standard' && results && (
          <section className="results-wrapper">
            <QuantumChannel results={results} evePresent={evePresent} speed={speed} isPaused={isPaused} onAnimationComplete={() => setAnimationComplete(true)} />

            {animationComplete && (
              <div className="results-data-fade-in">
                <div className={`status-pill ${results.status === 'SECURE' ? 'secure' : 'compromised'}`}>
                  {results.status === 'SECURE' ? <Shield size={24} strokeWidth={2.5}/> : <AlertTriangle size={24} strokeWidth={2.5}/>}
                  <span>{results.status} • QBER: {(results.qber * 100).toFixed(2)}%</span>
                </div>
                
                <div className="glass-panel table-container">
                  <h3>Transmission Log</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>#</th><th>Alice Bit</th><th>Alice Basis</th>
                        {evePresent && <th className="eve-col-header">Eve Basis</th>}
                        {evePresent && <th className="eve-col-header">Eve Guessed Bit</th>}
                        <th>Bob Basis</th><th>Bob Result</th><th>Match Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.alice_bits.map((bit, index) => {
                        const basisMatch = results.alice_bases[index] === results.bob_bases[index];
                        const bitMatch = results.alice_bits[index] === results.bob_results[index];
                        const isSacrificed = results.sacrificed_indices?.includes(index);
                        
                        let rowClass = ''; 
                        let matchStatus = '';
                        
                        if (!basisMatch) { 
                          rowClass = 'row-discarded'; 
                          matchStatus = 'Discarded (Basis)'; 
                        } else if (isSacrificed) { 
                          // NEW: Split the sacrificed rows into valid (yellow) and corrupted (orange)
                          if (bitMatch) {
                            rowClass = 'row-sacrificed-valid'; 
                            matchStatus = 'Sacrificed (Valid)'; 
                          } else {
                            rowClass = 'row-sacrificed-corrupted'; 
                            matchStatus = 'Sacrificed (Corrupted!)'; 
                          }
                        } else if (bitMatch) { 
                          rowClass = 'row-correct'; 
                          matchStatus = 'Kept (Secret Key)'; 
                        } else { 
                          rowClass = 'row-corrupted'; 
                          matchStatus = 'Corrupted!'; 
                        }

                        const eveBasisStr = (evePresent && results.eve_bases) ? (results.eve_bases[index] === 0 ? '+' : 'x') : '-';
                        const eveBitStr = (evePresent && results.eve_results) ? results.eve_results[index] : '-';

                        return (
                          <tr key={index} className={rowClass}>
                            <td>{index + 1}</td><td>{bit}</td><td>{results.alice_bases[index] === 0 ? '+' : 'x'}</td>
                            {evePresent && <td className="eve-col-data">{eveBasisStr}</td>}
                            {evePresent && <td className="eve-col-data">{eveBitStr}</td>}
                            <td>{results.bob_bases[index] === 0 ? '+' : 'x'}</td><td>{results.bob_results[index]}</td><td>{matchStatus}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="final-keys">
                {/* --- THE KEYS --- */}
                {(() => {
                  const sortedSacrificed = results.sacrificed_indices ? [...results.sacrificed_indices].sort((a,b) => a - b) : [];
                  const aliceSacrificed = sortedSacrificed.map(idx => results.alice_bits[idx]).join('');
                  const bobSacrificed = sortedSacrificed.map(idx => results.bob_results[idx]).join('');
                  
                  return (
                    <div className="keys-container-full">
                      {/* 1. Sacrificed Keys (Greyed Out, White Background) */}
                      <div className="final-keys">
                        <div className="glass-panel key-box-wide" style={{ borderColor: '#e0e0e0' }}>
                          <h4 style={{ color: '#757575' }}>Alice's Sacrificed Key (Public Test)</h4>
                          <p className="monospace text-sacrificed">{aliceSacrificed || 'None'}</p>
                        </div>
                        <div className="glass-panel key-box-wide" style={{ borderColor: '#e0e0e0' }}>
                          <h4 style={{ color: '#757575' }}>Bob's Sacrificed Key (Public Test)</h4>
                          <p className="monospace text-sacrificed">{bobSacrificed || 'None'}</p>
                        </div>
                      </div>

                      {/* 2. Final Secret Keys (Dynamic Color, White Background) */}
                      <div className="final-keys">
                        <div className="glass-panel key-box-wide" style={{ borderColor: '#cfd8dc' }}>
                          <h4 style={{ color: '#455a64' }}>Alice's Final Secret Key (Secure)</h4>
                          <p className="monospace">
                            {results.alice_key.map((bit, i) => (
                              <span key={i} className={bit === results.bob_key[i] ? 'bit-match' : 'bit-mismatch'}>
                                {bit}
                              </span>
                            ))}
                          </p>
                        </div>
                        <div className="glass-panel key-box-wide" style={{ borderColor: '#cfd8dc' }}>
                          <h4 style={{ color: '#455a64' }}>Bob's Final Secret Key (Secure)</h4>
                          <p className="monospace">
                            {results.bob_key.map((bit, i) => (
                              <span key={i} className={bit === results.alice_key[i] ? 'bit-match' : 'bit-mismatch'}>
                                {bit}
                              </span>
                            ))}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
                </div>
              </div>
            )}
          </section>
        )}

        {mode === 'network' && networkResults && (
           <TrustedNetwork results={networkResults} compromisedLink={compromisedLink} speed={speed} isPaused={isPaused} />
        )}
      </div>

      <footer className="app-footer">
        <p>Made with a lot of Diet Coke and love by Neelay ✕ Jash</p>
      </footer>
    </div>
  );
}

export default App;