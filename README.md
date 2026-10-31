# 🔗 Block-Architect-TR: TEKNOFEST Kurumsal Blokzinciri Referans Mimarisi

<p align="center">
  <img src="https://img.shields.io/badge/TEKNOFEST-2025%20%7C%202026-blue?style=for-the-badge&logo=rocket&logoColor=white" alt="TEKNOFEST">
  <img src="https://img.shields.io/badge/Kategori-Blokzinciri-orange?style=for-the-badge&logo=ethereum&logoColor=white" alt="Category">
  <img src="https://img.shields.io/badge/Solidity-0.8.20-363636?style=for-the-badge&logo=solidity&logoColor=white" alt="Solidity">
  <img src="https://img.shields.io/badge/S%C3%B6zle%C5%9Fmeler-8'li%20Kurumsal%20S%C3%BCit-indigo?style=for-the-badge&logo=contract&logoColor=white" alt="Contracts">
  <img src="https://img.shields.io/badge/Tests-22%2F22%20Passing-success?style=for-the-badge&logo=checkmarx&logoColor=white" alt="Tests">
  <img src="https://img.shields.io/badge/Mimar-Bahattin%20Yunus%20%C3%87etin-darkblue?style=for-the-badge&logo=linkedin&logoColor=white" alt="Architect">
</p>

<p align="center">
  <img src="docs/assets/banner.jpg" alt="Block-Architect-TR Hero Banner" width="100%" style="border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
</p>

---

## 📌 Proje Vizyonu ve Genel Bakış
**Block-Architect-TR**, TEKNOFEST Blokzinciri Yarışması standartlarında tasarlanmış; **Sıfır Güven (Zero Trust Architecture)** prensipleri üzerine inşa edilen kurumsal düzeyde bir blokzinciri, merkeziyetsiz kimlik (DID/SSI), sıfır bilgi ispatı (ZK-Proof), anti-collusion hakem heyeti konsensüsü, L2 durum köprüsü ve akıllı tedarik zinciri referans platformudur.

Türkiye'nin **Milli Teknoloji Hamlesi** hedefleri doğrultusunda geliştirilen bu mimari; yüksek ölçeklenebilirlik, gizlilik korumalı doğrulama, manipülasyonsuz jüri puanlaması, bağımsız denetlenebilirlik ve görev kritik IoT telemetri mühürleme yeteneklerini bir araya getirir.

---

## 🏛️ 8'li Akıllı Sözleşme Mimarisi ve Ekosistem

```mermaid
flowchart TD
    subgraph Core["Çekirdek Güvenlik & Konsensüs Katmanı"]
        A["BlockArchitectCore.sol<br/>(RBAC & Devre Kesici)"]
        E["TeknofestToken.sol ($TKF)<br/>(Staking, Faucet & Ceza Yakımı)"]
        D["GovernanceDAO.sol<br/>(Topluluk Oylaması & Timelock)"]
    end

    subgraph Business["Uygulama & Doğrulama Katmanı"]
        B["IdentityRegistry.sol<br/>(W3C DID & Verifiable Credentials)"]
        C["SupplyChainTracker.sol<br/>(IoT Telemetri & Soğuk Zincir)"]
        F["ZKProofVerifier.sol<br/>(Sıfır Bilgi İspatı & Nullifier)"]
        G["JuryScoringProtocol.sol<br/>(Commit-Reveal Hakem Puanlama)"]
        H["CrossChainBridgeAnchor.sol<br/>(L2 / Polygon / EVM Durum Köprüsü)"]
    end

    A --> B
    A --> C
    A --> F
    A --> G
    A --> H
    E --> D
```

### 1. Çekirdek Güvenlik Protokolü (`BlockArchitectCore.sol`)
* **Rol Tabanlı Erişim Kontrolü (RBAC):** `DEFAULT_ADMIN_ROLE`, `OPERATOR_ROLE` ve `AUDITOR_ROLE` ile yetki ayrımı.
* **Acil Durum Devre Kesicisi (Circuit Breaker):** Beklenmedik acil durumlarda `emergencyPause()` ile sistemi dondurma ve güvenle yeniden başlatma.
* **Toplu İşlem Verimliliği:** Merkle ağacı kökleri ile gas optimizasyonlu toplu işlem mühürleme.

