import { createLibp2p } from "libp2p";
import { gossipsub } from "@libp2p/gossipsub";
import { tcp } from "@libp2p/tcp";
import { noise } from "@libp2p/noise";
import { mplex } from "@libp2p/mplex";
import { fromString, toString } from "uint8arrays";
import { P2P_PORT, NODE_NAME } from "../config.js";

const CREDENTIAL_TOPIC = "educhain-credentials";

export async function createP2PNode(onCredentialMessage) {
  const node = await createLibp2p({
    addresses: {
      listen: [`/ip4/0.0.0.0/tcp/${P2P_PORT}`]
    },
    transports: [tcp()],
    connectionEncryption: [noise()],
    streamMuxers: [mplex()],
    pubsub: gossipsub()
  });

  node.pubsub.subscribe(CREDENTIAL_TOPIC);

  node.pubsub.addEventListener("message", (evt) => {
    try {
      const msgStr = toString(evt.detail.data);
      const msg = JSON.parse(msgStr);
      if (msg.type === "credential") {
        onCredentialMessage(msg.payload, evt.detail);
      }
    } catch (err) {
      console.error(`[${NODE_NAME}] Failed to process pubsub message`, err);
    }
  });

  await node.start();
  console.log(`[${NODE_NAME}] libp2p node started on port ${P2P_PORT}`);

  async function broadcastCredential(credential) {
    const msg = {
      type: "credential",
      payload: credential
    };
    await node.pubsub.publish(CREDENTIAL_TOPIC, fromString(JSON.stringify(msg)));
  }

  return {
    node,
    broadcastCredential
  };
}
