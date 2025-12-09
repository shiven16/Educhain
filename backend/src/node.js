import { NODE_NAME, NODE_TYPE, REGISTRY_URL, REGISTRY_ENABLED } from "./config.js";
import { ensureKeys } from "./lib/crypto.js";
import { createP2PNode } from "./lib/p2p.js";
import { appendToLedger } from "./lib/ledger.js";
import { createApiServer } from "./api/server.js";
import { startHeartbeatToRegistry, startCredentialSync, publishCredentialToRegistry } from "./lib/registry.js";

async function main() {
  console.log(`[${NODE_NAME}] starting as type=${NODE_TYPE}`);

  // Ensure keys exist
  ensureKeys();

  // Setup P2P node (keeping for future use, but not relying on it for now)
  const { node, broadcastCredential } = await createP2PNode((credential) => {
    console.log(
      `[${NODE_NAME}] received credential via gossip from issuer=${credential.issuer} id=${credential.id}`
    );
    appendToLedger(credential);
  });

  // Wrap broadcastCredential to also publish to registry via HTTP
  const broadcastCredentialWithRegistry = async (credential) => {
    // Try P2P broadcast (will work if peers are connected)
    await broadcastCredential(credential);

    // Also publish to registry via HTTP (fallback/primary method)
    if (REGISTRY_URL) {
      await publishCredentialToRegistry(REGISTRY_URL, credential);
    }
  };

  // Start HTTP API
  createApiServer({ broadcastCredential: broadcastCredentialWithRegistry });

  // Start heartbeat to registry (if this is NOT the registry)
  if (!REGISTRY_ENABLED && REGISTRY_URL) {
    startHeartbeatToRegistry(node, REGISTRY_URL);

    // Start credential sync (poll registry for new credentials)
    startCredentialSync(REGISTRY_URL, (credential) => {
      appendToLedger(credential);
    });
  }
}

main().catch((err) => {
  console.error(`[${NODE_NAME}] fatal error`, err);
  process.exit(1);
});
