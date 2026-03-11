import React, { useState } from 'react';
import { Shield, AlertTriangle, Play, Square, Pause } from 'lucide-react';
import './App.css';
import QuantumChannel from './QuantumChannel';

function App() {
  const [numBits, setNumBits] = useState(20);
  const [evePresent, setEvePresent] = useState(false);
  const [speed, setSpeed] = useState(1);
  
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const runSimulation = async () => {
    setLoading(true); setResults(null); 
    setAnimationComplete(false); setIsPaused(false);
    
    try {
      const response = await fetch('http://127.0.0.1:5000/api/simulate/bb84', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ num_bits: numBits, eve_present: evePresent })
      });
      const data = await response.json();
      
      if (data.success) {
        const res = data.data;
        if (evePresent) {
          res.eve_bases = []; res.eve_results = [];
          for (let i = 0; i < res.alice_bits.length; i++) {
            if (res.alice_bases[i] === res.bob_bases[i] && res.alice_bits[i] !== res.bob_results[i]) {
               res.eve_bases.push(1 - res.alice_bases[i]); 
               res.eve_results.push(Math.random() < 0.5 ? 0 : 1); 
            } else {
               const eveBasis = Math.random() < 0.5 ? 0 : 1;
               res.eve_bases.push(eveBasis);
               if (eveBasis === res.alice_bases[i]) {
                  res.eve_results.push(res.alice_bits[i]);
               } else {
                  res.eve_results.push(Math.random() < 0.5 ? 0 : 1);
               }
            }
          }
        }
        setResults(res);
      }
    } catch (error) {
      console.error("Error connecting backend:", error);
      alert("Failed to connect to backend.");
    }
    setLoading(false);
  };

  const stopSimulation = () => {
    setResults(null); setLoading(false);
    setAnimationComplete(false); setIsPaused(false);
  };

  return (
    <div className="app-wrapper">
      <div className="main-content">
        <header className="app-header">
          <h1>Q-Net Simulator</h1>
          <p>BB84 Quantum Key Distribution</p>
        </header>

        <section className="glass-panel controls">
          <div className="settings-row">
            <div className="input-group">
              <label>Photons</label>
              <input type="number" value={numBits} onChange={(e) => setNumBits(parseInt(e.target.value))} min="10" max="100" />
            </div>
            <div className="input-group">
              <label>Simulation Speed</label>
              <select value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))}>
                <option value="0.25">0.25x</option>
                <option value="0.5">0.5x</option>
                <option value="1">1x (Normal)</option>
                <option value="1.5">1.5x</option>
                <option value="2">2x (Fast)</option>
              </select>
            </div>
          </div>
          
          <label className="toggle-switch">
            <input type="checkbox" checked={evePresent} onChange={(e) => setEvePresent(e.target.checked)} />
            <span className="slider"></span>
            <span className="toggle-label">Simulate Eavesdropper (Eve)</span>
          </label>

          <div className="action-buttons">
            {!results ? (
              <button className="btn-primary" onClick={runSimulation} disabled={loading}>
                <Play size={18} strokeWidth={2.5} /> {loading ? 'Initializing...' : 'Start Simulation'}
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
                  <Square size={18} strokeWidth={2.5} /> Stop
                </button>
              </>
            )}
          </div>
        </section>

        {results && (
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
                        <th>#</th>
                        <th>Alice Bit</th>
                        <th>Alice Basis</th>
                        <th>Bob Basis</th>
                        <th>Bob Result</th>
                        <th>Match Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.alice_bits.map((bit, index) => {
                        const basisMatch = results.alice_bases[index] === results.bob_bases[index];
                        const bitMatch = results.alice_bits[index] === results.bob_results[index];
                        
                        // NEW TABLE LOGIC
                        let rowClass = '';
                        let matchStatus = '';
                        
                        if (!basisMatch) {
                          rowClass = 'row-discarded';
                          matchStatus = 'Discarded';
                        } else if (bitMatch) {
                          rowClass = 'row-correct';
                          matchStatus = 'Kept (Valid)';
                        } else {
                          rowClass = 'row-corrupted';
                          matchStatus = 'Corrupted!';
                        }

                        return (
                          <tr key={index} className={rowClass}>
                            <td>{index + 1}</td>
                            <td>{bit}</td>
                            <td>{results.alice_bases[index] === 0 ? '+' : 'x'}</td>
                            <td>{results.bob_bases[index] === 0 ? '+' : 'x'}</td>
                            <td>{results.bob_results[index]}</td>
                            <td>{matchStatus}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="final-keys">
                  <div className="glass-panel key-box">
                    <h4>Alice's Sifted Key</h4>
                    <p className="monospace">{results.alice_key.join('')}</p>
                  </div>
                  <div className="glass-panel key-box">
                    <h4>Bob's Sifted Key</h4>
                    <p className="monospace">{results.bob_key.join('')}</p>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
      </div>

      <footer className="app-footer">
        <p>Made with a lot of Diet Coke and love by Neelay ✕ Jash</p>
      </footer>
    </div>
  );
}

export default App;