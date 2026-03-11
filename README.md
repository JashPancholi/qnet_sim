# Q-Net Sim: A QKD & BB84 Network Simulator 🌌🔒

> **Bridging the Gap Between Quantum Theory and Network Reality**

![Quantum Key Distribution](https://img.shields.io/badge/Quantum-Cryptography-blue)
![Qiskit](https://img.shields.io/badge/Powered_by-Qiskit-purple)
![Status](https://img.shields.io/badge/Status-Hackathon_Prototype-brightgreen)

## 📌 Overview
Quantum Key Distribution (QKD) offers unconditionally secure communication guaranteed by the laws of physics. However, most educational simulators treat QKD as an isolated physics experiment, ignoring the realities of physical network infrastructure and hardware vulnerabilities.

**Q-Net Sim** is a Full-Stack BB84 Simulator that demonstrates applied network engineering and advanced hardware exploits. We simulate multi-node environments, real-world laser imperfections, and the advanced protocols required to secure them.

## ✨ Key Innovations & Features
Unlike basic theoretical simulators, Q-Net Sim bridges the gap to practical application:

* **Core BB84 Protocol:** Accurate simulation of quantum state preparation, basis selection, transmission, measurement, and Sifting using IBM's Qiskit framework.
* **Trusted Nodes Routing:** Simulates how QKD spans distances greater than 100km (where quantum coherence fails) by generating separate keys and utilizing classical XOR handoffs.
* **Photon Number Splitting (PNS) Attacks:** Models real-world hardware flaws where lasers emit multi-photon pulses, allowing Eve to siphon photons without spiking the Quantum Bit Error Rate (QBER).
* **Decoy State Protocol:** Implements the advanced countermeasure to PNS attacks by randomly interleaving signal and decoy pulses, catching eavesdroppers through statistical analysis.
* **Interactive Dashboard:** A live visual UI to toggle attack vectors, distance parameters, and view real-time QBER probability distributions.

## 🛠️ Technology Stack
* **Quantum Backend:** Python, IBM Qiskit (`qasm_simulator`)
* **Statistical Analysis:** NumPy
* **API Layer:** Flask / FastAPI
* **Frontend:** HTML/CSS/JavaScript, React/Vue (or standard web assets)
* **Data Visualization:** Chart.js / D3.js

## 🚀 Installation & Setup

### Prerequisites
* Python 3.8+
* Node.js / npm (if using a JS framework for the frontend)

### Backend Setup
1. Clone the repository:
   ```bash
   git clone [https://github.com/yourusername/Q-Net-Sim.git](https://github.com/yourusername/Q-Net-Sim.git)
   cd Q-Net-Sim/backend
