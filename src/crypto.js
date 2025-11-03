import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * Cryptographic utilities for signing and verifying credentials
 * Uses ECDSA (Elliptic Curve Digital Signature Algorithm)
 */

export class CryptoManager {
    constructor(dataDir) {
        this.dataDir = dataDir;
        this.keysPath = path.join(dataDir, 'keys.json');
        this.keys = this.loadOrGenerateKeys();
    }

    /**
     * Load existing keys or generate new key pair
     */
    loadOrGenerateKeys() {
        if (fs.existsSync(this.keysPath)) {
            const keysData = JSON.parse(fs.readFileSync(this.keysPath, 'utf8'));
            return {
                privateKey: crypto.createPrivateKey({
                    key: keysData.privateKey,
                    format: 'pem'
                }),
                publicKey: crypto.createPublicKey({
                    key: keysData.publicKey,
                    format: 'pem'
                }),
                publicKeyPem: keysData.publicKey
            };
        }

        // Generate new ECDSA key pair
        const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
            namedCurve: 'secp256k1',
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
        });

        const keysData = {
            privateKey,
            publicKey
        };

        fs.writeFileSync(this.keysPath, JSON.stringify(keysData, null, 2));

        return {
            privateKey: crypto.createPrivateKey(privateKey),
            publicKey: crypto.createPublicKey(publicKey),
            publicKeyPem: publicKey
        };
    }

    /**
     * Sign credential data with private key
     * Returns base64-encoded signature
     */
    sign(data) {
        const dataString = JSON.stringify(data);
        const sign = crypto.createSign('SHA256');
        sign.update(dataString);
        sign.end();
        return sign.sign(this.keys.privateKey, 'base64');
    }

    /**
     * Verify signature using public key
     * @param {Object} data - Credential data (without signature)
     * @param {string} signature - Base64-encoded signature
     * @param {string} publicKeyPem - PEM-formatted public key
     */
    static verify(data, signature, publicKeyPem) {
        try {
            const dataString = JSON.stringify(data);
            const verify = crypto.createVerify('SHA256');
            verify.update(dataString);
            verify.end();

            const publicKey = crypto.createPublicKey(publicKeyPem);
            return verify.verify(publicKey, signature, 'base64');
        } catch (error) {
            console.error('Verification error:', error.message);
            return false;
        }
    }

    /**
     * Get public key in PEM format for sharing
     */
    getPublicKey() {
        return this.keys.publicKeyPem;
    }
}