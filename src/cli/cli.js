#!/usr/bin/env node
/**
 * @file cli.js
 * @author Bahattin Yunus Çetin (IT Architect)
 * @notice Enterprise Command Line Interface for TEKNOFEST Block-Architect Blockchain Protocol.
 */

const BlockArchitectSDK = require('../sdk/BlockArchitectSDK');
const {
    keccak256,
    formatDID,
    SimpleMerkleTree,
    generatePedersenCommitment,
    generateNullifier
} = require('../utils/crypto');

const sdk = new BlockArchitectSDK();
const args = process.argv.slice(2);
const command = args[0] ? args[0].toLowerCase() : 'help';

async function run() {
    console.log(`\n===============================================================`);
    console.log(`  🇹🇷  BLOCK-ARCHITECT-TR: TEKNOFEST BLOKZİNCİRİ YÖNETİMİ  🇹🇷`);
    console.log(`  Mimar: Bahattin Yunus Çetin | Sürüm: 2.5.0 Enterprise Final`);
    console.log(`===============================================================\n`);

    switch (command) {
        case 'status': {
            console.log('--- SİSTEM METRİKLERİ VE SAĞLIK DURUMU ---');
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

        case 'zk': {
            console.log('🔒 SIFIR BİLGİ İSPATI (ZK-PROOF) İŞLEMİ...');
            const tree = new SimpleMerkleTree(['Leaf_A', 'Leaf_B', 'Leaf_C', 'Leaf_D']);
            const root = tree.getRoot();
            await sdk.commitZKRoot(root);

            const proofObj = tree.getProof(1);
            const verified = await sdk.verifyZKMembership(root, proofObj.leaf, proofObj.proof, proofObj.isLeft);
            const nullifier = generateNullifier('SecretKey_123', 'TEKNOFEST_SCOPE');

            console.log(`✅ ZK Merkle Kökü: ${root}`);
            console.log(`✅ Gizli Yaprak İspat Sonucu: ${verified ? 'GEÇERLİ (Doğrulandı)' : 'GEÇERSİZ'}`);
            console.log(`✅ Üretilen Nullifier: ${nullifier}`);
            break;
        }

        case 'jury': {
            console.log('⚖️ JÜRİ PUANLAMA & COMMIT-REVEAL PROTOKOLÜ...');
            const team = await sdk.registerTeam('KTÜ Cezeri Mimarlık', 'Otonom Blokzincir Güvenlik Ağı');
            console.log(`   Takım Kaydedildi: #${team.id} ${team.teamName}`);

            const rubric = { architecture: 2450, security: 2400, innovation: 2480, implementation: 1450, presentation: 980 };
            const salt = '0x' + Buffer.from('GizliHakemTuzu2025').toString('hex');
            const jury = '0xJuryTrabzon01';

            console.log('   [1] Commit Aşaması: Puan özeti şifrelenerek ağa taahhüt ediliyor...');
            const commit = await sdk.commitJuryScore(team.id, rubric, salt, jury);
            console.log(`       Commitment Hash: ${commit.commitHash}`);

            console.log('   [2] Reveal Aşaması: Şifre ve tuz çözülerek hakem notu açığa çıkarılıyor...');
            const reveal = await sdk.revealJuryScore(team.id, rubric, salt, jury);
            console.log(`       Doğrulanan Puan: ${reveal.totalScore / 100} / 100.00`);

            const fin = await sdk.finalizeTeamEvaluation(team.id);
            await sdk.certifyTeam(team.id, 'TEKNOFEST 2025 Şampiyonu');
            console.log(`🏆 Değerlendirme Tamamlandı! Nihai Puan: ${fin.finalScore / 100} - Derece: ${team.rank}`);
            break;
        }

        case 'bridge': {
            const dest = parseInt(args[1]) || 137; // Polygon
            console.log(`🌉 ÇAPRAZ ZİNCİR KÖPRÜSÜ (Subnet -> Chain #${dest})...`);
            const msg = await sdk.dispatchBridgeMessage(dest, '0xPolygonTargetContract', 'StateUpdatePayload_Avionics');
            console.log(`✅ Köprü Mesajı Başarıyla Sevk Edildi!`);
            console.log(`   Nonce:        #${msg.nonce}`);
            console.log(`   Hedef Ağ ID:  ${msg.destinationChainId}`);
            console.log(`   Yük Özeti:    ${msg.payloadHash}`);
            break;
        }

        case 'demo': {
            console.log('🚀 KAPSAMLI MASTERPIECE DEMO SENARYOSU BAŞLATILIYOR (8 SÖZLEŞME ENTEGRELİ)...\n');

            console.log('1. [DID / SSI] TEKNOFEST Takımı İçin Merkeziyetsiz Kimlik Oluşturuluyor...');
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

            console.log('\n4. [Zero-Knowledge Proofs] Anonim Kimlik ve Telemetri Aralık İspatı Hesaplanıyor...');
            const zkTree = new SimpleMerkleTree(['Leaf_1', 'Leaf_2', 'Leaf_3', 'Leaf_4']);
            await sdk.commitZKRoot(zkTree.getRoot());
            const zkProof = zkTree.getProof(0);
            const isZKValid = await sdk.verifyZKMembership(zkTree.getRoot(), zkProof.leaf, zkProof.proof, zkProof.isLeft);
            const pedersenCommit = generatePedersenCommitment(20, 'salt_99');
            const isRangeValid = await sdk.verifyRangeProof(pedersenCommit, 20, 'salt_99', 15, 25);
            console.log(`   -> ZK Üyelik İspatı: ${isZKValid ? 'GEÇERLİ' : 'GEÇERSİZ'}`);
            console.log(`   -> Sensör Sıcaklık Aralık Uyumu (15°C - 25°C): ${isRangeValid ? 'UYUMLU' : 'İHLAL'}`);

            console.log('\n5. [Jüri Puanlama] Commit-Reveal Protokolü ile Şeffaf Hakem Puanlaması...');
            const t1 = await sdk.registerTeam('Cezeri Otonom Takımı', 'Havacılık Blokzincir Veri Köprüsü');
            const rubric1 = { architecture: 2500, security: 2450, innovation: 2500, implementation: 1480, presentation: 990 };
            const salt1 = '0xsalt1234';
            await sdk.commitJuryScore(t1.id, rubric1, salt1, '0xJuryLead');
            await sdk.revealJuryScore(t1.id, rubric1, salt1, '0xJuryLead');
            await sdk.finalizeTeamEvaluation(t1.id);
            await sdk.certifyTeam(t1.id, 'Türkiye Birincisi (Şampiyon)');
            console.log(`   -> Takım: ${t1.teamName} | Puan: ${t1.finalScore / 100} / 100.00 | Ödül: ${t1.rank}`);

            console.log('\n6. [Çapraz Zincir Köprüsü] TEKNOFEST Subnet -> Polygon Köprüsü Üzerinden Durum Aktarımı...');
            const bridgeMsg = await sdk.dispatchBridgeMessage(137, '0xPolygonFinalistRegistry', 'CertifiedTeam_Cezeri');
            console.log(`   -> Köprü Sevk Nonce: #${bridgeMsg.nonce} Hedef Zincir: Polygon (#137)`);

            console.log('\n7. [Toplu İşlemler] 10 Adet Sensör Verisi Merkle Ağacı ile Mühürleniyor...');
            const batch = await sdk.submitBatch([
                'Sensor_Packet_1', 'Sensor_Packet_2', 'Sensor_Packet_3', 'Sensor_Packet_4'
            ]);
            console.log(`   -> Merkle Kökü: ${batch.merkleRoot}`);

            console.log('\n✨ KAPSAMLI DEMO BAŞARIYLA TAMAMLANDI! 8 Akıllı sözleşme ve SDK tam uyum içinde çalışıyor.\n');
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
            console.log(`  zk                        Sıfır Bilgi İspatı (ZK) doğrulaması çalıştırır`);
            console.log(`  jury                      Jüri Commit-Reveal oylama senaryosu yürütür`);
            console.log(`  bridge [hedefChainId]     Çapraz zincir köprüsüne mesaj sevk eder`);
            console.log(`  demo                      Uçtan uca tüm sistemin canlı simülasyonunu çalıştırır`);
            break;
        }
    }
}

run().catch(console.error);
