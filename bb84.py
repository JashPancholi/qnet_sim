import numpy as np
from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator

def generate_bb84_transmission(num_bits=20, eve_present=False):
    simulator = AerSimulator()
    
    # Generate random bits and bases (0 for Rectilinear '+', 1 for Diagonal 'x')
    alice_bits = np.random.randint(2, size=num_bits)
    alice_bases = np.random.randint(2, size=num_bits)
    bob_bases = np.random.randint(2, size=num_bits)
    
    if eve_present:
        eve_bases = np.random.randint(2, size=num_bits)
    
    bob_results = []
    
    # We simulate photon by photon to allow Eve to intercept sequentially
    for i in range(num_bits):
        qc = QuantumCircuit(1, 1)
        
        # 1. Alice Encodes
        if alice_bits[i] == 1:
            qc.x(0) # Flip to |1>
        if alice_bases[i] == 1:
            qc.h(0) # Apply Hadamard for diagonal basis
            
        # 2. Eve Intercepts (If active)
        if eve_present:
            if eve_bases[i] == 1:
                qc.h(0)
            qc.measure(0, 0)
            
            # Eve resends based on her measurement (collapse of wave function)
            # In a real circuit simulation, measuring collapses it automatically for Bob's later measurement.
        
        # 3. Bob Measures
        if bob_bases[i] == 1:
            qc.h(0) # Bob aligns to diagonal basis
            
        qc.measure(0, 0)
        
        # Execute the circuit on the local qasm_simulator
        compiled_circuit = transpile(qc, simulator)
        job = simulator.run(compiled_circuit, shots=1)
        result = job.result()
        counts = result.get_counts(compiled_circuit)
        
        # Extract the measured bit
        measured_bit = int(list(counts.keys())[0])
        bob_results.append(measured_bit)
        
    # 4. Sifting Process (Compare Bases)
    alice_key = []
    bob_key = []
    errors = 0
    
    for i in range(num_bits):
        if alice_bases[i] == bob_bases[i]:
            alice_key.append(int(alice_bits[i]))
            bob_key.append(int(bob_results[i]))
            if alice_bits[i] != bob_results[i]:
                errors += 1
                
    # Calculate Quantum Bit Error Rate (QBER)
    matches = len(alice_key)
    qber = (errors / matches) if matches > 0 else 0
    
    return {
        "alice_bits": alice_bits.tolist(),
        "alice_bases": alice_bases.tolist(),
        "bob_bases": bob_bases.tolist(),
        "bob_results": bob_results,
        "alice_key": alice_key,
        "bob_key": bob_key,
        "qber": qber,
        "status": "COMPROMISED" if qber > 0.11 else "SECURE"
    }