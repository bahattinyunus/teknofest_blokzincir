/**
 * @file BlockArchitectSDK.js
 * @author Bahattin Yunus Çetin (IT Architect)
 * @notice Enterprise JavaScript SDK for interacting with TEKNOFEST Blokzinciri smart contracts.
 */

const { keccak256, formatDID, hashSensorTelemetry, SimpleMerkleTree } = require('../utils/crypto');

class BlockArchitectSDK {
    /**
     * @param {Object} options Configuration options
     * @param {string} [options.rpcUrl] EVM JSON-RPC URL
     * @param {string} [options.privateKey] Optional signer private key
     * @param {Object} [options.contractAddresses] Deployed contract addresses
     */
    constructor(options = {}) {
        this.rpcUrl = options.rpcUrl || 'http://127.0.0.1:8545';
        this.addresses = options.contractAddresses || {
            core: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
            identity: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
            supplyChain: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
            token: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
            governance: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9'
        };

        // In-memory simulator store for zero-dependency standalone operation
        this._simulationState = {
            operations: [],
            identities: new Map(),
            credentials: new Map(),
            shipments: new Map(),
            tokens: {
                totalSupply: 10000000,
                balances: { '0xDEPLOYER': 10000000 },
                stakes: {}
            },
            proposals: []
        };
    }

    // --- Core Operations ---

    /**
     * Submit an operation hash to BlockArchitectCore.
     * @param {string} rawData Any string or data payload to anchor
     * @param {string} [tag='DEFAULT'] Category tag
     */
    async submitOperation(rawData, tag = 'DEFAULT') {
        const dataHash = keccak256(rawData);
        const opId = this._simulationState.operations.length;
        const op = {
            id: opId,
            dataHash,
            timestamp: Math.floor(Date.now() / 1000),
            initiator: '0xDEPLOYER',
            verified: true,
            status: 'Submitted',
            tag
        };
        this._simulationState.operations.push(op);
        return { opId, dataHash, op };
    }

    /**
     * Submit a batch of operations.
     * @param {string[]} dataArray Array of items to commit in one batch
     * @param {string} [tag='BATCH']
     */
    async submitBatch(dataArray, tag = 'BATCH') {
        const hashes = dataArray.map(item => keccak256(item));
        const tree = new SimpleMerkleTree(hashes);
        const results = [];
        for (const hash of hashes) {
            const op = {
                id: this._simulationState.operations.length,
                dataHash: hash,
                timestamp: Math.floor(Date.now() / 1000),
                initiator: '0xDEPLOYER',
                verified: true,
                status: 'Submitted',
                tag
            };
            this._simulationState.operations.push(op);
            results.push(op);
        }
        return {
            merkleRoot: tree.getRoot(),
            batchSize: hashes.length,
            operations: results
        };
    }

    // --- Identity Registry ---

    /**
     * Register a new Decentralized Identifier (DID).
     * @param {string} category 'team' | 'citizen' | 'node'
     * @param {string} identifier e.g. 'arch-trabzon-01'
     * @param {Object} didDocument Metadata / public keys
     */
    async registerDID(category, identifier, didDocument = {}) {
        const didUri = formatDID(category, identifier);
        const docHash = keccak256(JSON.stringify(didDocument));
        const didKey = keccak256(didUri);

        const identity = {
            didKey,
            didUri,
            docHash,
            createdAt: Math.floor(Date.now() / 1000),
            status: 'Active',
            credentials: []
        };
        this._simulationState.identities.set(didKey, identity);
        return identity;
    }

    /**
     * Issue a verifiable credential to a DID.
     * @param {string} didKey 
     * @param {string} schemaType e.g. 'StudentCredential'
     * @param {Object} claims e.g. { university: 'KTU', role: 'Team Lead' }
     * @param {number} validitySeconds Duration in seconds
     */
    async issueCredential(didKey, schemaType, claims, validitySeconds = 31536000) {
        const credHash = keccak256(JSON.stringify(claims));
        const schemaHash = keccak256(schemaType);
        const cred = {
            credHash,
            schemaType,
            schemaHash,
            claims,
            issuedAt: Math.floor(Date.now() / 1000),
            expiresAt: Math.floor(Date.now() / 1000) + validitySeconds,
            revoked: false
        };

        this._simulationState.credentials.set(credHash, cred);
        const id = this._simulationState.identities.get(didKey);
        if (id) {
            id.credentials.push(credHash);
        }
        return cred;
    }

    // --- Supply Chain ---

    /**
     * Create a new trackable cargo shipment.
     * @param {string} trackingCode e.g. 'TKF-TR-2025-001'
     * @param {string} manifestData Cargo description or manifest JSON
     * @param {string} recipientAddress
     * @param {string} initialLocation
     */
    async createShipment(trackingCode, manifestData, recipientAddress, initialLocation = 'Trabzon/Of Hub') {
        const itemHash = keccak256(manifestData);
        const shipmentId = this._simulationState.shipments.size + 1;
        const shipment = {
            id: shipmentId,
            trackingCode,
            itemHash,
            sender: '0xDEPLOYER',
            recipient: recipientAddress,
            currentCustodian: '0xDEPLOYER',
            state: 'Created',
            createdAt: Math.floor(Date.now() / 1000),
            checkpoints: [
                {
                    timestamp: Math.floor(Date.now() / 1000),
                    location: initialLocation,
                    temperature: 20.5,
                    humidity: 55.0,
                    hash: itemHash
                }
            ]
        };
        this._simulationState.shipments.set(shipmentId, shipment);
        return shipment;
    }

    /**
     * Add checkpoint telemetry to a shipment.
     * @param {number} shipmentId 
     * @param {Object} checkpointData { location, temperature, humidity, gpsLat, gpsLng }
     */
    async logCheckpoint(shipmentId, checkpointData) {
        const shipment = this._simulationState.shipments.get(shipmentId);
        if (!shipment) throw new Error('Shipment not found');

        const proofHash = hashSensorTelemetry(checkpointData);
        const cp = {
            timestamp: Math.floor(Date.now() / 1000),
            location: checkpointData.location,
            temperature: checkpointData.temperature,
            humidity: checkpointData.humidity,
            sensorProofHash: proofHash
        };
        shipment.checkpoints.push(cp);
        shipment.state = 'InTransit';
        return cp;
    }

    // --- Metrics & Health ---

    getMetrics() {
        return {
            totalOperations: this._simulationState.operations.length,
            totalIdentities: this._simulationState.identities.size,
            totalCredentials: this._simulationState.credentials.size,
            totalShipments: this._simulationState.shipments.size,
            systemHealth: 'OPERATIONAL',
            uptimeSeconds: Math.floor(process.uptime()),
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = BlockArchitectSDK;
