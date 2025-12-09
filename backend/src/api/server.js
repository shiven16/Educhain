import express from "express";
import bodyParser from "body-parser";
import { NODE_NAME, NODE_TYPE, HTTP_PORT, REGISTRY_ENABLED } from "../config.js";
import { appendToLedger, findCredentialById, getLedger } from "../lib/ledger.js";
import { signHash, verifyHashSignature, hashBuffer, ensureKeys } from "../lib/crypto.js";
import { registryRecordHeartbeat, registryGetNodes } from "../lib/registry.js";
import { nanoid } from "nanoid";
import fs from "fs";

export function createApiServer({ broadcastCredential }) {
  const app = express();
  app.use(bodyParser.json());

  const { privateKeyPem, publicKeyPem } = ensureKeys();

  app.get("/health", (req, res) => {
    res.json({ status: "ok", nodeName: NODE_NAME, nodeType: NODE_TYPE });
  });

  // ---- Issue credential (university nodes) ----
  app.post("/issue", async (req, res) => {
    if (NODE_TYPE !== "university") {
      return res.status(403).json({ error: "Only university nodes can issue credentials" });
    }

    const { studentName, degree, year, pdfPath } = req.body;

    if (!studentName || !degree || !year || !pdfPath) {
      return res.status(400).json({ error: "Missing fields" });
    }

    if (!fs.existsSync(pdfPath)) {
      return res.status(400).json({ error: "PDF not found on server path" });
    }

    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfHash = hashBuffer(pdfBuffer);
    const signature = signHash(pdfHash, privateKeyPem);

    const credential = {
      id: nanoid(),
      studentName,
      degree,
      year,
      issuer: NODE_NAME,
      issuerPublicKey: publicKeyPem,
      pdfHash,
      signature,
      timestamp: Date.now()
    };

    appendToLedger(credential);

    if (broadcastCredential) {
      await broadcastCredential(credential);
    }

    res.json({ message: "Credential issued", credential });
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
      const { nodeName, nodeType, timestamp } = req.body;
      registryRecordHeartbeat({ nodeName, nodeType, timestamp });
      res.json({ ok: true });
    });

    app.get("/network/nodes", (req, res) => {
      res.json(registryGetNodes());
    });
  }

  app.listen(HTTP_PORT, () => {
    console.log(`[${NODE_NAME}] HTTP API listening on port ${HTTP_PORT}`);
  });
}
