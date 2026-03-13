import React, { useState } from 'react';
import { Shield, AlertTriangle, Play, Square, Pause, Network, Ghost } from 'lucide-react';
import './App.css';
import QuantumChannel from './QuantumChannel';
import TrustedNetwork from './TrustedNetwork';
import PNSAttack from './PNSMode';

function App() {
  const [mode, setMode] = useState('standard'); 
  const [numBits, setNumBits] = useState(20);
  const [speed, setSpeed] = useState(1);
  const [results, setResults] = useState(null);

  const [evePresent, setEvePresent] = useState(false);

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
        if (data.success) setResults(data.data);
      } else if (mode === 'network') {
        const response = await fetch('http://127.0.0.1:5000/api/simulate/network', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ num_nodes: numNodes, num_bits: numBits, compromised_link_index: compromisedLink })
        });
        const data = await response.json();
        if (data.success) setNetworkResults(data.data);
      } else if (mode === 'pns') {
        const response = await fetch('http://127.0.0.1:5000/api/simulate/pns', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ num_bits: numBits })
        });
        const data = await response.json();
        if (data.success) setResults(data.data);
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

        <div className="segmented-control">
          <button className={`segment ${mode === 'standard' ? 'active' : ''}`} onClick={() => { setMode('standard'); stopSimulation(); }}>
            Point-to-Point (BB84)
          </button>
          <button className={`segment ${mode === 'network' ? 'active' : ''}`} onClick={() => { setMode('network'); stopSimulation(); }}>
            <Network size={18} /> Trusted Nodes
          </button>
          <button className={`segment ${mode === 'pns' ? 'active' : ''}`} onClick={() => { setMode('pns'); stopSimulation(); }}>
            <Ghost size={18} /> PNS Attack
          </button>
        </div>

        <section className="glass-panel controls">
          <div className="settings-row">
            <div className="input-group">
              <label>Photons Per Link / Pulse</label>
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
              </select>
            </div>

            {mode === 'network' && (
              <div className="input-group">
                <label>Trusted Nodes (Max 2)</label>
                <input type="number" value={numNodes} onChange={(e) => setNumNodes(Math.min(2, Math.max(1, parseInt(e.target.value))))} min="1" max="2" />
              </div>
            )}
          </div>
          
          {mode === 'standard' && (
            <label className="toggle-switch">
              <input type="checkbox" checked={evePresent} onChange={(e) => setEvePresent(e.target.checked)} />
              <span className="slider"></span>
              <span className="toggle-label">Simulate Intercept-Resend Attack (Eve)</span>
            </label>
          )}

          {mode === 'network' && (
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

          {mode === 'pns' && (
            <p className="subtitle" style={{ marginTop: '10px', textAlign: 'center', color: '#8e8e93' }}>
              Eve is automatically positioned to intercept multi-photon pulses.
            </p>
          )}

          <div style={{ marginTop: '20px', width: '100%' }}>
            {(!results && !networkResults) ? (
              <button className="btn-primary" style={{ width: '100%' }} onClick={runSimulation} disabled={loading}>
                <Play size={18} strokeWidth={2.5} /> {loading ? 'Computing...' : 'Run Simulation'}
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', width: '100%' }}>
                
                {/* ALWAYS visible, but grays out when animation is complete */}
                <button 
                  onClick={() => setIsPaused(!isPaused)} 
                  disabled={animationComplete}
                  style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: animationComplete ? '#f2f2f7' : '#e5e5ea', color: animationComplete ? '#c7c7cc' : '#1d1d1f', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: animationComplete ? 'not-allowed' : 'pointer', fontSize: '1rem', transition: 'all 0.3s' }}
                >
                  {isPaused ? <Play size={18} strokeWidth={2.5}/> : <Pause size={18} strokeWidth={2.5}/>} 
                  {isPaused ? 'Resume' : 'Pause'}
                </button>
                
                <button onClick={stopSimulation} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: '#ff3b30', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}>
                  <Square size={18} strokeWidth={2.5} /> Reset
                </button>
                
              </div>
            )}
          </div>
        </section>

        {mode === 'standard' && results && (
          <section className="results-wrapper">
            <QuantumChannel results={results} evePresent={evePresent} speed={speed} isPaused={isPaused} onAnimationComplete={() => setAnimationComplete(true)} />
            {/* Tables omitted for brevity */}
          </section>
        )}

        {mode === 'network' && networkResults && (
           <TrustedNetwork results={networkResults} compromisedLink={compromisedLink} speed={speed} isPaused={isPaused} />
        )}

        {mode === 'pns' && results && (
           <PNSAttack results={results} speed={speed} isPaused={isPaused} onAnimationComplete={() => setAnimationComplete(true)} />
        )}

      </div>
    </div>
  );
}

export default App;