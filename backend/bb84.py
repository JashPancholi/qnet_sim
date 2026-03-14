import numpy as np
from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator

def generate_bb84_transmission(num_bits=20, eve_present=False, attack_type="IR", multi_photon_rate=0.2):
    simulator = AerSimulator()
    
    alice_bits = np.random.randint(2, size=num_bits)
    alice_bases = np.random.randint(2, size=num_bits)
    bob_bases = np.random.randint(2, size=num_bits)
    
    # ALWAYS generate pulse types so the frontend doesn't crash
    pulse_types = np.random.choice([1, 2], size=num_bits, p=[1-multi_photon_rate, multi_photon_rate])
    
    if eve_present:
        eve_bases = np.random.randint(2, size=num_bits).tolist()
    eve_results = []
    bob_results = []
    
    for i in range(num_bits):
        # FIX: Only IR attacks need 2 classical bits (for Eve to measure). PNS never measures Bob's photon!
        num_cbits = 2 if (eve_present and attack_type == "IR") else 1
        qc = QuantumCircuit(1, num_cbits)
        
        # 1. ALICE ENCODES
        if alice_bits[i] == 1: qc.x(0)
        if alice_bases[i] == 1: qc.h(0)
            
        # 2. EVE ATTACKS
        if eve_present:
            if attack_type == "PNS":
                # EVE DOES ABSOLUTELY NOTHING TO THE CIRCUIT. 
                # Single photon? Lets it pass. Multi-photon? Splits it and lets Bob's copy pass.
                pass 
            elif attack_type == "IR":
                # Intercept & Resend: Eve measures and collapses the wave!
                if eve_bases[i] == 1: qc.h(0)
                qc.measure(0, 0)
                if eve_bases[i] == 1: qc.h(0)
        
        # 3. BOB MEASURES
        if bob_bases[i] == 1: qc.h(0)
        qc.measure(0, 1 if (eve_present and attack_type == "IR") else 0)
        
        # Execute Circuit
        compiled_circuit = transpile(qc, simulator)
        job = simulator.run(compiled_circuit, shots=1)
        counts = job.result().get_counts(compiled_circuit)
        
        measured_str = list(counts.keys())[0].replace(" ", "")
        
        if eve_present:
            if attack_type == "PNS":
                bob_bit = int(measured_str[0])
                if pulse_types[i] == 2:
                    # Multi-photon: Eve stole the duplicate, waited for the basis, and perfectly measured!
                    eve_bases[i] = int(alice_bases[i])
                    eve_results.append(int(alice_bits[i]))
                else:
                    # Single photon: Eve ignored it entirely to avoid detection. 
                    # She just logs a random guess in her notebook because she has zero info.
                    eve_results.append(int(np.random.randint(2)))
            else: # IR
                bob_bit = int(measured_str[0])
                raw_eve_bit = int(measured_str[1]) if len(measured_str) > 1 else 0
                eve_results.append(raw_eve_bit)
                
            bob_results.append(bob_bit)
        else:
            bob_results.append(int(measured_str[0]))
            
    # 4. SIFTING & PARAMETER ESTIMATION (Sacrificing Bits)
    sifted_indices = [i for i in range(num_bits) if alice_bases[i] == bob_bases[i]]
    
    num_sifted = len(sifted_indices)
    num_sacrificed = num_sifted // 2
    
    np.random.shuffle(sifted_indices)
    sacrificed_indices = sorted(sifted_indices[:num_sacrificed])
    kept_indices = sorted(sifted_indices[num_sacrificed:])
    
    # Calculate QBER ONLY on the sacrificed bits!
    errors = sum(1 for i in sacrificed_indices if alice_bits[i] != bob_results[i])
    qber = (errors / len(sacrificed_indices)) if sacrificed_indices else 0
    
    alice_key = [int(alice_bits[i]) for i in kept_indices]
    bob_key = [int(bob_results[i]) for i in kept_indices]
    
    payload = {
        "alice_bits": alice_bits.tolist(),
        "alice_bases": alice_bases.tolist(),
        "bob_bases": bob_bases.tolist(),
        "bob_results": bob_results,
        "alice_key": alice_key,
        "bob_key": bob_key,
        "qber": qber,
        "status": "COMPROMISED" if qber > 0.11 else "SECURE",
        "pulse_types": pulse_types.tolist(),
        "attack_type": attack_type,
        "sacrificed_indices": sacrificed_indices,
        "kept_indices": kept_indices
    }
    
    if eve_present:
        payload["eve_bases"] = eve_bases if isinstance(eve_bases, list) else eve_bases.tolist()
        payload["eve_results"] = eve_results
        
    return payload