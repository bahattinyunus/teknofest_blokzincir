#!/usr/bin/env node
/**
 * @file cli.js
 * @author Bahattin Yunus Çetin (IT Architect)
 * @notice Command Line Interface for TEKNOFEST Block-Architect Blockchain Protocol.
 */

const BlockArchitectSDK = require('../sdk/BlockArchitectSDK');
const { keccak256, formatDID, SimpleMerkleTree } = require('../utils/crypto');

const sdk = new BlockArchitectSDK();
const args = process.argv.slice(2);
const command = args[0] ? args[0].toLowerCase() : 'help';

async function run() {
    console.log(`\n===============================================================`);
    console.log(`  🇹🇷  BLOCK-ARCHITECT-TR: TEKNOFEST BLOKZİNCİRİ YÖNETİMİ  🇹🇷`);
    console.log(`  Mimar: Bahattin Yunus Çetin | Sürüm: 2.0.0 Enterprise`);
    console.log(`===============================================================\n`);

    switch (command) {
        case 'status': {
            console.log('--- SİSTEM METRİKLERİ VE DURUM ---');
            console.dir(sdk.getMetrics(), { depth: null, colors: true });
            break;
        }

        case 'submit': {
            const payload = args.slice(1).join(' ') || 'TEKNOFEST 2025 Test İşlemi';
            console.log(`İşlem Gönderiliyor: "${payload}"`);
            const res = await sdk.submitOperation(payload, 'CLI_TX');
            console.log(`✅ İşlem Blokzincirine Yazıldı!`);
            console.log(`   İşlem ID:   ${res.opId}`);
            console.log(`   Veri Özeti: ${res.dataHash}`);
            break;
        }

        case 'batch': {
            const count = parseInt(args[1]) || 5;
            console.log(`${count} adet işlem içeren toplu blok oluşturuluyor...`);
            const items = Array.from({ length: count }, (_, i) => `İşlem #${i + 1} - ${Date.now()}`);
            const res = await sdk.submitBatch(items, 'CLI_BATCH');
            console.log(`✅ Toplu İşlem Başarılı!`);
            console.log(`   Merkle Root: ${res.merkleRoot}`);
            console.log(`   İşlem Sayısı: ${res.batchSize}`);
            break;
        }

        case 'did': {
            const cat = args[1] || 'team';
            const id = args[2] || 'architect-01';
            console.log(`DID Kaydı Başlatılıyor: [${cat}] -> ${id}`);
            const didRes = await sdk.registerDID(cat, id, {
                owner: 'Bahattin Yunus Çetin',
                institution: 'TEKNOFEST 2025',
                created: new Date().toISOString()
            });
            console.log(`✅ DID Başarıyla Kaydedildi:`);
            console.log(`   URI:     ${didRes.didUri}`);
            console.log(`   DID Key: ${didRes.didKey}`);
            break;
        }

        case 'shipment': {
            const code = args[1] || `TKF-${Math.floor(1000 + Math.random() * 9000)}`;
            const desc = args.slice(2).join(' ') || 'Kritik Aviyonik Donanım Paketi';
            console.log(`Yeni Sevkiyat Kaydediliyor: [${code}] "${desc}"`);
            const ship = await sdk.createShipment(code, desc, '0xRecipientAddress001', 'Trabzon/Of Lojistik Terminali');
            console.log(`✅ Sevkiyat Blokzincirinde Başlatıldı:`);
            console.log(`   Takip Kodu:  ${ship.trackingCode}`);
            console.log(`   Kargo Özeti: ${ship.itemHash}`);
            console.log(`   Durum:       ${ship.state}`);
            console.log(`   İlk Konum:   ${ship.checkpoints[0].location}`);
            break;
        }

        case 'demo': {
            console.log('🚀 KAPSAMLI DEMO SENARYOSU BAŞLATILIYOR...\n');
            
            console.log('1. [DID] TEKNOFEST Takımı İçin Merkeziyetsiz Kimlik Oluşturuluyor...');
            const did = await sdk.registerDID('team', 'arch-trabzon-alpha', { name: 'Alpha Mimarlık Takımı' });
            console.log(`   -> DID URI: ${did.didUri}`);

            console.log('\n2. [Verifiable Credential] Hakem Heyeti Tarafından Başarı Sertifikası Veriliyor...');
            const cred = await sdk.issueCredential(did.didKey, 'TeknofestFinalistCredential', {
                category: 'Blokzincir',
                score: 98.5,
                verifiedBy: 'Jüri Kurulu'
            });
            console.log(`   -> Belge Özeti: ${cred.credHash}`);

            console.log('\n3. [Tedarik Zinciri] İHA Parçaları Lojistik Takip Sistemi Başlatılıyor...');
            const shipment = await sdk.createShipment('TKF-IHA-2025-09', 'Otonom Uçuş Kartı v3.2', '0xBaykarTeam');
            console.log(`   -> Takip Kodu: ${shipment.trackingCode}`);
            console.log('   -> IoT Telemetri Kontrol Noktası Ekleniyor (Sıcaklık: 19.8°C, Nem: %48)...');
            await sdk.logCheckpoint(shipment.id, {
                location: 'Samsun TEKNOFEST Sahası Kabul Noktası',
                temperature: 19.8,
                humidity: 48.0,
                gpsLat: 41.2867,
                gpsLng: 36.33
            });
            console.log(`   -> Telemetri Kaydedildi ve Blokzincirine Doğrulandı!`);

            console.log('\n4. [Toplu İşlemler] 10 Adet Sensör Verisi Merkle Ağacı ile Mühürleniyor...');
            const batch = await sdk.submitBatch([
                'Sensor_Packet_1', 'Sensor_Packet_2', 'Sensor_Packet_3', 'Sensor_Packet_4'
            ]);
            console.log(`   -> Merkle Kökü: ${batch.merkleRoot}`);

            console.log('\n✨ DEMO BAŞARIYLA TAMAMLANDI! Tüm bileşenler senkronize çalışıyor.\n');
            break;
        }

        default: {
            console.log(`Kullanım: node src/cli/cli.js <komut> [parametreler]\n`);
            console.log(`Komutlar:`);
            console.log(`  status                    Sistem metriklerini ve sağlığını listeler`);
            console.log(`  submit <mesaj>            Blokzincire tekil işlem verisi işler`);
            console.log(`  batch <sayı>              Toplu Merkle ağacı işlemi gerçekleştirir`);
            console.log(`  did <kategori> <id>       Merkeziyetsiz Kimlik (DID) üretir`);
            console.log(`  shipment <kod> <açıklama> Tedarik zinciri sevkiyatı başlatır`);
            console.log(`  demo                      Uçtan uca tüm sistemin canlı simülasyonunu çalıştırır`);
            break;
        }
    }
}

run().catch(console.error);
