/**
 * @file seedData.js
 * @author Bahattin Yunus Çetin (IT Architect)
 * @notice Enterprise test and demonstration dataset generator for TEKNOFEST Blokzinciri.
 */

const BlockArchitectSDK = require('../src/sdk/BlockArchitectSDK');
const { SimpleMerkleTree, generatePedersenCommitment } = require('../src/utils/crypto');

async function seed() {
    console.log("===============================================================");
    console.log("🌱 TEKNOFEST Blokzincirine Kapsamlı Demo Verileri Yükleniyor...");
    console.log("===============================================================\n");
    const sdk = new BlockArchitectSDK();

    // 1. Teams & Students DIDs
    console.log("1. Merkeziyetsiz Kimlikler (W3C DID) Oluşturuluyor:");
    const teams = [
        { cat: 'team', id: 'arch-trabzon-alpha', name: 'Alpha Mimarlık Takımı', uni: 'KTÜ' },
        { cat: 'team', id: 'baykar-cezeri-01', name: 'Cezeri Yapay Zeka Takımı', uni: 'İTÜ' },
        { cat: 'team', id: 'selcuk-otonom-16', name: 'Selçuk Otonom Savunma', uni: 'Selçuk Üni' },
        { cat: 'student', id: 'bahattinyunus', name: 'Bahattin Yunus Çetin', role: 'IT Architect' }
    ];

    for (const t of teams) {
        const id = await sdk.registerDID(t.cat, t.id, t);
        console.log(`   ✔ DID Mühürlendi: ${id.didUri}`);
    }

    // 2. Cargo Shipments
    console.log("\n2. Görev Kritik Kargo & Aviyonik Telemetri Akışı:");
    const shipments = [
        { code: 'TKF-IHA-2025-01', desc: 'Aviyonik Uçuş Kontrol Bilgisayarı v4.1', origin: 'Trabzon/Of Lojistik Hub' },
        { code: 'TKF-ROBO-2025-09', desc: 'LiDAR Mesafe Sensörü ve Titreşim Damper Kiti', origin: 'İstanbul Teknopark' },
        { code: 'TKF-SATELLITE-04', desc: 'Küpsat Haberleşme ve Telemetri Modülü', origin: 'Ankara ODTÜ Teknokent' }
    ];

    for (const s of shipments) {
        const ship = await sdk.createShipment(s.code, s.desc, '0xRecipientAddress001', s.origin);
        await sdk.logCheckpoint(ship.id, {
            location: `${s.origin} -> Otoyol Kontrol Noktası`,
            temperature: 20.8,
            humidity: 49.5,
            gpsLat: 40.98,
            gpsLng: 39.72
        });
        console.log(`   ✔ Sevkiyat Başlatıldı & Telemetri Mühürlendi: [${ship.trackingCode}]`);
    }

    // 3. Zero-Knowledge Proof Commitments
    console.log("\n3. Sıfır Bilgi İspatları (ZK-Proof) Kök & Aralık Taahhütleri:");
    const zkLeaves = ['Student_Cert_01', 'Student_Cert_02', 'Telemetry_Pass_03', 'Jury_Proof_04'];
    const zkTree = new SimpleMerkleTree(zkLeaves);
    await sdk.commitZKRoot(zkTree.getRoot());
    const pedersenC = generatePedersenCommitment(21, 'blinding_secret_99');
    console.log(`   ✔ ZK Ağaç Kökü Ağa Taahhüt Edildi: ${zkTree.getRoot().slice(0, 24)}...`);
    console.log(`   ✔ Pedersen Sıcaklık Taahhüdü:      ${pedersenC.slice(0, 24)}...`);

    // 4. Jury Scoring Protocol
    console.log("\n4. TEKNOFEST Hakem Heyeti Puanlama & Commit-Reveal Simülasyonu:");
    const t1 = await sdk.registerTeam('Cezeri Blokzincir Takımı', 'Havacılık Güvenli Telemetri Ağı');
    const rubric1 = { architecture: 2500, security: 2400, innovation: 2450, implementation: 1450, presentation: 990 };
    await sdk.commitJuryScore(t1.id, rubric1, '0xsaltSecret', '0xJuryChief');
    await sdk.revealJuryScore(t1.id, rubric1, '0xsaltSecret', '0xJuryChief');
    await sdk.finalizeTeamEvaluation(t1.id);
    await sdk.certifyTeam(t1.id, 'Altın Madalya / Türkiye Birincisi');
    console.log(`   ✔ Takım Puanlandı ve Mühürlendi: ${t1.teamName} -> Puan: ${t1.finalScore / 100} / 100.00 (${t1.rank})`);

    // 5. Cross-Chain Bridge
    console.log("\n5. Çapraz Zincir Durum Köprüsü (Cross-Chain Bridge Anchor):");
    const bridgeMsg = await sdk.dispatchBridgeMessage(137, '0xPolygonFinalistAnchor', 'Cezeri_GoldMedal_Certification');
    console.log(`   ✔ Köprü Mesajı Sevk Edildi: Nonce #${bridgeMsg.nonce} -> Hedef: Polygon (#137)`);

    console.log("\n✨ Demo verileri tüm sözleşmelere eksiksiz başarıyla yüklendi!");
}

if (require.main === module) {
    seed().catch(console.error);
}

module.exports = seed;
