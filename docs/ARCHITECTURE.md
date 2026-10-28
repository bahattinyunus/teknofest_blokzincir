# 🏛️ Block-Architect-TR: Sistem ve Yazılım Mimarisi

Bu belge, **TEKNOFEST Blokzinciri** yarışması standartlarında kurumsal seviyede tasarlanan **Block-Architect-TR** protokolünün sistem mimarisini, katmanlı yapısını ve veri akış diyagramlarını detaylandırmaktadır.

---

## 1. Katmanlı Sistem Mimarisi (Architectural Layers)

Sistem, **Sıfır Güven Mimarisi (Zero Trust Architecture)** prensiplerine dayanarak 4 ana katmana ayrılmıştır:

```mermaid
flowchart TD
    subgraph L3["Katman 3: İstemci ve Dış Donanımlar (Clients & IoT)"]
        UI["Web3 Yönetim Konsolu (HTML5 / Tailwind / Chart.js)"]
        CLI["Geliştirici CLI Terminali (Node.js)"]
        Sensors["Aviyonik & IoT Sensörleri (GPS, Sıcaklık, Nem)"]
    end

    subgraph L2["Katman 2: Entegrasyon & SDK Katmanı (Middleware / Oracle)"]
        SDK["BlockArchitect JavaScript/Node SDK"]
        API["REST API & Webhook Servisi"]
        Merkle["Merkle Tree Doğrulama Motoru"]
    end

    subgraph L1["Katman 1: Uygulama & DApp Sözleşmeleri (Business Contracts)"]
        DID["IdentityRegistry.sol (W3C DID / SSI)"]
        SC["SupplyChainTracker.sol (Lojistik & Telemetri)"]
        DAO["GovernanceDAO.sol (Yönetişim & Oylama)"]
        TKF["TeknofestToken.sol (ERC-20, Staking, Slashing)"]
    end

    subgraph L0["Katman 0: Çekirdek Güvenlik & Konsensüs (Core Layer)"]
        Core["BlockArchitectCore.sol (RBAC, Devre Kesici, Denetim)"]
        EVM["EVM Konsensüs Ağı (Ethereum / Polygon / Avalanche)"]
    end

    UI --> SDK
    CLI --> SDK
    Sensors --> API
    API --> SDK
    SDK --> Merkle
    SDK --> L1
    L1 --> Core
    Core --> EVM
```

---

## 2. Merkeziyetsiz Kimlik (DID / SSI) Doğrulama Döngüsü

W3C v1.0 standartlarına uyumlu SSI (Self-Sovereign Identity) mimarisi ile katılımcı takımlar, öğrenciler ve IoT cihazları merkezi sunuculara bağımlı olmadan kriptografik olarak doğrulanır.

```mermaid
sequenceDiagram
    autonumber
    actor User as Yarışmacı / Takım
    participant DApp as Web3 Konsolu
    participant Core as IdentityRegistry.sol
    participant Issuer as Hakem / Kurum Düğümü

    User->>DApp: DID Oluşturma Talebi (did:teknofest:...)
    DApp->>Core: registerDID(didUri, docHash)
    Core-->>DApp: DID Mühürlendi (DIDRegistered Event)
    
    Issuer->>Core: issueCredential(didKey, credHash, schema, duration)
    Core-->>User: Verifiable Credential (VC) Hak Edildi
    
    Note over User,Core: Üçüncü Taraf Doğrulayıcı (Jüri)
    User->>Core: verifyCredential(credHash)
    Core-->>User: Geçerlilik Kanıtı Onaylandı (Status: Valid)
```

---

## 3. Akıllı Tedarik Zinciri ve Soğuk Zincir Durum Makinesi

Yüksek öneme sahip aviyonik, radar ve batarya parçalarının TEKNOFEST yarışma sahasına güvenli nakliyesi için durum makinesi:

```mermaid
stateDiagram-v2
    [*] --> Created: Kargo Manifestosu Mühürlendi
    Created --> Dispatched: Gönderici Taşıyıcıya Teslim Etti
    Dispatched --> InTransit: Telemetri Kayıtları Başladı (IoT)
    InTransit --> CustomsCleared: Güvenlik & Kontrol Noktası Onaylandı
    CustomsCleared --> OutForDelivery: Dağıtıma Çıkarıldı
    OutForDelivery --> Delivered: Alıcı Teslim Aldı
    Delivered --> Completed: Denetim Tamamlandı
    
    InTransit --> Disputed: Anormal Sıcaklık / Titreşim Algılandı
    Disputed --> Completed: Hakem Heyeti Çözüm Kararı Verdi
```

---

## 4. DAO Yönetişim ve Timelock Karar Mekanizması

Protokolün yükseltmeleri ve doğrulayıcı düğüm izinleri topluluk tarafından şeffaf bir şekilde oylanır:

```mermaid
flowchart LR
    A["Teklif Sunma (Min: 1,000 TKF)"] --> B["Oylama Süresi (3 Gün)"]
    B --> C{"Kuorum Sağlandı mı? (5,000 TKF)"}
    C -- Hayır / Red --> D["Reddedildi (Defeated)"]
    C -- Evet --> E["Kuyruğa Alındı (Timelock: 24 Saat)"]
    E --> F["Akıllı Sözleşme Tarafından Otomatik İcra"]
```

---

## 5. Güvenlik ve Defansif Kodlama Önlemleri

1. **Reentrancy Koruması:** Fonksiyonel çağrılarda `nonReentrant` bayrağı ile reentrancy zafiyetleri donanımsal düzeyde engellenmiştir.
2. **Rol Tabanlı Erişim Kontrolü (RBAC):** `DEFAULT_ADMIN_ROLE`, `OPERATOR_ROLE` ve `AUDITOR_ROLE` ile yetki ayrımı sağlanmıştır.
3. **Acil Durum Devre Kesicisi (Circuit Breaker):** Beklenmedik durumlarda sistem `emergencyPause()` ile dondurulabilir, inceleme sonrası `emergencyResume()` ile sürdürülebilir.
4. **Merkle Ağacı Doğrulaması:** Toplu telemetri ve işlem verileri O(log n) karmaşıklığında Merkle kökleri ile zincir üzerinde minimum gas maliyetiyle doğrulanır.
