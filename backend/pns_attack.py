import numpy as np

def generate_pns_attack(num_bits=20):
    # Simulate a realistic attenuated laser (Poisson distribution of photons)
    photon_counts = np.random.choice([1, 2, 3], size=num_bits, p=[0.6, 0.3, 0.1])
    
    alice_bits = np.random.randint(2, size=num_bits)
    alice_bases = np.random.randint(2, size=num_bits)
    bob_bases = np.random.randint(2, size=num_bits)
    
    eve_actions = []
    eve_stolen_bits = []
    bob_results = []
    
    for i in range(num_bits):
        count = photon_counts[i]
        
        # Bob measures the pulse using his basis
        if alice_bases[i] == bob_bases[i]:
            bob_measure = alice_bits[i] 
        else:
            bob_measure = np.random.randint(2)
            
        # Cast to standard Python int for JSON serialization
        bob_results.append(int(bob_measure))
        
        # Eve's PNS Logic
        if count == 1:
            eve_actions.append("Passed")
            eve_stolen_bits.append(None)
        else:
            eve_actions.append("Split & Stored")
            # Eve waits for Alice to announce the basis, then measures her stored photon perfectly!
            if alice_bases[i] == bob_bases[i]:
                # Cast stolen bit to standard int
                eve_stolen_bits.append(int(alice_bits[i])) 
            else:
                eve_stolen_bits.append(None) 
                
    # Sifting Phase
    sifted_indices = [int(i) for i in range(num_bits) if alice_bases[i] == bob_bases[i]]
    alice_key = [int(alice_bits[i]) for i in sifted_indices]
    bob_key = [int(bob_results[i]) for i in sifted_indices]
    
    # Calculate Eve's success
    stolen_key = [eve_stolen_bits[i] for i in sifted_indices if eve_stolen_bits[i] is not None]
    theft_percentage = (len(stolen_key) / len(alice_key)) if len(alice_key) > 0 else 0
    
    return {
        "alice_bits": alice_bits.tolist(),
        "alice_bases": alice_bases.tolist(),
        "bob_bases": bob_bases.tolist(),
        "bob_results": bob_results,
        "photon_counts": photon_counts.tolist(),
        "eve_actions": eve_actions,
        "eve_stolen_bits": [b if b is not None else -1 for b in eve_stolen_bits],
        "alice_key": alice_key,
        "bob_key": bob_key,
        "stolen_key": stolen_key,
        "theft_percentage": float(theft_percentage), # Ensure float
        "qber": 0.0, # PNS is silent, so QBER is always 0!
        "status": "SILENTLY COMPROMISED" if theft_percentage > 0 else "SECURE"
    }