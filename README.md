# Educhain

**Distributed Academic Credential Verification Network**

Educhain is a distributed network designed to issue, propagate, and verify academic credentials securely. It leverages a hybrid architecture combining a central registry for coordination with distributed ledger technology principles to ensure data integrity and availability.

## 1. Project Overview

In the current academic landscape, verifying credentials often involves slow, manual processes or reliance on centralized databases that are single points of failure. Educhain solves this by creating a distributed network where:
- **Universities** issue digitally signed credentials.
- **Employers** verify credentials instantly against a local, synchronized ledger.
- **Registry** ensures network coordination and peer discovery.

**Key Differentiators:**
- **Cryptographic Trust:** Uses ECDSA (Elliptic Curve Digital Signature Algorithm) to ensure credentials cannot be forged.
- **Fault Tolerance:** Data is replicated across all nodes; verification works even if the issuing university goes offline.
- **Registry-Based Sync:** Uses a reliable HTTP polling mechanism for credential synchronization while maintaining P2P capabilities.

## 2. System Architecture

The network consists of four types of nodes, all running the same core software but configured for different roles:

- **Registry Node:**
  - Acts as the central directory for active nodes.
  - Stores a copy of all published credentials.
  - Facilitates peer discovery and network health monitoring.

- **University Node:**
  - Holds a private key for signing credentials.
  - Issues new credentials (PDFs) and publishes them to the registry.
  - Maintains a full copy of the ledger.

- **Employer Node:**
  - Verifies credentials using the issuer's public key.
  - Polls the registry to keep its local ledger updated.
  - Provides an interface for instant verification.

- **Relay Node:**
  - Provides redundancy and helps with network connectivity.

### Data Flow
1.  **Issuance:** University creates a credential -> Hashes PDF -> Signs with Private Key -> Publishes to Registry.
2.  **Synchronization:** All nodes periodically poll the Registry for new credentials.
3.  **Storage:** Credentials are appended to the local JSON-based ledger (`ledger.json`) on every node.
4.  **Verification:** Employer receives a PDF -> Computes Hash -> Checks Local Ledger -> Verifies Signature.

## 3. Features Implemented

- **Secure Issuance:** Universities issue tamper-proof credentials linked to specific PDF files.
- **Offline Verification:** Employers can verify credentials even if the university is offline.
- **Tamper Detection:** Any modification to the PDF invalidates the credential hash.
- **Dynamic Network:** Nodes automatically register and discover peers via the Registry.
- **Data Persistence:** Automatic saving and loading of the ledger and keys from disk.
- **Network Visualization:** Real-time visual graph of active nodes and their status.
- **REST API:** HTTP endpoints for external integration (`/issue`, `/verify`, `/stats`).

## 4. Tech Stack

- **Backend:** Node.js, Express.js
- **Networking:** HTTP Polling (Primary), `libp2p` (Secondary/P2P layer)
- **Cryptography:** Node.js `crypto` (ECDSA secp256k1, SHA-256)
- **Frontend:** React, Vite, CSS Modules
- **Containerization:** Docker, Docker Compose
- **Storage:** JSON-based file storage (Ledger & Keys)

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
    This spins up 13 nodes: 1 Registry, 6 Universities, 4 Employers, and 2 Relays.
    ```bash
    cd backend
    docker-compose up --build -d
    ```

3.  **Start the Frontend:**
    ```bash
    cd ../frontend
    npm install
    npm run dev
    ```
    Access the UI at `http://localhost:5173`.

### Ports Configuration
| Node Type | Node Name | HTTP API Port | P2P Port |
|-----------|-----------|---------------|----------|
| Registry | registry | 3000 | 4000 |
| University | university_1 | 3001 | 4001 |
| University | university_2 | 3002 | 4002 |
| ... | ... | ... | ... |
| University | university_6 | 3006 | 4006 |
| Employer | employer_1 | 3011 | 4011 |
| ... | ... | ... | ... |
| Employer | employer_4 | 3014 | 4014 |
| Relay | relay_1 | 3021 | 4021 |
| Relay | relay_2 | 3022 | 4022 |

## 6. Usage Instructions

### University Portal
1.  Navigate to the **University** tab in the frontend.
2.  Fill in the Student Name, Degree, and Year.
3.  Enter the path to the PDF file (e.g., `/app/src/certificates/original_cert.pdf`).
4.  Click **Issue Credential**.

### Employer Portal
1.  Navigate to the **Employer** tab.
2.  Enter the Credential ID (received from the university).
3.  Enter the path to the PDF file to verify.
4.  Click **Verify**.
5.  The system checks the local ledger and cryptographic signature.

### Network Visualization
1.  Navigate to the **Network** tab.
2.  View the real-time list of active nodes.
3.  See the node type (University 🎓, Employer 💼, Relay 🔗) and status.

## 7. Networking Concepts Demonstrated

- **Distributed Ledger:** Every node maintains a copy of the data, ensuring high availability.
- **Registry-Based Coordination:** A central registry facilitates discovery and synchronization, mimicking real-world service discovery patterns.
- **Cryptographic Authentication:** Digital signatures ensure non-repudiation and integrity.
- **Fault Tolerance:** The system continues to function for verification even if issuer nodes fail.