### 2. Merkeziyetsiz Kimlik - Self-Sovereign Identity (`IdentityRegistry.sol`)
* **W3C DID v1.0 Standardı:** `did:teknofest:2025:[kategori]:[id]` formatında takım, öğrenci, cihaz ve düğüm kimlikleri.
* **Doğrulanabilir Başarı Belgeleri (VC):** Hakem heyetlerinin yarışmacı takımlara şeffaf, zaman damgalı ve kriptografik başarı belgeleri vermesi.

### 3. Akıllı Tedarik Zinciri & Soğuk Zincir IoT Telemetrisi (`SupplyChainTracker.sol`)
* Görev kritik aviyonik donanımlar, bataryalar ve sensör paketlerinin uçtan uca nakliye takibi.
* Sıcaklık, nem ve GPS koordinatlarının SHA3/Keccak-256 kriptografik mühürleri ile anlık doğrulanması.

### 4. Sıfır Bilgi İspatı & Gizlilik Motoru (`ZKProofVerifier.sol`)
* T.C. Kimlik veya ham sensör verisini ifşa etmeden Merkle üyelik doğrulaması.
* Kriptografik körleme faktörlü Pedersen aralık kanıtları ($min \le v \le max$).
* Çift harcamayı ve kimlik mükerrerliğini önleyen tek kullanımlık **Nullifier** mimarisi.

### 5. TEKNOFEST Hakem Heyeti Puanlama Konsensüsü (`JuryScoringProtocol.sol`)
* Hakemlerin birbirlerinin notlarını görmesini ve puan manipülasyonunu engelleyen **Commit-Reveal şeması**.
* Mimariden sunuma 5 kategorili ağırlıklı rubrik değerlendirmesi ve akıllı sözleşme onaylı derece tescili.

