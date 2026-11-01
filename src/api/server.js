/**
 * @file server.js
 * @author Bahattin Yunus Çetin (IT Architect)
 * @notice Lightweight, zero-dependency REST API and Oracle service for TEKNOFEST Blokzinciri.
 */

const http = require('http');
const url = require('url');
const BlockArchitectSDK = require('../sdk/BlockArchitectSDK');

const PORT = process.env.PORT || 3000;
const sdk = new BlockArchitectSDK();

// Helper to parse JSON request body
function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            if (!body) return resolve({});
            try {
                resolve(JSON.parse(body));
            } catch (err) {
                reject(new Error('Invalid JSON'));
            }
        });
        req.on('error', reject);
    });
}

// Send JSON response helper
function sendJSON(res, statusCode, data) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end(JSON.stringify(data, null, 2));
}

const server = http.createServer(async (req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        });
        return res.end();
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    try {
        // --- Health & Metrics ---
        if (pathname === '/api/v1/health' && method === 'GET') {
            return sendJSON(res, 200, {
                status: 'HEALTHY',
                protocol: 'Block-Architect-TR',
                competition: 'TEKNOFEST 2025/2026',
                architect: 'Bahattin Yunus Çetin',
                version: '3.0.0 Masterpiece Enterprise',
                contractsCount: 11,
                uptime: process.uptime()
            });
        }

        if (pathname === '/api/v1/metrics' && method === 'GET') {
            return sendJSON(res, 200, sdk.getMetrics());
        }

        // --- Operations ---
        if (pathname === '/api/v1/operations' && method === 'POST') {
            const body = await parseBody(req);
            if (!body.payload) {
                return sendJSON(res, 400, { error: 'Missing required field: payload' });
            }
            const result = await sdk.submitOperation(body.payload, body.tag || 'REST_API');
            return sendJSON(res, 201, { success: true, result });
        }

        if (pathname === '/api/v1/operations/batch' && method === 'POST') {
            const body = await parseBody(req);
            if (!Array.isArray(body.items)) {
                return sendJSON(res, 400, { error: 'Missing or invalid field: items (must be array)' });
            }
            const result = await sdk.submitBatch(body.items, body.tag || 'REST_BATCH');
            return sendJSON(res, 201, { success: true, result });
        }

        // --- Decentralized Identity (DID) ---
        if (pathname === '/api/v1/did/register' && method === 'POST') {
            const body = await parseBody(req);
            if (!body.category || !body.id) {
                return sendJSON(res, 400, { error: 'Fields required: category, id' });
            }
            const result = await sdk.registerDID(body.category, body.id, body.document || {});
            return sendJSON(res, 201, { success: true, identity: result });
        }

        if (pathname === '/api/v1/did/credential' && method === 'POST') {
            const body = await parseBody(req);
            if (!body.didKey || !body.schemaType || !body.claims) {
                return sendJSON(res, 400, { error: 'Fields required: didKey, schemaType, claims' });
            }
            const result = await sdk.issueCredential(body.didKey, body.schemaType, body.claims, body.validitySeconds);
            return sendJSON(res, 201, { success: true, credential: result });
        }

        // --- Supply Chain ---
        if (pathname === '/api/v1/shipments' && method === 'POST') {
            const body = await parseBody(req);
            if (!body.trackingCode || !body.manifest) {
                return sendJSON(res, 400, { error: 'Fields required: trackingCode, manifest' });
            }
            const result = await sdk.createShipment(
                body.trackingCode,
                body.manifest,
                body.recipient || '0xRECEIVER_DEMO',
                body.initialLocation || 'Trabzon/Of Lojistik Merkezi'
            );
            return sendJSON(res, 201, { success: true, shipment: result });
        }

        // --- Zero-Knowledge Proofs ---
        if (pathname === '/api/v1/zk/commit-root' && method === 'POST') {
            const body = await parseBody(req);
            if (!body.root) return sendJSON(res, 400, { error: 'Missing field: root' });
            const result = await sdk.commitZKRoot(body.root);
            return sendJSON(res, 201, { success: true, result });
        }

        if (pathname === '/api/v1/zk/verify' && method === 'POST') {
            const body = await parseBody(req);
            if (!body.root || !body.leaf || !body.proof || !body.isLeft) {
                return sendJSON(res, 400, { error: 'Required: root, leaf, proof, isLeft' });
            }
            const valid = await sdk.verifyZKMembership(body.root, body.leaf, body.proof, body.isLeft);
            return sendJSON(res, 200, { valid });
        }

        // --- Jury Scoring Protocol ---
        if (pathname === '/api/v1/jury/teams' && method === 'POST') {
            const body = await parseBody(req);
            if (!body.teamName || !body.projectTitle) {
                return sendJSON(res, 400, { error: 'Required: teamName, projectTitle' });
            }
            const team = await sdk.registerTeam(body.teamName, body.projectTitle);
            return sendJSON(res, 201, { success: true, team });
        }

        if (pathname === '/api/v1/jury/leaderboard' && method === 'GET') {
            return sendJSON(res, 200, { leaderboard: sdk.getLeaderboard() });
        }

        if (pathname === '/api/v1/jury/commit' && method === 'POST') {
            const body = await parseBody(req);
            if (!body.teamId || !body.rubric || !body.salt) {
                return sendJSON(res, 400, { error: 'Required: teamId, rubric, salt' });
            }
            const resCommit = await sdk.commitJuryScore(body.teamId, body.rubric, body.salt, body.juryAddress);
            return sendJSON(res, 201, { success: true, commitment: resCommit });
        }

        if (pathname === '/api/v1/jury/reveal' && method === 'POST') {
            const body = await parseBody(req);
            if (!body.teamId || !body.rubric || !body.salt) {
                return sendJSON(res, 400, { error: 'Required: teamId, rubric, salt' });
            }
            const resReveal = await sdk.revealJuryScore(body.teamId, body.rubric, body.salt, body.juryAddress);
            return sendJSON(res, 200, { success: true, result: resReveal });
        }

        // --- Cross-Chain Bridge Anchor ---
        if (pathname === '/api/v1/bridge/dispatch' && method === 'POST') {
            const body = await parseBody(req);
            if (!body.destinationChainId || !body.targetContract || !body.payload) {
                return sendJSON(res, 400, { error: 'Required: destinationChainId, targetContract, payload' });
            }
            const msg = await sdk.dispatchBridgeMessage(body.destinationChainId, body.targetContract, body.payload, body.sender);
            return sendJSON(res, 201, { success: true, message: msg });
        }

        // --- Achievement NFT (Soulbound EIP-5192) ---
        if (pathname === '/api/v1/nft/mint' && method === 'POST') {
            const body = await parseBody(req);
            if (!body.recipient || !body.teamName) {
                return sendJSON(res, 400, { error: 'Required: recipient, teamName' });
            }
            const badge = await sdk.mintAchievementBadge(
                body.recipient,
                body.teamName,
                body.projectTitle || 'TEKNOFEST Finalisti',
                body.tier || 'Gold',
                body.scoreScaled || 9800,
                body.verificationProof || '0xProof',
                body.isSoulbound !== false
            );
            return sendJSON(res, 201, { success: true, badge });
        }

        if (pathname === '/api/v1/nft/badges' && method === 'GET') {
            const recipient = parsedUrl.query.recipient;
            return sendJSON(res, 200, { badges: sdk.getBadges(recipient) });
        }

        // --- Telemetry Oracle Hub ---
        if (pathname === '/api/v1/oracle/telemetry' && method === 'POST') {
            const body = await parseBody(req);
            if (!body.feedId || !body.temperatureScaled) {
                return sendJSON(res, 400, { error: 'Required: feedId, temperatureScaled' });
            }
            const result = await sdk.submitTelemetryFeed(
                body.feedId,
                body.nodeAddress || '0xNodeTrabzon',
                body.temperatureScaled,
                body.altitudeMeters || 1200,
                body.speedKmh || 180
            );
            return sendJSON(res, 201, { success: true, result });
        }

        if (pathname === '/api/v1/oracle/consensus' && method === 'GET') {
            const feedId = parsedUrl.query.feedId || 'TKF-IHA-01';
            const consensus = sdk.getTelemetryConsensus(feedId);
            return sendJSON(res, 200, { consensus });
        }

        // --- Security Audit Engine ---
        if (pathname === '/api/v1/security/audit' && method === 'GET') {
            const audit = await sdk.runSecurityAudit();
            return sendJSON(res, 200, audit);
        }

        // Fallback 404
        sendJSON(res, 404, {
            error: 'Route not found',
            availableEndpoints: [
                'GET /api/v1/health',
                'GET /api/v1/metrics',
                'POST /api/v1/operations',
                'POST /api/v1/operations/batch',
                'POST /api/v1/did/register',
                'POST /api/v1/did/credential',
                'POST /api/v1/shipments',
                'POST /api/v1/zk/commit-root',
                'POST /api/v1/zk/verify',
                'POST /api/v1/jury/teams',
                'GET /api/v1/jury/leaderboard',
                'POST /api/v1/jury/commit',
                'POST /api/v1/jury/reveal',
                'POST /api/v1/bridge/dispatch',
                'POST /api/v1/nft/mint',
                'GET /api/v1/nft/badges',
                'POST /api/v1/oracle/telemetry',
                'GET /api/v1/oracle/consensus',
                'GET /api/v1/security/audit'
            ]
        });
    } catch (err) {
        sendJSON(res, 500, { error: err.message });
    }
});

if (require.main === module) {
    server.listen(PORT, () => {
        console.log(`=======================================================`);
        console.log(`[Block-Architect-TR] REST API Server Running on port ${PORT}`);
        console.log(`Health Check: http://localhost:${PORT}/api/v1/health`);
        console.log(`Metrics:      http://localhost:${PORT}/api/v1/metrics`);
        console.log(`Security:     http://localhost:${PORT}/api/v1/security/audit`);
        console.log(`=======================================================`);
    });
}

module.exports = server;
