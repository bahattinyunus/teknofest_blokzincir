/**
 * @file main.js
 * @author Bahattin Yunus Çetin (IT Architect)
 * @notice Core library entry point and bootstrap runner for TEKNOFEST Blokzinciri.
 */

const BlockArchitectSDK = require('./sdk/BlockArchitectSDK');
const cryptoUtils = require('./utils/crypto');

// Export public SDK and cryptographic modules
module.exports = {
    BlockArchitectSDK,
    cryptoUtils
};

// If executed directly, run an automated architectural integrity demonstration
if (require.main === module) {
    (async () => {
        console.log(`[Block-Architect-TR] Core Initializing...`);
        const sdk = new BlockArchitectSDK();

        console.log(`[1] Submitting Genesis Architecture Hash...`);
        const opResult = await sdk.submitOperation('TEKNOFEST 2025/2026 Core Protocol Genesis', 'GENESIS');
        console.log(`    Operation Committed. ID: ${opResult.opId}, Hash: ${opResult.dataHash}`);

        console.log(`[2] Registering Architect DID...`);
        const did = await sdk.registerDID('architect', 'bahattinyunus', {
            name: 'Bahattin Yunus Çetin',
            role: 'IT Architect',
            location: 'Trabzon/Of'
        });
        console.log(`    DID Created: ${did.didUri}`);

        console.log(`[3] Initiating Critical Logistics Stream...`);
        const shipment = await sdk.createShipment('TKF-DISPATCH-001', 'Mission Avionics Payload', '0xTeknofestJury');
        console.log(`    Shipment Initialized: ${shipment.trackingCode}`);

        console.log(`[4] System Health & Metrics Check:`);
        console.dir(sdk.getMetrics(), { depth: null, colors: true });
        console.log(`\n✨ Block-Architect Protocol successfully operational!`);
    })().catch(console.error);
}
