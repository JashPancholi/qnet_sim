import numpy as np
from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator

def generate_bb84_transmission(num_bits=20, eve_present=False):
    simulator = AerSimulator()
    
    alice_bits = np.random.randint(2, size=num_bits)
    alice_bases = np.random.randint(2, size=num_bits)
    bob_bases = np.random.randint(2, size=num_bits)
    
    if eve_present:
        eve_bases = np.random.randint(2, size=num_bits)
        eve_results = []
    
    bob_results = []
    
    for i in range(num_bits):
        num_cbits = 2 if eve_present else 1
        qc = QuantumCircuit(1, num_cbits)
        
        if alice_bits[i] == 1: qc.x(0)
        if alice_bases[i] == 1: qc.h(0)
            
        if eve_present:
            if eve_bases[i] == 1: qc.h(0)
            qc.measure(0, 0)
            if eve_bases[i] == 1: qc.h(0)
        
        if bob_bases[i] == 1: qc.h(0)
        qc.measure(0, 1 if eve_present else 0)
        
        compiled_circuit = transpile(qc, simulator)
        job = simulator.run(compiled_circuit, shots=1)
        result = job.result()
        measured_str = list(result.get_counts(compiled_circuit).keys())[0]
        
        if eve_present:
            bob_bit = int(measured_str[0])
            eve_bit = int(measured_str[1])
            bob_results.append(bob_bit)
            eve_results.append(eve_bit)
        else:
            bob_bit = int(measured_str)
            bob_results.append(bob_bit)
            
    # 4. SIFTING (Track the raw indices instead of just the bits!)
    sifted_raw_indices = []
    for i in range(num_bits):
        if alice_bases[i] == bob_bases[i]:
            sifted_raw_indices.append(i)
                
    # 5. PARAMETER ESTIMATION (50% SAMPLING)
    sifted_len = len(sifted_raw_indices)
    sample_size = sifted_len // 2 
    
    errors = 0
    alice_key = []
    bob_key = []
    sacrificed_indices = []
    
    if sample_size > 0:
        # Choose random indices from the sifted pool
        sample_subset = np.random.choice(sifted_raw_indices, sample_size, replace=False)
        
        # THE FIX: Cast the Numpy int64s back to standard Python ints so Flask can JSONify them!
        sacrificed_indices = [int(idx) for idx in sample_subset]
        
        for i in sifted_raw_indices:
            if i in sacrificed_indices:
                # Calculate QBER on sacrificed bits
                if alice_bits[i] != bob_results[i]:
                    errors += 1
            else:
                # Save the unsacrificed bits for the final key
                alice_key.append(int(alice_bits[i]))
                bob_key.append(int(bob_results[i]))
                
        qber = errors / sample_size
    else:
        qber = 0
        for i in sifted_raw_indices:
            alice_key.append(int(alice_bits[i]))
            bob_key.append(int(bob_results[i]))
    
    # 6. RETURN PAYLOAD (Now includes sacrificed_indices!)
    payload = {
        "alice_bits": alice_bits.tolist(),
        "alice_bases": alice_bases.tolist(),
        "bob_bases": bob_bases.tolist(),
        "bob_results": bob_results,
        "alice_key": alice_key,
        "bob_key": bob_key,
        "sacrificed_indices": sacrificed_indices, # <--- NEW: Tells frontend which rows to highlight!
        "qber": qber,
        "status": "COMPROMISED" if qber > 0.11 else "SECURE"
    }
    
    if eve_present:
        payload["eve_bases"] = eve_bases.tolist()
        payload["eve_results"] = eve_results
        
    return payload