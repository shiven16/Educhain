import { NODE_NAME, NODE_TYPE, REGISTRY_URL, REGISTRY_ENABLED } from "./config.js";
import { ensureKeys } from "./lib/crypto.js";
import { createP2PNode } from "./lib/p2p.js";
import { appendToLedger } from "./lib/ledger.js";
import { createApiServer } from "./api/server.js";
import { startHeartbeatToRegistry } from "./lib/registry.js";

async function main() {
  console.log(`[${NODE_NAME}] starting as type=${NODE_TYPE}`);

  // Ensure keys exist
  ensureKeys();

  // Setup P2P node (except maybe registry if you want it passive)
  const { broadcastCredential } = await createP2PNode((credential) => {
    console.log(
      `[${NODE_NAME}] received credential via gossip from issuer=${credential.issuer} id=${credential.id}`
    );
    appendToLedger(credential);
  });

  // Start HTTP API
  createApiServer({ broadcastCredential });

  // Start heartbeat to registry (if this is NOT the registry)
  if (!REGISTRY_ENABLED && REGISTRY_URL) {
    startHeartbeatToRegistry(REGISTRY_URL);
  }
}

main().catch((err) => {
  console.error(`[${NODE_NAME}] fatal error`, err);
  process.exit(1);
});
