from bb84 import generate_bb84_transmission

def xor_lists(list1, list2):
    return [b1 ^ b2 for b1, b2 in zip(list1, list2)]

def generate_trusted_node_network(num_nodes=1, num_bits=50, compromised_link_index=-1):
    num_links = num_nodes + 1 
    links_data = []
    
    #Generate the physical links using imported BB84 logic
    for i in range(num_links):
        eve_present = (i == compromised_link_index)
        link_results = generate_bb84_transmission(num_bits=num_bits, eve_present=eve_present)
        
        links_data.append({
            "link_index": i, 
            "sender_key": link_results["alice_key"],    #The clean key Alice/Node generated
            "receiver_key": link_results["bob_key"],    #The key the receiving node ACTUALLY got (contains Eve's errors)
            "qber": link_results["qber"],
            "full_data": link_results
        })
        
    #Truncate keys to the same length for XOR math
    min_length = min([len(link["sender_key"]) for link in links_data]) if links_data else 0
    
    for link in links_data:
        link["trunc_sender"] = link["sender_key"][:min_length]
        link["trunc_receiver"] = link["receiver_key"][:min_length]
        
    if min_length == 0:
        return {"error": "Key length dropped to 0 during sifting. Increase num_bits."}

    # 3. The REALITY-ACCURATE XOR Relay
    alice_master_key = links_data[0]["trunc_sender"]
    
    #Node 1 doesn't magically know Alice's key. It only knows what it received
    current_payload = links_data[0]["trunc_receiver"] 
    public_transmissions = []
    
    #The REALITY-ACCURATE XOR Relay
    alice_master_key = links_data[0]["trunc_sender"]
    current_payload = links_data[0]["trunc_receiver"] 
    public_transmissions = []
    
    for i in range(num_nodes):
        link_to_next = links_data[i+1]
        encryption_key = link_to_next["trunc_sender"]
        decryption_key = link_to_next["trunc_receiver"]
        
        ciphertext = xor_lists(current_payload, encryption_key)
        
        # UPDATED: We are now passing the payload and the local key to the frontend!
        public_transmissions.append({
            "from_node": f"Node {i+1}",
            "to_node": f"Node {i+2}" if i+1 < num_nodes else "Bob",
            "message_to_encrypt": current_payload,
            "encryption_key": encryption_key,
            "ciphertext": ciphertext
        })
        
        current_payload = xor_lists(ciphertext, decryption_key)

    bob_final_key = current_payload
    
    return {
        "num_nodes": num_nodes,
        "final_key_length": min_length,
        "alice_master_key": alice_master_key,
        "bob_final_key": bob_final_key,
        "keys_match": alice_master_key == bob_final_key,
        "links_status": links_data,
        "public_transmissions": public_transmissions
    }