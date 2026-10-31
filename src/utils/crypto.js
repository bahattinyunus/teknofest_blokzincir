/**
 * @file crypto.js
 * @author Bahattin Yunus Çetin (IT Architect)
 * @notice Advanced cryptographic, ZK-Proof, and hashing primitives for TEKNOFEST Blokzinciri.
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
 * Generate a commit hash for TEKNOFEST Jury anti-collusion scoring.
 * @param {number} teamId
 * @param {Object} rubric { architecture, security, innovation, implementation, presentation }
 * @param {string} salt Cryptographic secret salt
 * @param {string} juryAddress Evaluator's wallet address
 * @returns {string} 32-byte hex hash
 */
function hashJuryCommitment(teamId, rubric, salt, juryAddress) {
    const canonical = [
        teamId,
        rubric.architecture,
        rubric.security,
        rubric.innovation,
        rubric.implementation,
        rubric.presentation,
        salt,
        juryAddress.toLowerCase()
    ].join(':');
    return keccak256(canonical);
}

/**
 * Generate a range-proof commitment C = H(value || blindingFactor).
 * @param {number} value
 * @param {string} blindingFactor
 * @returns {string} 32-byte hex hash
 */
function generatePedersenCommitment(value, blindingFactor) {
    return keccak256(`${value}:${blindingFactor}`);
}

/**
 * Generate a deterministic nullifier to prevent double-spending or replay of ZK credentials.
 * @param {string} secretKey
 * @param {string} scopeId
 * @returns {string} 32-byte hex hash
 */
function generateNullifier(secretKey, scopeId) {
    return keccak256(`nullifier:${secretKey}:${scopeId}`);
}

/**
 * Compute cross-chain message payload hash.
 * @param {number} sourceChainId
 * @param {number} targetChainId
 * @param {number} nonce
 * @param {string} sender
 * @param {string} targetContract
 * @param {string|Buffer} payload
 * @returns {string}
 */
function computeCrossChainMessageHash(sourceChainId, targetChainId, nonce, sender, targetContract, payload) {
    const payloadHash = keccak256(payload);
    return keccak256(`${sourceChainId}:${targetChainId}:${nonce}:${sender.toLowerCase()}:${targetContract.toLowerCase()}:${payloadHash}`);
}

/**
 * Enterprise Merkle Tree with inclusion proof generation and verification.
 */
class SimpleMerkleTree {
    constructor(leaves) {
        this.leaves = leaves.map(leaf => (leaf.startsWith('0x') ? leaf : keccak256(leaf)));
        this.layers = [this.leaves];
        this.buildTree();
        this.root = this.layers[this.layers.length - 1][0] || '0x' + '0'.repeat(64);
    }

    buildTree() {
        let currentLayer = this.layers[0];
        while (currentLayer.length > 1) {
            const nextLayer = [];
            for (let i = 0; i < currentLayer.length; i += 2) {
                const left = currentLayer[i];
                const right = (i + 1 < currentLayer.length) ? currentLayer[i + 1] : left;
                const combined = crypto.createHash('sha3-256')
                    .update(Buffer.from(left.slice(2) + right.slice(2), 'hex'))
                    .digest('hex');
                nextLayer.push('0x' + combined);
            }
            this.layers.push(nextLayer);
            currentLayer = nextLayer;
        }
    }

    getRoot() {
        return this.root;
    }

    /**
     * Generate an inclusion proof for a leaf at a given index.
     * @param {number} index
     * @returns {{ leaf: string, proof: string[], isLeft: boolean[] }}
     */
    getProof(index) {
        if (index < 0 || index >= this.leaves.length) {
            throw new Error('Index out of bounds');
        }

        const proof = [];
        const isLeft = [];
        let currentIndex = index;

        for (let l = 0; l < this.layers.length - 1; l++) {
            const layer = this.layers[l];
            const isRightNode = currentIndex % 2 === 1;
            const siblingIndex = isRightNode ? currentIndex - 1 : currentIndex + 1;

            if (siblingIndex < layer.length) {
                proof.push(layer[siblingIndex]);
                isLeft.push(isRightNode);
            } else {
                // Odd element paired with itself
                proof.push(layer[currentIndex]);
                isLeft.push(false);
            }
            currentIndex = Math.floor(currentIndex / 2);
        }

        return {
            leaf: this.leaves[index],
            proof,
            isLeft
        };
    }

    /**
     * Static helper to verify a proof against a known root.
     */
    static verifyProof(root, leaf, proof, isLeft) {
        let current = leaf;
        for (let i = 0; i < proof.length; i++) {
            const sibling = proof[i];
            const leftHex = isLeft[i] ? sibling.slice(2) : current.slice(2);
            const rightHex = isLeft[i] ? current.slice(2) : sibling.slice(2);
            const combined = crypto.createHash('sha3-256')
                .update(Buffer.from(leftHex + rightHex, 'hex'))
                .digest('hex');
            current = '0x' + combined;
        }
        return current === root;
    }
}

module.exports = {
    sha256,
    keccak256,
    formatDID,
    hashSensorTelemetry,
    hashJuryCommitment,
    generatePedersenCommitment,
    generateNullifier,
    computeCrossChainMessageHash,
    SimpleMerkleTree
};
