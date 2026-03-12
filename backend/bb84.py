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
    
    bob_results = []
    
    for i in range(num_bits):
        qc = QuantumCircuit(1, 1)
        if alice_bits[i] == 1: qc.x(0)
        if alice_bases[i] == 1: qc.h(0)
            
        if eve_present:
            if eve_bases[i] == 1: qc.h(0)
            qc.measure(0, 0)
        
        if bob_bases[i] == 1: qc.h(0)
        qc.measure(0, 0)
        
        compiled_circuit = transpile(qc, simulator)
        job = simulator.run(compiled_circuit, shots=1)
        result = job.result()
        measured_bit = int(list(result.get_counts(compiled_circuit).keys())[0])
        bob_results.append(measured_bit)
        
    alice_key = []
    bob_key = []
    errors = 0
    
    for i in range(num_bits):
        if alice_bases[i] == bob_bases[i]:
            alice_key.append(int(alice_bits[i]))
            bob_key.append(int(bob_results[i]))
            if alice_bits[i] != bob_results[i]:
                errors += 1
                
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