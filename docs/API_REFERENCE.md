# 📚 Block-Architect-TR: API & SDK Başvuru Kılavuzu

Bu doküman, **BlockArchitectSDK** kütüphanesini ve dahili REST API sunucusunu kullanarak sisteme nasıl entegre olunacağını açıklar.

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

---

## 2. REST API Uç Noktaları

REST API sunucusu `node src/api/server.js` veya `npm start` komutuyla 3000 numaralı portta çalışır.

| Metot | Uç Nokta | Açıklama |
|---|---|---|
| `GET` | `/api/v1/health` | Sistem sağlık ve mimari protokol durumunu döndürür |
| `GET` | `/api/v1/metrics` | İşlem sayısı, aktif DID ve kargo istatistiklerini iletir |
| `POST` | `/api/v1/operations` | Blokzincire yeni bir işlem mühürler |
| `POST` | `/api/v1/operations/batch` | Toplu verileri Merkle köküyle işler |
| `POST` | `/api/v1/did/register` | Yeni bir DID kimliği üretir |
| `POST` | `/api/v1/did/credential` | Belirtilen DID için doğrulanabilir kimlik belgesi düzenler |
| `POST` | `/api/v1/shipments` | Tedarik zinciri sevkiyatı başlatır |

### Örnek İstek (cURL):
```bash
curl -X POST http://localhost:3000/api/v1/operations \
  -H "Content-Type: application/json" \
  -d '{"payload": "TEKNOFEST 2025 Canli Telemetri Paketi", "tag": "TELEMETRY"}'
```
