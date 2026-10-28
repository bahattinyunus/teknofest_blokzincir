/**
 * @file runner.js
 * @author Bahattin Yunus Çetin (IT Architect)
 * @notice Standalone test runner for Block-Architect-TR protocol test verification.
 */

const assert = require('assert');
const { sha256, keccak256, formatDID, hashSensorTelemetry, SimpleMerkleTree } = require('../src/utils/crypto');
const BlockArchitectSDK = require('../src/sdk/BlockArchitectSDK');

let passedTests = 0;
let totalTests = 0;

function it(description, fn) {
    totalTests++;
    try {
        fn();
        console.log(`  \x1b[32m✔\x1b[0m ${description}`);
        passedTests++;
    } catch (err) {
        console.error(`  \x1b[31m✖\x1b[0m ${description}`);
        console.error(`    \x1b[31mError:\x1b[0m ${err.message}`);
    }
}

async function itAsync(description, fn) {
    totalTests++;
    try {
        await fn();
        console.log(`  \x1b[32m✔\x1b[0m ${description}`);
        passedTests++;
    } catch (err) {
        console.error(`  \x1b[31m✖\x1b[0m ${description}`);
        console.error(`    \x1b[31mError:\x1b[0m ${err.message}`);
    }
}

async function runAllTests() {
    console.log(`\n===============================================================`);
    console.log(`   TEST SÜİTİ: BLOCK-ARCHITECT-TR PROTOKOL DOĞRULAMASI`);
    console.log(`===============================================================\n`);

    console.log('📌 1. Kriptografik Fonksiyonlar & Merkle Ağacı Testleri');
    it('SHA-256 ve Keccak-256 doğru formatta 0x hex üretmeli', () => {
        const hash = keccak256('TEKNOFEST_2025');
        assert.ok(hash.startsWith('0x'));
        assert.strictEqual(hash.length, 66); // 32 bytes hex + 0x
    });

    it('DID formatlayıcı standart W3C URI üretmeli', () => {
        const uri = formatDID('team', 'arch-trabzon-01');
        assert.strictEqual(uri, 'did:teknofest:2025:team:arch-trabzon-01');
    });

    it('IoT Telemetri verisi tutarlı özet üretmeli', () => {
        const h1 = hashSensorTelemetry({ temperature: 21.5, humidity: 55, gpsLat: 41.0, gpsLng: 40.2 });
        const h2 = hashSensorTelemetry({ temperature: 21.5, humidity: 55, gpsLat: 41.0, gpsLng: 40.2 });
        assert.strictEqual(h1, h2);
    });

    it('Merkle Ağacı tekil kök hesaplamalı', () => {
        const tree = new SimpleMerkleTree(['tx1', 'tx2', 'tx3', 'tx4']);
        const root = tree.getRoot();
        assert.ok(root.startsWith('0x'));
        assert.strictEqual(root.length, 66);
    });

    console.log('\n📌 2. Core Protocol & İşlem Mühürleme Testleri');
    const sdk = new BlockArchitectSDK();

    await itAsync('Tekil işlem blokzincire başarıyla mühürlenmeli', async () => {
        const res = await sdk.submitOperation('Avionics Audit Log', 'TEST_OP');
        assert.strictEqual(res.op.verified, true);
        assert.strictEqual(res.opId, 0);
    });

    await itAsync('Toplu işlem (Batch) Merkle kökü oluşturmalı', async () => {
        const res = await sdk.submitBatch(['Log_1', 'Log_2', 'Log_3']);
        assert.strictEqual(res.batchSize, 3);
        assert.ok(res.merkleRoot.startsWith('0x'));
    });

    console.log('\n📌 3. Merkeziyetsiz Kimlik (DID / SSI) Testleri');
    let testDidKey;
    await itAsync('Yeni DID başarıyla kaydedilmeli', async () => {
        const id = await sdk.registerDID('student', 'bahattinyunus', { name: 'Bahattin Yunus' });
        testDidKey = id.didKey;
        assert.strictEqual(id.status, 'Active');
        assert.ok(id.didUri.includes('bahattinyunus'));
    });

    await itAsync('Kayıtlı DID için doğrulanabilir kimlik belgesi verilmeli', async () => {
        const cred = await sdk.issueCredential(testDidKey, 'TeknofestStudentCredential', { gpa: 3.95 });
        assert.strictEqual(cred.schemaType, 'TeknofestStudentCredential');
        assert.strictEqual(cred.revoked, false);
    });

    console.log('\n📌 4. Tedarik Zinciri ve Telemetri Testleri');
    let shipmentId;
    await itAsync('Kargo sevkiyatı başlatılmalı ve ilk kontrol noktası yazılmalı', async () => {
        const s = await sdk.createShipment('TKF-DISPATCH-99', 'Uçuş Kontrol Kartı', '0xReceiver');
        shipmentId = s.id;
        assert.strictEqual(s.trackingCode, 'TKF-DISPATCH-99');
        assert.strictEqual(s.state, 'Created');
        assert.strictEqual(s.checkpoints.length, 1);
    });

    await itAsync('Yol kontrol noktası ve telemetri eklenmeli', async () => {
        const cp = await sdk.logCheckpoint(shipmentId, {
            location: 'Ordu Otoyolu',
            temperature: 21.0,
            humidity: 49.0
        });
        assert.strictEqual(cp.location, 'Ordu Otoyolu');
        const s = sdk._simulationState.shipments.get(shipmentId);
        assert.strictEqual(s.state, 'InTransit');
        assert.strictEqual(s.checkpoints.length, 2);
    });

    console.log('\n===============================================================');
    console.log(`SONUÇ: ${passedTests}/${totalTests} Test Başarıyla Geçti! (%${Math.round((passedTests/totalTests)*100)})`);
    console.log(`===============================================================\n`);

    if (passedTests < totalTests) {
        process.exit(1);
    }
}

if (require.main === module) {
    runAllTests();
}

module.exports = { runAllTests };
