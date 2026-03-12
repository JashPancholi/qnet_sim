from flask import Flask, request, jsonify
from flask_cors import CORS
from bb84 import generate_bb84_transmission
from trusted_nodes import generate_trusted_node_network

app = Flask(__name__)
CORS(app) 

@app.route('/api/simulate/bb84', methods=['POST'])
def simulate_bb84():
    data = request.json
    num_bits = data.get('num_bits', 20)
    eve_present = data.get('eve_present', False)
    
    try:
        results = generate_bb84_transmission(num_bits=num_bits, eve_present=eve_present)
        return jsonify({"success": True, "data": results})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/simulate/network', methods=['POST'])
def simulate_network():
    data = request.json
    num_nodes = data.get('num_nodes', 1)
    num_bits = data.get('num_bits', 50)
    compromised_link_index = data.get('compromised_link_index', -1) 
    
    try:
        results = generate_trusted_node_network(
            num_nodes=num_nodes, 
            num_bits=num_bits, 
            compromised_link_index=compromised_link_index
        )
        return jsonify({"success": True, "data": results})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)