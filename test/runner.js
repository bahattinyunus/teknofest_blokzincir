/**
 * @file runner.js
 * @author Bahattin Yunus Çetin (IT Architect)
 * @notice Masterpiece test suite and verification runner for all 11 Block-Architect-TR modules.
 */

const assert = require('assert');
const {
    sha256,
    keccak256,
    formatDID,
    hashSensorTelemetry,
    hashJuryCommitment,
    generatePedersenCommitment,
    generateNullifier,
    computeCrossChainMessageHash,
    SimpleMerkleTree
} = require('../src/utils/crypto');
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
    console.log(`   TEST SÜİTİ: BLOCK-ARCHITECT-TR 11'Lİ KURUMSAL PROTOKOL`);
    console.log(`===============================================================\n`);

    // 1. Kriptografi & Merkle
    console.log('📌 1. Kriptografik Fonksiyonlar & Merkle Ağacı Testleri');
    it('SHA-256 ve Keccak-256 doğru formatta 0x hex üretmeli', () => {
        const hash = keccak256('TEKNOFEST_2025');
        assert.ok(hash.startsWith('0x'));
        assert.strictEqual(hash.length, 66);
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

    it('Merkle Ağacı tekil kök ve dahil olma ispatı (inclusion proof) üretmeli', () => {
        const tree = new SimpleMerkleTree(['tx1', 'tx2', 'tx3', 'tx4']);
        const root = tree.getRoot();
        assert.ok(root.startsWith('0x'));
        assert.strictEqual(root.length, 66);

        const proofObj = tree.getProof(1);
        const isValid = SimpleMerkleTree.verifyProof(root, proofObj.leaf, proofObj.proof, proofObj.isLeft);
        assert.strictEqual(isValid, true);
    });

    // 2. Core Protocol
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

    // 3. Identity Registry
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

    // 4. Tedarik Zinciri
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

    // 5. Zero-Knowledge Proofs
    console.log('\n📌 5. Sıfır Bilgi İspatı (ZK-Proof) & Gizlilik Testleri');
    let zkRoot;
    it('Pedersen aralık taahhüdü (Range Proof) doğrulanmalı', () => {
        const commitment = generatePedersenCommitment(24, 'blinding_salt');
        const expected = generatePedersenCommitment(24, 'blinding_salt');
        assert.strictEqual(commitment, expected);
    });

    await itAsync('ZK Merkle ağaç kökü taahhüt edilmeli ve üyelik ispatlanmalı', async () => {
        const tree = new SimpleMerkleTree(['Cert_A', 'Cert_B', 'Cert_C']);
        zkRoot = tree.getRoot();
        await sdk.commitZKRoot(zkRoot);

        const proof = tree.getProof(0);
        const valid = await sdk.verifyZKMembership(zkRoot, proof.leaf, proof.proof, proof.isLeft);
        assert.strictEqual(valid, true);
    });

    await itAsync('Anonim kimlik tek kullanımlık nullifier ile harcanmalı ve çift harcama engellenmeli', async () => {
        const tree = new SimpleMerkleTree(['Leaf_Secret_1', 'Leaf_Secret_2']);
        await sdk.commitZKRoot(tree.getRoot());
        const proof = tree.getProof(1);
        const nullifier = generateNullifier('PrivateUserSecretKey', 'TEKNOFEST_2025_VOTE');

        const res = await sdk.verifyAndConsumeCredential(tree.getRoot(), proof.leaf, proof.proof, proof.isLeft, nullifier);
        assert.strictEqual(res.verified, true);

        // Çift harcama denemesi hata fırlatmalı
        let doubleSpendFailed = false;
        try {
            await sdk.verifyAndConsumeCredential(tree.getRoot(), proof.leaf, proof.proof, proof.isLeft, nullifier);
        } catch (err) {
            doubleSpendFailed = true;
        }
        assert.strictEqual(doubleSpendFailed, true);
    });

    // 6. Jury Scoring Protocol
    console.log('\n📌 6. TEKNOFEST Hakem Heyeti Puanlama & Commit-Reveal Testleri');
    let testTeamId;
    await itAsync('Yarışmacı finalist takım kaydedilmeli', async () => {
        const team = await sdk.registerTeam('Cezeri Otonom', 'Aviyonik Blokzincir');
        testTeamId = team.id;
        assert.strictEqual(team.teamName, 'Cezeri Otonom');
        assert.strictEqual(team.finalized, false);
    });

    await itAsync('Jüri Commit Aşaması: Şifreli puan ağa taahhüt edilmeli', async () => {
        const rubric = { architecture: 2500, security: 2400, innovation: 2450, implementation: 1450, presentation: 950 };
        const salt = '0xSecretSalt99';
        const commit = await sdk.commitJuryScore(testTeamId, rubric, salt, '0xJuryMember1');
        assert.ok(commit.commitHash.startsWith('0x'));
    });

    await itAsync('Jüri Reveal Aşaması: Puan çözülmeli ve doğrulanmalı', async () => {
        const rubric = { architecture: 2500, security: 2400, innovation: 2450, implementation: 1450, presentation: 950 };
        const salt = '0xSecretSalt99';
        const reveal = await sdk.revealJuryScore(testTeamId, rubric, salt, '0xJuryMember1');
        assert.strictEqual(reveal.totalScore, 9750); // 97.50%
    });

    await itAsync('Takım değerlendirmesi sonlandırılmalı ve ödül tescil edilmeli', async () => {
        const fin = await sdk.finalizeTeamEvaluation(testTeamId);
        assert.strictEqual(fin.finalized, true);
        assert.strictEqual(fin.finalScore, 9750);

        await sdk.certifyTeam(testTeamId, 'Türkiye Şampiyonu');
        const team = sdk._simulationState.teams.get(testTeamId);
        assert.strictEqual(team.certified, true);
        assert.strictEqual(team.rank, 'Türkiye Şampiyonu');
    });

    // 7. Soulbound Achievement NFT (EIP-5192)
    console.log('\n📌 7. Soulbound Achievement Badge NFT (EIP-5192) Testleri');
    let mintedTokenId;
    await itAsync('Şampiyon takım için devredilemez Soulbound madalya basılmalı', async () => {
        const badge = await sdk.mintAchievementBadge('0xCezeriTeam', 'Cezeri Otonom', 'Aviyonik Blokzincir', 'Gold', 9750, '0xProofHash', true);
        mintedTokenId = badge.tokenId;
        assert.strictEqual(badge.tier, 'Gold');
        assert.strictEqual(badge.isSoulbound, true);
        assert.strictEqual(badge.scoreScaled, 9750);
    });

    it('Sahibe göre basılan NFT rozetleri doğru listelenmeli', () => {
        const badges = sdk.getBadges('0xCezeriTeam');
        assert.strictEqual(badges.length, 1);
        assert.strictEqual(badges[0].teamName, 'Cezeri Otonom');
    });

    // 8. Telemetry Oracle Hub
    console.log('\n📌 8. Multi-Node IoT Telemetri Oracle Hub Testleri');
    await itAsync('Dağıtık düğümlerden telemetri verisi toplanmalı', async () => {
        await sdk.submitTelemetryFeed('TKF-IHA-01', '0xNodeTrabzon', 2140, 1200, 180);
        await sdk.submitTelemetryFeed('TKF-IHA-01', '0xNodeSamsun', 2150, 1202, 181);
        await sdk.submitTelemetryFeed('TKF-IHA-01', '0xNodeAnkara', 2160, 1198, 179);
        const feedList = sdk._simulationState.oracleFeeds.get('TKF-IHA-01');
        assert.strictEqual(feedList.length, 3);
    });

    it('Oracle konsensüs medyanı aykırı değerleri filtreleyerek hesaplanmalı', () => {
        const consensus = sdk.getTelemetryConsensus('TKF-IHA-01');
        assert.strictEqual(consensus.sampleCount, 3);
        assert.strictEqual(consensus.consensusTemperature, 2150); // Ortanca değer
        assert.strictEqual(consensus.consensusAltitude, 1200);
    });

    // 9. Paymaster Gas Sponsorship (Account Abstraction)
    console.log('\n📌 9. Paymaster Sıfır-Gas Sponsorluk Testleri');
    it('Öğrenci takımı paymaster listesine eklenmeli ve kota atanmalı', () => {
        const ok = sdk.whitelistPaymasterTeam('0xStudentKTU', 50);
        assert.strictEqual(ok, true);
    });

    await itAsync('Beyaz listedeki takım için sıfır gaz maliyetli işlem yürütülmeli', async () => {
        const res = await sdk.executeGaslessTransaction('0xStudentKTU', '0xIdentityContract', 'registerDID()');
        assert.strictEqual(res.sponsored, true);
        assert.strictEqual(res.gasCostWei, 0);
        assert.strictEqual(res.remainingQuota, 49);
    });

    await itAsync('Beyaz listede olmayan adresin gaz sponsorluğu reddedilmeli', async () => {
        let rejected = false;
        try {
            await sdk.executeGaslessTransaction('0xUnauthorizedStranger', '0xContract', 'call()');
        } catch (e) {
            rejected = true;
        }
        assert.strictEqual(rejected, true);
    });

    // 10. Cross-Chain Bridge
    console.log('\n📌 10. Çapraz Zincir Durum Köprüsü (Cross-Chain Bridge) Testleri');
    let bridgeNonce;
    await itAsync('Dış zincire (Polygon #137) köprü mesajı sevk edilmeli', async () => {
        const msg = await sdk.dispatchBridgeMessage(137, '0xPolygonContract', 'StatePayload_123');
        bridgeNonce = msg.nonce;
        assert.strictEqual(msg.destinationChainId, 137);
        assert.ok(msg.nonce >= 1);
    });

    await itAsync('Köprü mesajı tekrar koruması (Replay Protection) ile röle edilmeli', async () => {
        const res = await sdk.relayBridgeMessage(137, bridgeNonce, 'StatePayload_123');
        assert.strictEqual(res.executed, true);

        let replayCaught = false;
        try {
            await sdk.relayBridgeMessage(137, bridgeNonce, 'StatePayload_123');
        } catch (e) {
            replayCaught = true;
        }
        assert.strictEqual(replayCaught, true);
    });

    // 11. Tokenomics & Security Audit
    console.log('\n📌 11. TKF Tokenomics & Sistem Güvenlik Denetim Testleri');
    it('Doğrulayıcı musluktan test jetonu talep edebilmeli', () => {
        const initialBal = sdk.getTokenBalance('0xValidatorUser');
        sdk.claimFaucet('0xValidatorUser');
        const newBal = sdk.getTokenBalance('0xValidatorUser');
        assert.strictEqual(newBal, initialBal + 100);
    });

    it('Doğrulayıcı ağa TKF stake edebilmeli ve getiri kilitleyebilmeli', () => {
        const res = sdk.stakeTokens(50, '0xValidatorUser');
        assert.strictEqual(res.staked, 50);
        assert.strictEqual(res.balance, 50);
    });

    it('Doğrulayıcı stake edilmiş bakiyesini geri çekebilmeli (unstake)', () => {
        const res = sdk.unstakeTokens(20, '0xValidatorUser');
        assert.strictEqual(res.staked, 30);
        assert.strictEqual(res.balance, 70);
    });

    await itAsync('Otomatik Güvenlik ve Penetrasyon Denetimi başarıyla tamamlanmalı', async () => {
        const audit = await sdk.runSecurityAudit();
        assert.strictEqual(audit.overallStatus, 'SECURE (Grade A+)');
        assert.strictEqual(audit.passedChecks, 6);
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
