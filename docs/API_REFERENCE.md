# 📚 Block-Architect-TR: API & SDK Başvuru Kılavuzu

Bu doküman, **BlockArchitectSDK** kütüphanesini ve dahili REST API sunucusunu kullanarak 11 akıllı sözleşmeli kurumsal ekosisteme nasıl entegre olunacağını açıklar.

---

## 1. JavaScript / Node.js SDK

### Kurulum ve Başlatma
```javascript
const BlockArchitectSDK = require('./src/sdk/BlockArchitectSDK');

const sdk = new BlockArchitectSDK({
    rpcUrl: 'http://127.0.0.1:8545'
});
```

### Temel Metotlar

#### `submitOperation(rawData, tag)`
Bir veriyi veya JSON yükünü Keccak-256 ile özetleyip blokzincire kaydeder.
```javascript
const res = await sdk.submitOperation('Avionics Test Data', 'LOGISTICS');
console.log(res.opId, res.dataHash);
```

#### `submitBatch(dataArray, tag)`
Birden fazla işlemi Merkle ağacı kökü altında tek bir toplu işlemle mühürler.
```javascript
const batch = await sdk.submitBatch(['P1', 'P2', 'P3'], 'IOT_BATCH');
console.log('Merkle Root:', batch.merkleRoot);
```

#### `registerDID(category, identifier, didDocument)`
Yeni bir W3C uyumlu Merkeziyetsiz Kimlik (DID) kaydeder.
```javascript
const id = await sdk.registerDID('team', 'arch-trabzon-01', {
    university: 'Karadeniz Teknik Üniversitesi'
});
console.log(id.didUri); // "did:teknofest:2025:team:arch-trabzon-01"
```

#### `createShipment(trackingCode, manifestData, recipientAddress, initialLocation)`
Akıllı tedarik zinciri için yeni bir kargo sevkiyatı başlatır.
```javascript
const shipment = await sdk.createShipment(
    'TKF-LOG-01',
    'Otonom Uçuş Kartı',
    '0xRecipient...',
    'Trabzon/Of Lojistik Terminali'
);
```

#### `verifyZKMembership(root, leaf, proof, isLeft)`
Sıfır bilgi ispatı Merkle ağacı dahil olma kanıtını doğrular.
```javascript
const isValid = await sdk.verifyZKMembership(root, leaf, proof, isLeft);
```

#### `commitJuryScore(teamId, rubric, salt, juryAddress)` & `revealJuryScore(...)`
Jüri üyelerinin anti-collusion şifreli puanlama sürecini yürütür.
```javascript
const rubric = { architecture: 2500, security: 2400, innovation: 2450, implementation: 1450, presentation: 950 };
await sdk.commitJuryScore(teamId, rubric, salt, juryAddress);
await sdk.revealJuryScore(teamId, rubric, salt, juryAddress);
```

#### `mintNFTBadge(recipient, teamName, tier, isSoulbound)`
Takımlar için EIP-5192 Soulbound başarı madalyası basar.
```javascript
const nft = await sdk.mintNFTBadge('0xStudentKTU', 'Cezeri Takımı', 'Gold', true);
console.log('Minted Token ID:', nft.tokenId);
```

#### `submitTelemetryFeed(feedId, nodeAddress, temperature, altitude)` & `getConsensusTelemetry(feedId)`
Dağıtık IoT istasyonlarından telemetri toplar ve medyan konsensüsünü döner.
```javascript
await sdk.submitTelemetryFeed('TKF-IHA-01', '0xNodeTrabzon', 21.4, 1250);
const consensus = await sdk.getConsensusTelemetry('TKF-IHA-01');
console.log('Consensus Temp:', consensus.temperature);
```

#### `sponsorGaslessTransaction(beneficiary, targetContract, callData)`
ERC-4337 öğrenci paymaster sponsorluğu ile gazsız işlem icra eder.
```javascript
const tx = await sdk.sponsorGaslessTransaction('0xStudentTeam', '0xTargetCore', '0xCallData');
console.log('Sponsored Tx Hash:', tx.txHash);
```

#### `runSecurityAudit()`
Tüm akıllı sözleşmeler ve penetrasyon harness üzerinde güvenlik denetimi çalıştırır.
```javascript
const auditReport = await sdk.runSecurityAudit();
console.log('Security Grade:', auditReport.overallGrade);
```

---

## 2. REST API Uç Noktaları

REST API sunucusu `node src/api/server.js` veya `npm start` komutuyla 3000 numaralı portta çalışır.

| Metot | Uç Nokta | Açıklama |
|---|---|---|
| `GET` | `/api/v1/health` | Sistem sağlık ve mimari protokol durumunu döndürür |
| `GET` | `/api/v1/metrics` | İşlem sayısı, aktif DID, ZK, NFT ve kargo istatistiklerini iletir |
| `POST` | `/api/v1/operations` | Blokzincire yeni bir işlem mühürler |
| `POST` | `/api/v1/operations/batch` | Toplu verileri Merkle köküyle işler |
| `POST` | `/api/v1/did/register` | Yeni bir W3C DID kimliği üretir |
| `POST` | `/api/v1/did/credential` | Belirtilen DID için doğrulanabilir kimlik belgesi düzenler |
| `POST` | `/api/v1/shipments` | Tedarik zinciri sevkiyatı başlatır |
| `POST` | `/api/v1/zk/commit-root` | ZK doğrulama ağacı kökünü ağa taahhüt eder |
| `POST` | `/api/v1/zk/verify` | ZK Merkle üyelik ispatını doğrular |
| `POST` | `/api/v1/jury/teams` | Yarışmacı finalist takımı sisteme kaydeder |
| `GET` | `/api/v1/jury/leaderboard` | Hakem heyeti konsensüs liderlik tablosunu döndürür |
| `POST` | `/api/v1/jury/commit` | Şifreli jüri taahhüdünü ağa yazar |
| `POST` | `/api/v1/jury/reveal` | Jüri puanını açığa çıkarıp konsensüse katar |
| `POST` | `/api/v1/nft/mint` | EIP-5192 Soulbound başarı rozeti basar |
| `GET` | `/api/v1/nft/badges` | Basılan tüm başarı madalyalarını listeler |
| `POST` | `/api/v1/oracle/telemetry` | Dağıtık sensör telemetri verisi iletir |
| `GET` | `/api/v1/oracle/consensus` | Medyan ve aykırı değer filtrelenmiş konsensüs verisi döner |
| `POST` | `/api/v1/paymaster/sponsor` | ERC-4337 sıfır gazlı sponsorlu işlem yürütür |
| `GET` | `/api/v1/security/audit` | Otomatik penetrasyon ve güvenlik raporunu döndürür |
| `POST` | `/api/v1/bridge/dispatch` | Çapraz zincir köprüsüne mesaj sevk eder |
