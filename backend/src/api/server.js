import express from "express";
import bodyParser from "body-parser";
import { NODE_NAME, NODE_TYPE, HTTP_PORT, REGISTRY_ENABLED, DATA_DIR } from "../config.js";
import { appendToLedger, findCredentialById, getLedger } from "../lib/ledger.js";
import { signHash, verifyHashSignature, hashBuffer, ensureKeys } from "../lib/crypto.js";
import { registryRecordHeartbeat, registryGetNodes, registryStoreCredential, registryGetCredentials } from "../lib/registry.js";
import { nanoid } from "nanoid";
import fs from "fs";
import path from "path";

export function createApiServer({ broadcastCredential }) {
  const app = express();
  app.use(express.json());

  const { privateKeyPem, publicKeyPem } = ensureKeys();

  app.get("/health", (req, res) => {
    res.json({ status: "ok", node: NODE_NAME });
  });

  // ---- Issue credential (university nodes) ----
  app.post("/issue", async (req, res) => {
    if (NODE_TYPE !== "university") {
      return res.status(403).json({ error: "Only university nodes can issue credentials" });
    }

    try {
      const { studentName, degree, year, pdfPath } = req.body;

      if (!studentName || !degree || !year || !pdfPath) {
        return res.status(400).json({ error: "Missing fields" });
      }

      // Read and hash the PDF
      const pdfBuffer = await fs.promises.readFile(pdfPath);
      const pdfHash = hashBuffer(pdfBuffer);

      // Read issuer's public key (from ensureKeys() which is already called)
      const issuerPublicKey = publicKeyPem;

      // Create credential object
      const credential = {
        id: nanoid(),
        studentName,
        degree,
        year,
        issuer: NODE_NAME,
        issuerPublicKey,
        pdfHash,
        signature: signHash(pdfHash, privateKeyPem),
        timestamp: Date.now()
      };

      // Save to local ledger
      appendToLedger(credential);

      // Broadcast via P2P (will use allowPublishToZeroTopicPeers)
      if (broadcastCredential) {
        await broadcastCredential(credential);
      }

      res.json({ message: "Credential issued", credential });
    } catch (err) {
      console.error(`[${NODE_NAME}] Error issuing credential:`, err);
      res.status(500).json({ error: err.message });
    }
  });

  // ---- Verify credential (employer nodes) ----
  app.post("/verify", (req, res) => {
    const { credentialId, pdfPath } = req.body;

    if (!credentialId || !pdfPath) {
      return res.status(400).json({ error: "Missing credentialId or pdfPath" });
    }

    const credential = findCredentialById(credentialId);
    if (!credential) {
      return res.status(404).json({ valid: false, error: "Credential not found in ledger" });
    }

    if (!fs.existsSync(pdfPath)) {
      return res.status(400).json({ error: "PDF not found on server path" });
    }

    const pdfBuffer = fs.readFileSync(pdfPath);
    const hash = hashBuffer(pdfBuffer);

    if (hash !== credential.pdfHash) {
      return res.json({ valid: false, reason: "Hash mismatch - PDF tampered" });
    }

    const isValid = verifyHashSignature(hash, credential.signature, credential.issuerPublicKey);

    res.json({
      valid: isValid,
      credentialId,
      issuer: credential.issuer,
      reason: isValid ? "Valid credential" : "Signature verification failed"
    });
  });

  // ---- Ledger view ----
  app.get("/ledger", (req, res) => {
    res.json(getLedger());
  });

  // ---- Registry endpoints (only for registry node) ----
  if (REGISTRY_ENABLED) {
    app.post("/registry/heartbeat", (req, res) => {
      const { nodeName, nodeType, timestamp, p2pPort, peerId, ipAddress } = req.body;
      registryRecordHeartbeat({ nodeName, nodeType, timestamp, p2pPort, peerId, ipAddress });
      res.json({ ok: true });
    });

    app.get("/network/nodes", (req, res) => {
      res.json(registryGetNodes());
    });

    app.post("/credentials/publish", (req, res) => {
      const credential = req.body;
      registryStoreCredential(credential);
      res.json({ ok: true });
    });

    app.get("/credentials/list", (req, res) => {
      res.json(registryGetCredentials());
    });
  }

  app.listen(HTTP_PORT, () => {
    console.log(`[${NODE_NAME}] HTTP API listening on port ${HTTP_PORT}`);
  });
}
