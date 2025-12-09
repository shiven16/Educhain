import { NODE_NAME, NODE_TYPE, REGISTRY_ENABLED, HEARTBEAT_INTERVAL_MS, HEARTBEAT_TIMEOUT_MS } from "../config.js";
const nodesState = new Map(); // used only when REGISTRY_ENABLED = true

// ---------- CLIENT SIDE (all nodes except registry) ----------
export function startHeartbeatToRegistry(registryUrl) {
  if (REGISTRY_ENABLED) return; // registry node doesn't send heartbeats to itself

  setInterval(async () => {
    try {
      await fetch(`${registryUrl}/registry/heartbeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodeName: NODE_NAME,
          nodeType: NODE_TYPE,
          timestamp: Date.now()
        })
      });
    } catch (err) {
      console.warn(`[${NODE_NAME}] Failed to send heartbeat to registry`, err.message);
    }
  }, HEARTBEAT_INTERVAL_MS);
}

// ---------- SERVER SIDE (only registry node) ----------
export function registryRecordHeartbeat({ nodeName, nodeType, timestamp }) {
  nodesState.set(nodeName, {
    nodeName,
    nodeType,
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
      status: isAlive ? "active" : "offline",
      lastSeen: node.lastSeen
    });
  }
  return result;
}
