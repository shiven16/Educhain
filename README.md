# Educhain

**Decentralized Academic Credential Verification Network**

Educhain is a peer-to-peer (P2P) network designed to issue, propagate, and verify academic credentials securely without relying on a central authority. It leverages distributed ledger technology principles, cryptographic signatures, and gossip protocols to ensure data integrity and availability.

## 1. Project Overview

In the current academic landscape, verifying credentials often involves slow, manual processes or reliance on centralized databases that are single points of failure. Educhain solves this by creating a decentralized network where:
- **Universities** issue digitally signed credentials.
- **Employers** verify credentials instantly against a local, synchronized ledger.
- **Relay Nodes** ensure network connectivity and data propagation.

**Key Differentiators:**
- **Cryptographic Trust:** Uses ECDSA (Elliptic Curve Digital Signature Algorithm) to ensure credentials cannot be forged.
- **Fault Tolerance:** Data is replicated across all nodes; the network survives even if some nodes go offline.
- **Lightweight Consensus:** Unlike traditional blockchains, Educhain uses an append-only ledger with gossip synchronization, avoiding energy-intensive mining.

## 2. System Architecture

The network consists of three types of nodes, all running the same core software but configured for different roles:

- **University Node:**
  - Holds a private key for signing credentials.
  - Issues new credentials and broadcasts them to the network.
  - Maintains a full copy of the ledger.

- **Employer Node:**
  - Verifies credentials using the issuer's public key.
  - Listens for new credentials to keep its local ledger updated.
  - Provides an interface for instant verification.

- **Relay Node:**
  - Facilitates peer discovery and message routing.
  - Helps unconnected nodes find each other (bootstrap node).

### Data Flow
1.  **Issuance:** University creates a credential -> Signs it with Private Key -> Appends to Local Ledger.
2.  **Propagation:** Credential is broadcast via `libp2p GossipSub` protocol to connected peers.
3.  **Verification:** Peers receive the message -> Verify Signature -> Append to their Local Ledger.
4.  **Storage:** Credentials are stored in a local JSON-based append-only ledger (`ledger.json`).

## 3. Features Implemented

- **Decentralized Issuance:** Universities can issue tamper-proof credentials.
- **Instant Verification:** Employers can verify credentials offline using their local synchronized ledger.
- **P2P Communication:** Real-time data sync using `libp2p` and GossipSub.
- **Data Persistence:** Automatic saving and loading of the ledger from disk.
- **Network Visualization:** Real-time visual graph of active nodes and connections.
- **REST API:** HTTP endpoints for external integration (`/issue`, `/verify`, `/stats`).
- **Resilience:** Automatic reconnection and ledger synchronization (basic implementation).

## 4. Tech Stack

- **Backend:** Node.js, Express.js
- **Networking:** `libp2p` (TCP, Noise, Mplex, GossipSub)
- **Cryptography:** `libp2p-crypto` (ECDSA, SHA-256)
- **Frontend:** React, Vite, Tailwind CSS v4, Lucide React
- **Containerization:** Docker, Docker Compose
- **Storage:** JSON-based file storage

## 5. Installation and Setup

### Prerequisites
- Docker & Docker Compose
- Node.js v20+ (for local frontend development)

### Quick Start (Full Network)

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/shiven16/Educhain.git
    cd Educhain
    ```

2.  **Start the Network (Backend):**
    This spins up 4 nodes: University A, University B, Employer, and Relay.
    ```bash
    docker-compose up --build -d
    ```

3.  **Start the Frontend:**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
    Access the UI at `http://localhost:5173`.

### Ports Configuration
| Node | HTTP API Port | P2P Port |
|------|---------------|----------|
| University A | 3001 | 4001 |
| University B | 3002 | 4002 |
| Employer | 3003 | 4003 |
| Relay | 3004 | 4004 |

### Troubleshooting
- **Startup Errors:** If nodes fail to start, check logs with `docker-compose logs -f`.
- **Frontend Build:** Ensure you are using Node v20+. If Tailwind build fails, run `npm install` again to ensure `@tailwindcss/postcss` is installed.

## 6. Usage Instructions

### University Portal
1.  Navigate to the **University** tab in the frontend.
2.  Fill in the Student Name, Degree, and Date.
3.  Click **Issue Credential**.
4.  The credential is signed and broadcasted to the network.

### Employer Portal
1.  Navigate to the **Employer** tab.
2.  Enter a Credential ID (UUID).
3.  Click **Verify**.
4.  The system checks the local ledger and cryptographic signature to confirm validity.

### Network Visualization
1.  Navigate to the **Network** tab.
2.  View the active nodes and their simulated connections.
3.  Check network statistics like total nodes and ledger sync status.

## 7. Screenshots / Demo

*(Placeholders for future screenshots)*

### University Portal
![University Portal](docs/images/university_portal_placeholder.png)
*Interface for issuing new academic credentials.*

### Employer Portal
![Employer Portal](docs/images/employer_portal_placeholder.png)
*Verification interface showing valid/invalid status.*

### Network Visualization
![Network Viz](docs/images/network_viz_placeholder.png)
*Real-time graph of the P2P network.*

## 8. Networking Concepts Demonstrated

- **P2P Overlay Network:** Nodes form a virtual network on top of TCP/IP, allowing direct peer-to-peer communication without a central server.
- **Gossip Protocol:** We use GossipSub to propagate messages. Nodes forward messages to a subset of peers, ensuring rapid dissemination with low bandwidth usage.
- **Fault Tolerance:** Since every node maintains a copy of the ledger, the system has no single point of failure. If the "University" node goes offline, "Employer" nodes can still verify existing credentials.
- **Cryptographic Authentication:** Every message is signed. Malicious nodes cannot forge credentials because they lack the issuer's private key.
- **Eventual Consistency:** The network ensures that all nodes eventually converge to the same ledger state through message propagation.
