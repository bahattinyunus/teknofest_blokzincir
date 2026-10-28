/**
 * @file crypto.js
 * @author Bahattin Yunus Çetin (IT Architect)
 * @notice Cryptographic and hashing primitives for TEKNOFEST Blokzinciri.
 */

const crypto = require('crypto');

/**
 * Compute SHA-256 hash of a string or buffer.
 * @param {string|Buffer} data 
 * @returns {string} Hex string prefixed with 0x
 */
function sha256(data) {
    const hash = crypto.createHash('sha256').update(data).digest('hex');
    return '0x' + hash;
}

/**
 * Compute simulated Keccak-256 / SHA3-256 hash of input data.
 * @param {string|Buffer} data 
 * @returns {string} 32-byte hex hash prefixed with 0x
 */
function keccak256(data) {
    const hash = crypto.createHash('sha3-256').update(data).digest('hex');
    return '0x' + hash;
}

/**
 * Generate a canonical DID URI for a TEKNOFEST team or participant.
 * @param {string} category 'team' | 'citizen' | 'node' | 'sensor'
 * @param {string} id Unique identifier
 * @returns {string}
 */
function formatDID(category, id) {
    const sanitizedId = String(id).toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    return `did:teknofest:2025:${category}:${sanitizedId}`;
}

/**
 * Generate an IoT sensor telemetry proof hash.
 * @param {Object} telemetry { temperature, humidity, gpsLat, gpsLng, timestamp }
 * @returns {string} Hex hash
 */
function hashSensorTelemetry(telemetry) {
    const payload = JSON.stringify({
        t: telemetry.temperature,
        h: telemetry.humidity,
        lat: telemetry.gpsLat || 0,
        lng: telemetry.gpsLng || 0,
        ts: telemetry.timestamp || 0
    });
    return keccak256(payload);
}

/**
 * Minimal Merkle Tree calculation for batched transactions or item manifests.
 */
class SimpleMerkleTree {
    constructor(leaves) {
        this.leaves = leaves.map(leaf => (leaf.startsWith('0x') ? leaf : keccak256(leaf)));
        this.root = this.calculateRoot(this.leaves);
    }

    calculateRoot(nodes) {
        if (nodes.length === 0) return '0x' + '0'.repeat(64);
        if (nodes.length === 1) return nodes[0];

        const nextLevel = [];
        for (let i = 0; i < nodes.length; i += 2) {
            const left = nodes[i];
            const right = (i + 1 < nodes.length) ? nodes[i + 1] : left;
            const combined = crypto.createHash('sha3-256')
                .update(Buffer.from(left.slice(2) + right.slice(2), 'hex'))
                .digest('hex');
            nextLevel.push('0x' + combined);
        }
        return this.calculateRoot(nextLevel);
    }

    getRoot() {
        return this.root;
    }
}

module.exports = {
    sha256,
    keccak256,
    formatDID,
    hashSensorTelemetry,
    SimpleMerkleTree
};
