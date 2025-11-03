import express from 'express';

/**
 * HTTP API for credential operations
 * Exposes REST endpoints for issuing and verifying credentials
 */

export class API {
    constructor(node, port = 3000) {
        this.node = node;
        this.app = express();
        this.port = port;

        this.app.use(express.json());
        this.setupRoutes();
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                nodeName: this.node.nodeName,
                nodeType: this.node.nodeType,
                peersConnected: this.node.libp2pNode.getPeers().length
            });
        });

        // Issue new credential (universities only)
        this.app.post('/issue', async (req, res) => {
            if (this.node.nodeType !== 'university') {
                return res.status(403).json({
                    error: 'Only university nodes can issue credentials'
                });
            }

            const { studentName, degree, graduationDate } = req.body;

            if (!studentName || !degree || !graduationDate) {
                return res.status(400).json({
                    error: 'Missing required fields: studentName, degree, graduationDate'
                });
            }

            try {
                const credential = await this.node.issueCredential({
                    studentName,
                    degree,
                    graduationDate
                });

                res.json({
                    success: true,
                    credential,
                    message: 'Credential issued and propagating to network'
                });
            } catch (error) {
                res.status(500).json({
                    error: error.message
                });
            }
        });

        // Verify credential by ID
        this.app.get('/verify/:id', (req, res) => {
            const credential = this.node.ledger.find(c => c.id === req.params.id);

            if (!credential) {
                return res.status(404).json({
                    error: 'Credential not found',
                    id: req.params.id
                });
            }

            res.json({
                found: true,
                credential,
                valid: credential.verified
            });
        });

        // Get full ledger
        this.app.get('/ledger', (req, res) => {
            res.json({
                nodeName: this.node.nodeName,
                totalCredentials: this.node.ledger.length,
                ledger: this.node.ledger
            });
        });

        // Get network statistics
        this.app.get('/stats', (req, res) => {
            const peers = this.node.libp2pNode.getPeers();
            res.json({
                nodeName: this.node.nodeName,
                nodeType: this.node.nodeType,
                peersConnected: peers.length,
                peerIds: peers.map(p => p.toString()),
                credentialsInLedger: this.node.ledger.length
            });
        });
    }

    start() {
        this.app.listen(this.port, '0.0.0.0', () => {
            console.log(`[API] HTTP server listening on port ${this.port}`);
        });
    }
}