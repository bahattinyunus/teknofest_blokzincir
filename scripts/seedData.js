/**
 * @file seedData.js
 * @author Bahattin Yunus Çetin (IT Architect)
 * @notice Test and demonstration dataset generator for TEKNOFEST Blokzinciri.
 */

const BlockArchitectSDK = require('../src/sdk/BlockArchitectSDK');

async function seed() {
    console.log("🌱 TEKNOFEST Blokzincirine Demo Verileri Yükleniyor...");
    const sdk = new BlockArchitectSDK();

    // 1. Teams & Students DIDs
    const teams = [
        { cat: 'team', id: 'arch-trabzon-alpha', name: 'Alpha Mimarlık Takımı', uni: 'KTÜ' },
        { cat: 'team', id: 'baykar-cezeri-01', name: 'Cezeri Yapay Zeka Takımı', uni: 'İTÜ' },
        { cat: 'student', id: 'bahattinyunus', name: 'Bahattin Yunus Çetin', role: 'IT Architect' }
    ];

    for (const t of teams) {
        const id = await sdk.registerDID(t.cat, t.id, t);
        console.log(`   ✔ DID Mühürlendi: ${id.didUri}`);
    }

    // 2. Cargo Shipments
    const shipments = [
        { code: 'TKF-IHA-2025-01', desc: 'Aviyonik Uçuş Kontrol Bilgisayarı v4.1', origin: 'Trabzon/Of Lojistik Hub' },
        { code: 'TKF-ROBO-2025-09', desc: 'LiDAR Mesafe Sensörü ve Titreşim Damper Kiti', origin: 'İstanbul Teknopark' }
    ];

    for (const s of shipments) {
        const ship = await sdk.createShipment(s.code, s.desc, '0xRecipientAddress001', s.origin);
        console.log(`   ✔ Sevkiyat Başlatıldı: [${ship.trackingCode}] -> ${s.origin}`);
    }

    console.log("\n✨ Demo verileri başarıyla hazırlandı!");
}

if (require.main === module) {
    seed().catch(console.error);
}

module.exports = seed;
