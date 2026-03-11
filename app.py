from flask import Flask, request, jsonify
from flask_cors import CORS
from bb84 import generate_bb84_transmission

app = Flask(__name__)
CORS(app) # Allows your React/Vue frontend to talk to this backend

@app.route('/api/simulate/bb84', methods=['POST'])
def simulate_bb84():
    data = request.json
    num_bits = data.get('num_bits', 20)
    eve_present = data.get('eve_present', False)
    
    try:
        # Run the quantum engine
        results = generate_bb84_transmission(num_bits=num_bits, eve_present=eve_present)
        return jsonify({"success": True, "data": results})
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    # Run the server on port 5000
    app.run(debug=True, port=5000)