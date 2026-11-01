# 🌐 Block-Architect-TR | Web3 Frontend Konsolu

<p align="center">
  <img src="../docs/assets/dashboard_preview.jpg" alt="Web3 Console Preview" width="100%" style="border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
</p>

Bu dizin, **TEKNOFEST Blokzinciri** referans mimarisi için geliştirilmiş 12 sekmeli, tam teşekküllü interaktif Web3 yönetim ve denetleme arayüzünü içerir.

---

## 🚀 Öne Çıkan 12 Sekmeli Modüler Yetenekler

1. **Çift Modlu Çalışma (Zero-Friction Sandbox + MetaMask)**:
   - Tarayıcıda doğrudan `index.html` dosyasını açarak veya bir yerel sunucuyla anında test edilebilir.
   - MetaMask takılı olmasa bile tüm 11 akıllı sözleşme akışı dahili simülatör üzerinden eksiksiz çalışır.
   - MetaMask bağlı olduğunda gerçek Web3 sağlayıcısı ile etkileşime girer.

2. **Merkeziyetsiz Kimlik (DID / SSI) Yönetimi**:
   - W3C v1.0 DID standartlarına uygun kimlik kaydı (`did:teknofest:2025:...`).
   - Takım, öğrenci, doğrulayıcı düğüm ve IoT cihazları için dijital kimlik üretimi.

3. **Akıllı Tedarik Zinciri ve Soğuk Zincir IoT Telemetrisi**:
   - Görev kritik aviyonik parçaların uçtan uca sevkiyat takibi.
   - Sıcaklık, nem ve GPS koordinatlarının kriptografik telemetri mühürleri.

4. **Sıfır Bilgi İspatı (ZK-Proof) Stüdyosu**:
   - Gizli iddiaların Merkle üyelik doğrulaması ve tek kullanımlık Nullifier takibi.
   - Hassas sensör telemetrileri için Pedersen aralık kanıtı simülatörü.

5. **Hakem Heyeti (Jury) Puanlama & Liderlik Tablosu**:
   - İki aşamalı **Commit-Reveal** şeması ile manipülasyonsuz jüri notu verme.
   - Ağırlıklı rubrik puanları (Mimari, Güvenlik, İnovasyon, Uygulama, Sunum) ve dinamik liderlik tablosu.

6. **Soulbound Başarı Rozetleri & Madalyaları (EIP-5192 NFT)**:
   - Şampiyon, ikinci, üçüncü takımlara devredilemez (soulbound) resmi başarı madalyası basımı.
   - Akıllı sözleşme düzeyinde kilitli kalıcı sertifikasyon vitrini.

7. **Dağıtık IoT Aviyonik Telemetri Oracle Hub**:
   - Trabzon, Samsun, Ankara ve İstanbul istasyonlarından gelen sensör verilerini toplama.
   - Bizans Hata Toleranslı Medyan algoritmasıyla aykırı değerleri otomatik eleme ve konsensüs telemetrisi üretme.

8. **Çapraz Zincir Durum Köprüsü (Cross-Chain Bridge)**:
   - Yerel alt ağdan Polygon, Ethereum ve Avalanche ağlarına durum sevk simülasyonu ve relayer çoklu imza denetimi.

9. **Güvenlik ve Penetrasyon Laboratuvarı**:
   - Tek tıkla canlı Reentrancy saldırı simülasyonu (`contracts/security/ReentrancyAttacker.sol`).
   - Sıfır bilgi çift harcama (nullifier replay) testi.
   - Yetkisiz admin erişimi (access control breach) test harness ve A+ güvenlik karnesi.

10. **DAO Yönetişim ve Oylama Protokolü**:
    - Topluluk teklifleri oluşturma, Evet/Hayır oylamaları, kuorum ve timelock izleme.

11. **TKF Tokenomics, Staking ve Faucet**:
    - Yıllık %12 APY getiri oranlı validator staking simülatörü.
    - Hakem heyeti ve değerlendiriciler için tek tıkla testnet token talep musluğu.

12. **Çekirdek İşlem ve Canlı Terminal Konsolu**:
    - Ham blokzincir işlemlerini SHA-256/Keccak-256 ile anlık mühürleme ve canlı operasyon terminali akışı.

---

## 💻 Nasıl Çalıştırılır?

### Yöntem 1: Doğrudan Tarayıcıda Açma
`frontend/index.html` dosyasına çift tıklayarak Chrome, Edge, Brave veya Firefox üzerinde doğrudan açabilirsiniz.

### Yöntem 2: Node.js ile Canlı Sunucu
```bash
npm run serve:frontend
```
veya:
```bash
npx serve frontend
```

### Yöntem 3: Python Hızlı Sunucu
```bash
python -m http.server 8080 --directory frontend
```
Tarayıcınızdan `http://localhost:8080` adresine gidin.
