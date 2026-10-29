# 🌐 Block-Architect-TR | Web3 Frontend Konsolu

<p align="center">
  <img src="../docs/assets/dashboard_preview.jpg" alt="Web3 Console Preview" width="100%" style="border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
</p>

Bu dizin, **TEKNOFEST Blokzinciri** referans mimarisi için geliştirilmiş interaktif Web3 yönetim ve denetleme arayüzünü içerir.

---

## 🚀 Öne Çıkan Özellikler

1. **Çift Modlu Çalışma (Zero-Friction Sandbox + MetaMask)**:
   - Tarayıcıda doğrudan `index.html` dosyasını açarak veya bir yerel sunucuyla anında test edilebilir.
   - MetaMask takılı olmasa bile tüm akıllı sözleşme akışları (DID, Tedarik Zinciri, DAO, Staking, Musluk) simülatör üzerinden eksiksiz çalışır.
   - MetaMask bağlı olduğunda gerçek Web3 sağlayıcısı ile etkileşime girer.

2. **Merkeziyetsiz Kimlik (DID / SSI) Yönetimi**:
   - W3C v1.0 DID standartlarına uygun kimlik kaydı (`did:teknofest:2025:...`).
   - Takım, öğrenci, doğrulayıcı düğüm ve IoT cihazları için dijital kimlik üretimi.

3. **Akıllı Tedarik Zinciri ve Soğuk Zincir IoT Telemetrisi**:
   - Görev kritik aviyonik parçaların uçtan uca sevkiyat takibi.
   - Sıcaklık, nem ve GPS koordinatlarının kriptografik telemetri mühürleri.

4. **DAO Yönetişim ve Oylama Protokolü**:
   - Topluluk teklifleri oluşturma, Evet/Hayır oylamaları, kuorum ve timelock izleme.

5. **TKF Tokenomics, Staking ve Faucet**:
   - Yıllık %12 APY getiri oranlı validator staking simülatörü.
   - Hakem heyeti ve değerlendiriciler için tek tıkla testnet token talep musluğu.

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
