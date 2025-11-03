import { createLibp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { mplex } from '@libp2p/mplex';
import { noise } from '@libp2p/noise';
import { gossipsub } from '@libp2p/gossipsub';
import { bootstrap } from '@libp2p/bootstrap';
import { kadDHT } from '@libp2p/kad-dht';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { CryptoManager } from './crypto.js';
import { API } from './api.js';

/**
 * Main Node class - represents a peer in the credential network
 * Handles P2P communication, credential storage, and signature verification
 */

class CredentialNode {
    constructor(nodeName, nodeType) {
        this.nodeName = nodeName;
        this.nodeType = nodeType; // 'university', 'employer', or 'relay'
        this.dataDir = '/app/data';
        this.ledgerPath = path.join(this.dataDir, 'ledger.json');
        this.ledger = this.loadLedger();

        // Only universities need signing keys
        this.crypto = this.nodeType === 'university'
            ? new CryptoManager(this.dataDir)
            : null;

        this.libp2pNode = null;
        this.TOPIC = 'credentials'; // GossipSub topic for credential propagation
    }

    /**
     * Load existing ledger from disk or create new empty ledger
     * Ledger is append-only JSON file
     */
    loadLedger() {
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }

        if (fs.existsSync(this.ledgerPath)) {
            try {
                return JSON.parse(fs.readFileSync(this.ledgerPath, 'utf8'));
            } catch (error) {
                console.error('[Ledger] Error loading ledger, starting fresh:', error.message);
                return [];
            }
        }
        return [];
    }

    /**
     * Persist ledger to disk (append-only)
     */
    saveLedger() {
        fs.writeFileSync(this.ledgerPath, JSON.stringify(this.ledger, null, 2));
    }

    /**
     * Initialize libp2p node with GossipSub for P2P messaging
     */
    async start() {
        const port = parseInt(process.env.P2P_PORT || '4000');

        // Bootstrap peers for peer discovery
        const bootstrapList = [];
        if (process.env.BOOTSTRAP_PEER) {
            bootstrapList.push(process.env.BOOTSTRAP_PEER);
        }

        this.libp2pNode = await createLibp2p({
            addresses: {
                listen: [`/ip4/0.0.0.0/tcp/${port}`]
            },
            transports: [tcp()],
            streamMuxers: [mplex()],
            connectionEncryption: [noise()],
            services: {
                pubsub: gossipsub({
                    allowPublishToZeroTopicPeers: true,
                    emitSelf: false // Don't receive our own messages
                }),
                dht: kadDHT()
            },
            peerDiscovery: bootstrapList.length > 0 ? [
                bootstrap({
                    list: bootstrapList
                })
            ] : []
        });

        await this.libp2pNode.start();
        console.log(`[Node] ${this.nodeName} started`);
        console.log(`[Node] Peer ID: ${this.libp2pNode.peerId.toString()}`);
        console.log(`[Node] Listening on port ${port}`);

        // Subscribe to credential topic
        this.libp2pNode.services.pubsub.subscribe(this.TOPIC);
        console.log(`[PubSub] Subscribed to topic: ${this.TOPIC}`);

        // Handle incoming credentials via GossipSub
        this.libp2pNode.services.pubsub.addEventListener('message', (evt) => {
            if (evt.detail.topic === this.TOPIC) {
                this.handleIncomingCredential(evt.detail.data);
            }
        });

        // Log peer connections
        this.libp2pNode.addEventListener('peer:connect', (evt) => {
            console.log(`[P2P] Connected to peer: ${evt.detail.toString()}`);
        });

        // Start HTTP API
        const httpPort = parseInt(process.env.HTTP_PORT || '3000');
        const api = new API(this, httpPort);
        api.start();
    }

    /**
     * Issue a new credential (university nodes only)
     * Signs credential and broadcasts to network via GossipSub
     */
    async issueCredential(data) {
        if (this.nodeType !== 'university') {
            throw new Error('Only university nodes can issue credentials');
        }

        const credential = {
            id: uuidv4(),
            issuer: this.nodeName,
            issuerPublicKey: this.crypto.getPublicKey(),
            timestamp: new Date().toISOString(),
            data
        };

        // Sign the credential (signature is separate from credential data)
        const signature = this.crypto.sign(credential);
        const signedCredential = {
            ...credential,
            signature,
            verified: true // We just signed it, so it's verified
        };

        // Append to local ledger
        this.ledger.push(signedCredential);
        this.saveLedger();

        console.log(`[Credential] Issued: ${credential.id} for ${data.studentName}`);

        // Broadcast to network using GossipSub
        await this.broadcastCredential(signedCredential);

        return signedCredential;
    }

    /**
     * Broadcast credential to all peers via GossipSub
     */
    async broadcastCredential(credential) {
        const message = JSON.stringify(credential);
        const messageBytes = new TextEncoder().encode(message);

        try {
            await this.libp2pNode.services.pubsub.publish(this.TOPIC, messageBytes);
            console.log(`[PubSub] Broadcasted credential ${credential.id}`);
        } catch (error) {
            console.error('[PubSub] Broadcast error:', error.message);
        }
    }

    /**
     * Handle incoming credential from GossipSub
     * Verifies signature and appends to local ledger if valid
     */
    handleIncomingCredential(messageBytes) {
        try {
            const message = new TextDecoder().decode(messageBytes);
            const credential = JSON.parse(message);

            // Check if we already have this credential
            if (this.ledger.some(c => c.id === credential.id)) {
                console.log(`[Credential] Already have ${credential.id}, skipping`);
                return;
            }

            console.log(`[Credential] Received ${credential.id} from ${credential.issuer}`);

            // Verify signature
            const { signature, ...credentialData } = credential;
            const isValid = CryptoManager.verify(
                credentialData,
                signature,
                credential.issuerPublicKey
            );

            if (isValid) {
                console.log(`[Credential] ✓ Signature verified for ${credential.id}`);
                const verifiedCredential = { ...credential, verified: true };
                this.ledger.push(verifiedCredential);
                this.saveLedger();
            } else {
                console.log(`[Credential] ✗ Invalid signature for ${credential.id}`);
                // Still store but mark as unverified
                const unverifiedCredential = { ...credential, verified: false };
                this.ledger.push(unverifiedCredential);
                this.saveLedger();
            }

            console.log(`[Ledger] Total credentials: ${this.ledger.length}`);
        } catch (error) {
            console.error('[Credential] Error processing incoming credential:', error.message);
        }
    }
}

// Start the node
const nodeName = process.env.NODE_NAME || 'unknown';
const nodeType = process.env.NODE_TYPE || 'relay';

console.log(`\n=== Starting ${nodeName} (${nodeType}) ===\n`);

const node = new CredentialNode(nodeName, nodeType);
node.start().catch(error => {
    console.error('Failed to start node:', error);
    process.exit(1);
});