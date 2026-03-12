import React, { useState, useEffect } from 'react';
import { Server, User, UserMinus, ShieldAlert, Lock, Unlock, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import './TrustedNetwork.css';

// --- NEW SUB-COMPONENT: The Expandable Log Box ---
const LinkLogAccordion = ({ link, index, senderName, receiverName, isCompromised }) => {
  const [isOpen, setIsOpen] = useState(false);
  const fd = link.full_data;
  const qberPercentage = (link.qber * 100).toFixed(2);
  const statusVerdict = link.qber > 0.11 ? 'COMPROMISED' : 'SECURE';

  return (
    <div className="glass-panel accordion-panel">
      {/* Accordion Header (Clickable) */}
      <div className="accordion-header" onClick={() => setIsOpen(!isOpen)}>
        <div className="accordion-title">
          <FileText size={20} className="text-blue" />
          <h3>Link {index + 1}: {senderName} ➔ {receiverName}</h3>
        </div>
        
        <div className="accordion-summary">
          <span className={`status-badge ${statusVerdict === 'SECURE' ? 'badge-secure' : 'badge-compromised'}`}>
            {statusVerdict}
          </span>
          <span className="qber-text">QBER: {qberPercentage}%</span>
          {isOpen ? <ChevronUp size={20} className="text-gray" /> : <ChevronDown size={20} className="text-gray" />}
        </div>
      </div>

      {/* Accordion Body (The Table) */}
      {isOpen && (
        <div className="table-container fade-in accordion-body">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>{senderName} Bit</th>
                <th>{senderName} Basis</th>
                {isCompromised && <th className="eve-col-header">Eve Basis</th>}
                {isCompromised && <th className="eve-col-header">Eve Guessed Bit</th>}
                <th>{receiverName} Basis</th>
                <th>{receiverName} Result</th>
                <th>Match Status</th>
              </tr>
            </thead>
            <tbody>
              {fd.alice_bits.map((bit, bitIndex) => {
                const basisMatch = fd.alice_bases[bitIndex] === fd.bob_bases[bitIndex];
                const bitMatch = fd.alice_bits[bitIndex] === fd.bob_results[bitIndex];
                
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

                const eveBasisStr = (isCompromised && fd.eve_bases) ? (fd.eve_bases[bitIndex] === 0 ? '+' : 'x') : '-';
                const eveBitStr = (isCompromised && fd.eve_results) ? fd.eve_results[bitIndex] : '-';

                return (
                  <tr key={bitIndex} className={rowClass}>
                    <td>{bitIndex + 1}</td>
                    <td>{bit}</td>
                    <td>{fd.alice_bases[bitIndex] === 0 ? '+' : 'x'}</td>
                    {isCompromised && <td className="eve-col-data">{eveBasisStr}</td>}
                    {isCompromised && <td className="eve-col-data">{eveBitStr}</td>}
                    <td>{fd.bob_bases[bitIndex] === 0 ? '+' : 'x'}</td>
                    <td>{fd.bob_results[bitIndex]}</td>
                    <td>{matchStatus}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};


// --- MAIN COMPONENT ---
const TrustedNetwork = ({ results, compromisedLink, speed = 1, isPaused = false }) => {
  const [activeLinkIndex, setActiveLinkIndex] = useState(0);
  const [currentPhotonIndex, setCurrentPhotonIndex] = useState(0);

  const hasFullData = results?.links_status[0]?.full_data;
  const numBits = hasFullData ? results.links_status[0].full_data.alice_bits.length : 0;
  const numLinks = results ? results.links_status.length : 0;

  useEffect(() => {
    if (!results || isPaused || !hasFullData) return;
    if (activeLinkIndex >= numLinks) return; 

    const timer = setTimeout(() => {
      if (currentPhotonIndex + 1 < numBits) {
        setCurrentPhotonIndex(prev => prev + 1);
      } else {
        setActiveLinkIndex(prev => prev + 1);
        setCurrentPhotonIndex(0);
      }
    }, 1500 / speed);

    return () => clearTimeout(timer);
  }, [activeLinkIndex, currentPhotonIndex, results, speed, isPaused, numLinks, numBits, hasFullData]);

  useEffect(() => {
    setActiveLinkIndex(0);
    setCurrentPhotonIndex(0);
  }, [results]);

  if (!results || !hasFullData) return <div className="glass-panel">Error: Missing full_data in backend.</div>;

  const isFinished = activeLinkIndex >= numLinks;
  const nodes = ['Alice', ...Array.from({ length: results.num_nodes }, (_, i) => `Node ${i + 1}`), 'Bob'];

  const getPhotonSymbol = (basis, bit) => {
    if (basis === undefined || bit === undefined) return '';
    if (basis === 0) return bit === 0 ? '→' : '↑';
    return bit === 0 ? '↗' : '↖';
  };

  const animationStyle = { 
    animationDuration: `${1.5 / speed}s`,
    animationPlayState: isPaused ? 'paused' : 'running' 
  };

  return (
    <div className="trusted-network-wrapper">
      
      {/* --- PHASE 1: QUANTUM NETWORK TOPOLOGY --- */}
      <div className="glass-panel network-map-container">
        <div className="photon-counter">
          {isFinished 
            ? `Phase 1 Complete: Local Keys Established` 
            : `Link ${activeLinkIndex + 1} Active: Transmitting Photon ${currentPhotonIndex + 1} of ${numBits}`
          }
        </div>
        
        <div className="network-map">
          {nodes.map((nodeName, index) => {
            const isAlice = index === 0;
            const isBob = index === nodes.length - 1;
            
            const linkRight = !isBob ? results.links_status[index] : null;
            const linkLeft = !isAlice ? results.links_status[index - 1] : null;
            
            // NEW: Distinct variables to check if the Left or Right link is compromised
            const isCompromisedRight = linkRight && compromisedLink === index;
            const isCompromisedLeft = linkLeft && compromisedLink === index - 1;

            const isActiveLinkRight = activeLinkIndex === index;
            const isPastLinkRight = activeLinkIndex > index;
            const isActiveLinkLeft = activeLinkIndex === index - 1;
            const isPastLinkLeft = activeLinkIndex > index - 1;

            return (
              <React.Fragment key={index}>
                <div className={`network-node ${activeLinkIndex + 1 >= index || isFinished ? '' : 'node-inactive'}`}>
                  <div className={`icon-wrapper ${isAlice ? 'blue' : isBob ? 'purple' : 'gray'}`}>
                    {isAlice ? <User size={32} strokeWidth={2.5}/> : isBob ? <UserMinus size={32} strokeWidth={2.5}/> : <Server size={32} strokeWidth={2.5}/>}
                  </div>
                  <h3>{nodeName}</h3>

                  <div className="node-stats-container">
                    {!isAlice && linkLeft && (
                      <div className="node-stats receive-stats">
                        <span className="stat-label">Measurement</span>
                        {isActiveLinkLeft ? (
                          <>
                            <p>Result: <strong>{linkLeft.full_data.bob_results[currentPhotonIndex]}</strong></p>
                            <p>Basis: <strong>{linkLeft.full_data.bob_bases[currentPhotonIndex] === 0 ? '+' : 'x'}</strong></p>
                          </>
                        ) : isPastLinkLeft ? (
                          // NEW: Dynamic color and text based on Eve's presence
                          <p className={isCompromisedLeft ? "text-red" : "text-green"}>
                            <strong>{isCompromisedLeft ? "✗ Key Compromised" : "✓ Key Established"}</strong>
                          </p>
                        ) : (
                          <p className="text-gray">Waiting for Link {index}...</p>
                        )}
                      </div>
                    )}
                    
                    {!isBob && linkRight && (
                      <div className="node-stats send-stats">
                        <span className="stat-label">Encoding</span>
                        {isActiveLinkRight ? (
                           <>
                             <p>Bit: <strong>{linkRight.full_data.alice_bits[currentPhotonIndex]}</strong></p>
                             <p>Basis: <strong>{linkRight.full_data.alice_bases[currentPhotonIndex] === 0 ? '+' : 'x'}</strong></p>
                           </>
                        ) : isPastLinkRight ? (
                           // NEW: Dynamic color and text based on Eve's presence
                           <p className={isCompromisedRight ? "text-red" : "text-green"}>
                             <strong>{isCompromisedRight ? "✗ Key Compromised" : "✓ Key Established"}</strong>
                           </p>
                        ) : (
                           <p className="text-gray">Waiting for Link {index + 1}...</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {!isBob && linkRight && (
                  <div className={`network-link ${isPastLinkRight ? 'link-completed' : ''}`}>
                    {/* Make the completed link line red if compromised! */}
                    <div className="fiber-optic-cable" style={isPastLinkRight && isCompromisedRight ? { borderBottomColor: '#ff3b30', boxShadow: '0 0 10px rgba(255, 59, 48, 0.4)' } : {}}></div>
                    
                    {isActiveLinkRight && (
                      <div className={`photon ${isCompromisedRight ? 'intercepted' : 'direct'}`} key={`photon-${index}-${currentPhotonIndex}`} style={animationStyle}>
                         {isCompromisedRight ? (
                           <>
                             <span className="alice-arrow">{getPhotonSymbol(linkRight.full_data.alice_bases[currentPhotonIndex], linkRight.full_data.alice_bits[currentPhotonIndex])}</span>
                             <span className="eve-arrow">{getPhotonSymbol(linkRight.full_data.eve_bases[currentPhotonIndex], linkRight.full_data.eve_results[currentPhotonIndex])}</span>
                           </>
                         ) : (
                           <span className="alice-arrow">{getPhotonSymbol(linkRight.full_data.alice_bases[currentPhotonIndex], linkRight.full_data.alice_bits[currentPhotonIndex])}</span>
                         )}
                      </div>
                    )}

                    {isCompromisedRight && (
                      <div className="eve-node">
                        <div className="icon-wrapper red"><ShieldAlert size={28} strokeWidth={2.5} /></div>
                        <h4>Eve</h4>
                        {isActiveLinkRight ? (
                           <div className="node-stats eve-stats">
                             <span className="stat-label">Intercepted</span>
                             <p>Bit: <strong>{linkRight.full_data.eve_results[currentPhotonIndex]}</strong></p>
                             <p>Basis: <strong>{linkRight.full_data.eve_bases[currentPhotonIndex] === 0 ? '+' : 'x'}</strong></p>
                           </div>
                        ) : isPastLinkRight ? (
                           <div className="node-stats eve-stats">
                             <p className="text-red"><strong>Compromised!</strong></p>
                           </div>
                        ) : (
                           <div className="node-stats eve-stats">
                             <p className="text-gray">Waiting...</p>
                           </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* --- PHASE 1 LOGS: THE NEW ACCORDIONS --- */}
      {isFinished && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%' }}>
          {results.links_status.map((link, index) => {
            return (
              <LinkLogAccordion 
                key={`log-${index}`}
                link={link}
                index={index}
                senderName={nodes[index]}
                receiverName={nodes[index + 1]}
                isCompromised={compromisedLink === index}
              />
            );
          })}
        </div>
      )}

      {/* --- PHASE 2: XOR RELAY KEY TRANSMISSION --- */}
      {isFinished && (
        <div className="glass-panel table-container fade-in">
          <div className="relay-header">
            <Lock size={20} className="text-blue" />
            {/* 1. CHANGED THE NAME HERE */}
            <h3>XOR Relay Key Transmission</h3>
          </div>
          <table>
            <thead>
              <tr>
                <th>Hop</th>
                <th>From</th>
                <th>To</th>
                {/* 2. ADDED THE NEW COLUMNS HERE */}
                <th>Payload (Data to Send)</th>
                <th>Local Quantum Key</th>
                <th>Public Ciphertext (XOR)</th>
              </tr>
            </thead>
            <tbody>
              {results.public_transmissions.map((tx, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td><strong>{tx.from_node}</strong></td>
                  <td><strong>{tx.to_node}</strong></td>
                  <td className="monospace text-gray">{tx.message_to_encrypt?.join('') || '-'}</td>
                  <td className="monospace text-green">{tx.encryption_key?.join('') || '-'}</td>
                  <td className="monospace text-blue"><strong>{tx.ciphertext.join('')}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- FINAL MASTER KEYS --- */}
      {isFinished && (
        <div className="final-keys fade-in">
          <div className="glass-panel key-box">
            <h4>Alice's Master Key</h4>
            <p className="monospace text-green">{results.alice_master_key.join('')}</p>
          </div>
          <div className="glass-panel key-box">
            <div className="relay-header justify-center">
               {results.keys_match ? <Unlock size={18} className="text-green"/> : <ShieldAlert size={18} className="text-red"/>}
              <h4>Bob's Decrypted Key</h4>
            </div>
            <p className={`monospace ${results.keys_match ? 'text-green' : 'text-red'}`}>
              {results.bob_final_key.join('')}
            </p>
          </div>
        </div>
      )}

    </div>
  );
};

export default TrustedNetwork;