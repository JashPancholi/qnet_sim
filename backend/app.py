from flask import Flask, request, jsonify
from flask_cors import CORS

# Import all your physical simulators modularly!
from bb84 import generate_bb84_transmission
from trusted_nodes import generate_trusted_node_network
from pns_attack import generate_pns_attack 

app = Flask(__name__)
CORS(app) 

# ==========================================
# FLASK API ENDPOINTS
# ==========================================

@app.route('/api/simulate/bb84', methods=['POST'])
def simulate_bb84():
    data = request.json
    num_bits = data.get('num_bits', 20)
    eve_present = data.get('eve_present', False)
    try:
        results = generate_bb84_transmission(num_bits=num_bits, eve_present=eve_present)
        return jsonify({"success": True, "data": results})
    except Exception as e:
        print(f"Error in BB84: {e}")
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
        print(f"Error in Network: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/simulate/pns', methods=['POST'])
def simulate_pns():
    data = request.json
    num_bits = data.get('num_bits', 20)
    try:
        results = generate_pns_attack(num_bits=num_bits)
        return jsonify({"success": True, "data": results})
    except Exception as e:
        print(f"Error in PNS: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)