### 6. Çapraz Zincir Durum Köprüsü (`CrossChainBridgeAnchor.sol`)
* TEKNOFEST yerel alt ağı (Subnet / Rollup) ile Polygon (#137) veya Ethereum (#1) arasında durum ve tescil aktarımı.
* Eşik multi-sig relayer doğrulaması ve monotonik nonce replay koruması.

### 7. Ekosistem Tokenomiği ve Staking (`TeknofestToken.sol`)
* Sabit 10,000,000 arz tavanına sahip `$TKF` ERC-20 hizmet jetonu.
* Doğrulayıcı düğümler için yıllık %12 getiri oranlı (APY) Proof-of-Stake modeli ve kötü niyet cezası (slashing).
* Hakem heyeti ve değerlendiriciler için tek tıkla testnet token talep musluğu (Faucet).

### 8. DAO ve Topluluk Yönetişimi (`GovernanceDAO.sol`)
* Şeffaf teklif oluşturma, oy kullanma, kuorum takibi ve 24 saatlik timelock icra koruması.

---

## ⚡ Hızlı Başlangıç (Quickstart)

### 1. Depoyu Klonlayın
```bash
git clone https://github.com/bahattinyunus/teknofest_blokzincir.git
cd teknofest_blokzincir
```

### 2. Bağımsız Test Süitini Çalıştırın (22/22 Başarılı)
Dahili test koşucusu harici paket indirmesi gerektirmeden saniyeler içinde çalışır:
```bash
node test/runner.js
# veya
npm test
```

### 3. Uçtan Uca Canlı Simülasyon Senaryosunu Başlatın (8 Sözleşme Entegre)
```bash
npm run demo
# veya
node src/cli/cli.js demo
```

### 4. REST API ve Oracle Sunucusunu Başlatın
```bash
npm start
# veya
node src/api/server.js
```
* **Sağlık Kontrolü:** `http://localhost:3000/api/v1/health`
* **Canlı Metrikler:** `http://localhost:3000/api/v1/metrics`
* **Liderlik Tablosu:** `http://localhost:3000/api/v1/jury/leaderboard`

### 5. Web3 Yönetim Konsolunu Görüntüleyin
`frontend/index.html` dosyasını doğrudan herhangi bir tarayıcıda açabilir veya yerel sunucu başlatabilirsiniz:
```bash
npm run serve:frontend
```
> **Not:** Arayüz, MetaMask yüklü olmasa bile yerleşik **Sandbox Mimari Modu** sayesinde tüm sözleşme fonksiyonlarını, cüzdan bakiyelerini ve grafiklerini eksiksiz simüle eder.

<p align="center">
  <img src="docs/assets/dashboard_preview.jpg" alt="Block-Architect-TR Web3 Console Dashboard" width="100%" style="border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
</p>

---

## 📂 Proje Dizin Yapısı

```
teknofest_blokzincir/
├── .github/workflows/       # GitHub Actions otomatik CI/CD test hattı
│   └── ci.yml
├── contracts/               # EVM Uyumlu 8 Akıllı Sözleşme
│   ├── common/              # Modüler güvenlik tabanı (Ownable, Pausable, RBAC, Guard)
│   ├── BlockArchitectCore.sol
│   ├── IdentityRegistry.sol
│   ├── SupplyChainTracker.sol
│   ├── ZKProofVerifier.sol
│   ├── JuryScoringProtocol.sol
│   ├── CrossChainBridgeAnchor.sol
│   ├── TeknofestToken.sol
│   └── GovernanceDAO.sol
├── docs/                    # Profesyonel Dokümantasyon
│   ├── assets/              # Mimari banner ve arayüz görselleri
│   │   ├── banner.jpg
│   │   └── dashboard_preview.jpg
│   ├── ARCHITECTURE.md      # Detaylı Mermaid mimari diyagramları
│   ├── WHITE_PAPER.md       # Akademik düzeyde teknik White Paper (v2.5)
│   └── API_REFERENCE.md     # SDK ve REST API başvuru kılavuzu
├── frontend/                # Web3 Yönetim & Denetleme Konsolu
│   ├── index.html           # 9 sekmeli futuristik Web3 arayüzü
│   ├── app.js               # Canlı blok zincir simülatörü & Web3 köprüsü
│   ├── style.css            # Glassmorphism ve neon tema stilleri
│   └── README.md
├── scripts/                 # Dağıtım ve Veri Tohumlama Betikleri
│   ├── deploy.js            # 8 sözleşmeyi dağıtıp JSON çıktıları üreten betik
│   └── seedData.js          # Kapsamlı demo takımları, ZK ve jüri verileri
├── src/                     # Node.js SDK, REST API ve CLI
│   ├── api/server.js        # Hafif REST API & Oracle servisi
│   ├── cli/cli.js           # İnteraktif terminal yönetim aracı (zk, jury, bridge)
│   ├── sdk/BlockArchitectSDK.js # Birleşik JavaScript blokzincir istemcisi
│   ├── utils/crypto.js      # Merkle Tree, ZK Proof, Pedersen, W3C DID fonksiyonları
│   └── main.js              # Kütüphane ana giriş noktası
├── test/                    # Birim ve Entegrasyon Testleri
│   ├── runner.js            # 22/22 Başarılı bağımsız test koşucusu
│   ├── BlockArchitectCore.test.js
│   ├── IdentityRegistry.test.js
│   ├── SupplyChainTracker.test.js
│   ├── ZKProofVerifier.test.js
│   ├── JuryScoringProtocol.test.js
│   └── CrossChainBridgeAnchor.test.js
├── hardhat.config.js        # Hardhat ağ ve Solidity derleme ayarları
├── package.json             # Bağımlılıklar ve çalıştırma komutları
└── README.md                # Proje tanıtım belgesi
```

---

## 👨‍💻 Hazırlayan ve Mimar Hakkında

**Bahattin Yunus Çetin**  
*IT Architect | Blokzincir Araştırmacısı*  
Trabzon / Of

Kurumsal teknoloji mimarileri, dağıtık sistemler ve blokzinciri altyapıları üzerine odaklanmış bir bilişim profesyoneli. Türkiye'nin blokzinciri ekosistemini güçlendirmek ve yerli teknolojilerin küresel standartlarda uygulanmasını sağlamak amacıyla topluluğa katkı sunmaktadır.

* **LinkedIn:** [linkedin.com/in/bahattinyunus](https://www.linkedin.com/in/bahattinyunus/)
* **GitHub:** [github.com/bahattinyunus](https://github.com/bahattinyunus)

---

## 📄 Lisans
Bu proje [MIT Lisansı](LICENSE) altında açık kaynak olarak sunulmuştur.

<p align="center">
  <img src="https://img.shields.io/badge/Powered%20By-TEKNOFEST-red?style=for-the-badge&logo=rocket&logoColor=white" alt="TEKNOFEST Support">
</p>
