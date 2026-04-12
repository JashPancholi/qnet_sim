import numpy as np
from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister, transpile
from qiskit_aer import AerSimulator

def generate_bb84_transmission(num_bits=20, eve_present=False, attack_type="IR", multi_photon_rate=0.2):
    print("Running TRUE DYNAMIC BB84 Circuit Simulation...")
    simulator = AerSimulator()
    
    alice_bits, alice_bases, bob_bases, bob_results = [], [], [], []
    eve_bases, eve_results = [], []
    
    # Hardware flaw simulation 
    pulse_types = np.random.choice([1, 2], size=num_bits, p=[1-multi_photon_rate, multi_photon_rate])
    
    for i in range(num_bits):
        # 1. SETUP REGISTERS (Including Qubits specifically for Random Number Generation)
        qr_p = QuantumRegister(1, 'photon')
        qr_a = QuantumRegister(2, 'alice_rng') # Qubit 0 is for Bit, 1 is for Basis
        qr_b = QuantumRegister(1, 'bob_rng')
        
        cr_a_bit = ClassicalRegister(1, 'alice_bit')
        cr_a_base = ClassicalRegister(1, 'alice_basis')
        cr_b_base = ClassicalRegister(1, 'bob_basis')
        cr_b_res = ClassicalRegister(1, 'bob_result')
        
        # Conditionally add Eve's registers only if she is physically intercepting (IR)
        if eve_present and attack_type == "IR":
            qr_e = QuantumRegister(1, 'eve_rng')
            cr_e_base = ClassicalRegister(1, 'eve_basis')
            cr_e_res = ClassicalRegister(1, 'eve_result')
            qc = QuantumCircuit(qr_p, qr_a, qr_b, qr_e, cr_a_bit, cr_a_base, cr_b_base, cr_b_res, cr_e_base, cr_e_res)
        else:
            qc = QuantumCircuit(qr_p, qr_a, qr_b, cr_a_bit, cr_a_base, cr_b_base, cr_b_res)

        #random bit and basis for Alice
        qc.h(qr_a)
        qc.measure(qr_a[0], cr_a_bit)
        qc.measure(qr_a[1], cr_a_base)
        
        #random basis for Bob
        qc.h(qr_b)
        qc.measure(qr_b[0], cr_b_base)
        
        if eve_present and attack_type == "IR":
            qc.h(qr_e)
            qc.measure(qr_e[0], cr_e_base)

        # Alice
        with qc.if_test((cr_a_bit, 1)): qc.x(qr_p[0])
        with qc.if_test((cr_a_base, 1)): qc.h(qr_p[0])
            
        # Eve
        if eve_present and attack_type == "IR":
            with qc.if_test((cr_e_base, 1)): qc.h(qr_p[0])
            qc.measure(qr_p[0], cr_e_res)
            with qc.if_test((cr_e_base, 1)): qc.h(qr_p[0])
            
        # Bob
        with qc.if_test((cr_b_base, 1)): qc.h(qr_p[0])
        qc.measure(qr_p[0], cr_b_res)

        compiled_circuit = transpile(qc, simulator)
        job = simulator.run(compiled_circuit, shots=1)
        counts = job.result().get_counts(compiled_circuit)
        
        res_parts = list(counts.keys())[0].split(" ")
        
        if eve_present and attack_type == "IR":
            eve_results.append(int(res_parts[0]))
            eve_bases.append(int(res_parts[1]))
            b_res = int(res_parts[2])
            b_base = int(res_parts[3])
            a_base = int(res_parts[4])
            a_bit = int(res_parts[5])
        else:
            b_res = int(res_parts[0])
            b_base = int(res_parts[1])
            a_base = int(res_parts[2])
            a_bit = int(res_parts[3])
            
            # Handle Classical PNS Logic
            if eve_present and attack_type == "PNS":
                if pulse_types[i] == 2: # Stolen
                    eve_bases.append(a_base)
                    eve_results.append(a_bit)
                else: # Blocked
                    b_res = -1
                    eve_bases.append(-1)
                    eve_results.append(-1)

        # Store for React
        alice_bits.append(a_bit)
        alice_bases.append(a_base)
        bob_bases.append(b_base)
        bob_results.append(b_res)
        
    #post processing
    sifted_indices = [i for i in range(num_bits) if alice_bases[i] == bob_bases[i] and bob_results[i] != -1]
    
    num_sifted = len(sifted_indices)
    num_sacrificed = num_sifted // 2
    
    np.random.shuffle(sifted_indices)
    sacrificed_indices = sorted(sifted_indices[:num_sacrificed])
    kept_indices = sorted(sifted_indices[num_sacrificed:])
    
    errors = sum(1 for i in sacrificed_indices if alice_bits[i] != bob_results[i])
    qber = (errors / len(sacrificed_indices)) if sacrificed_indices else 0
    
    alice_key = [int(alice_bits[i]) for i in kept_indices]
    bob_key = [int(bob_results[i]) for i in kept_indices]
    
    payload = {
        "alice_bits": alice_bits,
        "alice_bases": alice_bases,
        "bob_bases": bob_bases,
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
        payload["eve_bases"] = eve_bases
        payload["eve_results"] = eve_results
        
    return payload