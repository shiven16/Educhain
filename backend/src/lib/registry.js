import { NODE_NAME, NODE_TYPE, REGISTRY_ENABLED, HEARTBEAT_INTERVAL_MS, HEARTBEAT_TIMEOUT_MS, P2P_PORT, HTTP_PORT } from "../config.js";
import { multiaddr } from "@multiformats/multiaddr";
import { peerIdFromString } from "@libp2p/peer-id";
import os from "os";

const nodesState = new Map(); // used only when REGISTRY_ENABLED = true
const credentialsStore = []; // Store all published credentials

// Helper function to get container's IP address
function getContainerIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "127.0.0.1";
}

// ---------- CLIENT SIDE (all nodes except registry) ----------
export function startHeartbeatToRegistry(node, registryUrl) {
  if (REGISTRY_ENABLED) return; // registry node doesn't send heartbeats to itself

  const ipAddress = getContainerIP();

  setInterval(async () => {
    try {
      await fetch(`${registryUrl}/registry/heartbeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodeName: NODE_NAME,
          nodeType: NODE_TYPE,
          p2pPort: P2P_PORT,
          httpPort: HTTP_PORT,
          peerId: node.peerId.toString(),
          ipAddress: ipAddress,
          timestamp: Date.now()
        })
      });
    } catch (err) {
      console.warn(`[${NODE_NAME}] Failed to send heartbeat to registry`, err.message);
    }
  }, HEARTBEAT_INTERVAL_MS);
}

export function startCredentialSync(registryUrl, onNewCredential) {
  if (REGISTRY_ENABLED) return;

  // Track which credentials we've already seen
  const seenCredentials = new Set();

  // Poll registry for new credentials every 3 seconds
  setInterval(async () => {
    try {
      const res = await fetch(`${registryUrl}/credentials/list`);
      const credentials = await res.json();

      for (const credential of credentials) {
        // Skip if we've already processed this credential
        if (seenCredentials.has(credential.id)) continue;

        // Skip if this is our own credential
        if (credential.issuer === NODE_NAME) {
          seenCredentials.add(credential.id);
          continue;
        }

        // New credential from another node!
        console.log(`[${NODE_NAME}] Received credential ${credential.id} from ${credential.issuer}`);
        seenCredentials.add(credential.id);
        onNewCredential(credential);
      }
    } catch (err) {
      console.warn(`[${NODE_NAME}] Failed to sync credentials:`, err.message);
    }
  }, 3000);
}

export async function publishCredentialToRegistry(registryUrl, credential) {
  try {
    await fetch(`${registryUrl}/credentials/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credential)
    });
    console.log(`[${NODE_NAME}] Published credential ${credential.id} to registry`);
  } catch (err) {
    console.warn(`[${NODE_NAME}] Failed to publish credential to registry:`, err.message);
  }
}

// ---------- SERVER SIDE (only registry node) ----------
export function registryRecordHeartbeat({ nodeName, nodeType, timestamp, p2pPort, httpPort, peerId, ipAddress }) {
  nodesState.set(nodeName, {
    nodeName,
    nodeType,
    p2pPort,
    httpPort,
    peerId,
    ipAddress,
    lastSeen: timestamp,
    status: "active"
  });
}

export function registryGetNodes() {
  const now = Date.now();
  const result = [];
  for (const [, node] of nodesState.entries()) {
    const isAlive = now - node.lastSeen <= HEARTBEAT_TIMEOUT_MS;
    result.push({
      nodeName: node.nodeName,
      nodeType: node.nodeType,
      p2pPort: node.p2pPort,
      httpPort: node.httpPort,
      peerId: node.peerId,
      ipAddress: node.ipAddress,
      status: isAlive ? "active" : "offline",
      lastSeen: node.lastSeen
    });
  }
  return result;
}

export function registryStoreCredential(credential) {
  // Check if credential already exists
  const exists = credentialsStore.some(c => c.id === credential.id);
  if (!exists) {
    credentialsStore.push(credential);
    console.log(`[registry] Stored credential ${credential.id} from ${credential.issuer}`);
  }
}

export function registryGetCredentials() {
  return credentialsStore;
}
