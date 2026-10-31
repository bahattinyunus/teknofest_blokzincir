# 📚 Block-Architect-TR: API & SDK Başvuru Kılavuzu

Bu doküman, **BlockArchitectSDK** kütüphanesini ve dahili REST API sunucusunu kullanarak 8 akıllı sözleşmeli kurumsal ekosisteme nasıl entegre olunacağını açıklar.

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

#### `dispatchBridgeMessage(destinationChainId, targetContract, payload)`
Dış EVM blokzincirlerine (Polygon, Ethereum, Avalanche) durum aktarımı yapar.
```javascript
const msg = await sdk.dispatchBridgeMessage(137, '0xTargetContract', 'StatePayload');
console.log('Dispatched Nonce:', msg.nonce);
```

---

## 2. REST API Uç Noktaları

REST API sunucusu `node src/api/server.js` veya `npm start` komutuyla 3000 numaralı portta çalışır.

| Metot | Uç Nokta | Açıklama |
|---|---|---|
| `GET` | `/api/v1/health` | Sistem sağlık ve mimari protokol durumunu döndürür |
| `GET` | `/api/v1/metrics` | İşlem sayısı, aktif DID, ZK ve kargo istatistiklerini iletir |
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
| `POST` | `/api/v1/bridge/dispatch` | Çapraz zincir köprüsüne mesaj sevk eder |

### Örnek İstek (cURL):
```bash
curl -X POST http://localhost:3000/api/v1/operations \
  -H "Content-Type: application/json" \
  -d '{"payload": "TEKNOFEST 2025 Canli Telemetri Paketi", "tag": "TELEMETRY"}'
```
