// src/lib/crypto.js
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { DATA_DIR } from "../config.js";

const KEYS_FILE = path.join(DATA_DIR, "keys.json");

/**
 * Manages cryptographic operations:
 * - ECDSA (secp256k1) Key Pair
 * - PDF Hashing
 * - Digital Signature (Hash Signing)
 * - Signature Verification
 */
class CryptoManager {
  constructor() {
    this.ensureDataDirExists();
    this.keys = this.loadOrGenerateKeys();
  }

  ensureDataDirExists() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  /**
   * Load keys from file or generate new ones
   */
  loadOrGenerateKeys() {
    if (fs.existsSync(KEYS_FILE)) {
      const { privateKeyPem, publicKeyPem } = JSON.parse(
        fs.readFileSync(KEYS_FILE, "utf8")
      );
      return {
        privateKeyPem,
        publicKeyPem,
        privateKey: crypto.createPrivateKey(privateKeyPem),
        publicKey: crypto.createPublicKey(publicKeyPem),
      };
    }

    console.log("🔐 Generating new keys for node:", DATA_DIR);

    const { privateKey, publicKey } = crypto.generateKeyPairSync("ec", {
      namedCurve: "secp256k1",
    });

    const privateKeyPem = privateKey.export({
      type: "pkcs8",
      format: "pem",
    });

    const publicKeyPem = publicKey.export({
      type: "spki",
      format: "pem",
    });

    fs.writeFileSync(
      KEYS_FILE,
      JSON.stringify({ privateKeyPem, publicKeyPem }, null, 2),
      "utf8"
    );

    return {
      privateKeyPem,
      publicKeyPem,
      privateKey,
      publicKey,
    };
  }

  /**
   * Compute SHA-256 hash of PDF file
   */
  hashPDF(pdfPath) {
    if (!fs.existsSync(pdfPath)) {
      throw new Error("PDF file not found: " + pdfPath);
    }
    const pdfBuffer = fs.readFileSync(pdfPath);
    return this.hashBuffer(pdfBuffer);
  }

  hashBuffer(buffer) {
    return crypto.createHash("sha256")
      .update(buffer)
      .digest("hex");
  }

  /**
   * Sign hash using private key
   * Returns Base64 signature
   */
  signHash(hashHex) {
    const sign = crypto.createSign("sha256");
    sign.update(Buffer.from(hashHex, "hex"));
    sign.end();
    return sign.sign(this.keys.privateKey).toString("base64");
  }

  /**
   * Verify hash signature using public key
   */
  static verifyHashSignature(hashHex, signatureBase64, publicKeyPem) {
    try {
      const verify = crypto.createVerify("sha256");
      verify.update(Buffer.from(hashHex, "hex"));
      verify.end();

      const publicKey = crypto.createPublicKey(publicKeyPem);

      return verify.verify(
        publicKey,
        Buffer.from(signatureBase64, "base64")
      );
    } catch (err) {
      console.error("Verification error:", err.message);
      return false;
    }
  }

  /**
   * Return public key (shared with employers)
   */
  getPublicKey() {
    return this.keys.publicKeyPem;
  }
}

// Singleton instance
const cryptoManager = new CryptoManager();

// Export functions expected by other modules
export function ensureKeys() {
  return cryptoManager.keys;
}

export function signHash(hashHex) {
  return cryptoManager.signHash(hashHex);
}

export function verifyHashSignature(hashHex, signatureBase64, publicKeyPem) {
  return CryptoManager.verifyHashSignature(hashHex, signatureBase64, publicKeyPem);
}

export function hashBuffer(buffer) {
  return cryptoManager.hashBuffer(buffer);
}

export { CryptoManager };
