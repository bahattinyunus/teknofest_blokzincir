# 🏛️ Block-Architect-TR: Sistem ve Yazılım Mimarisi

Bu belge, **TEKNOFEST Blokzinciri** yarışması standartlarında kurumsal seviyede tasarlanan **Block-Architect-TR** protokolünün sistem mimarisini, 11 akıllı sözleşmeli modüler yapısını ve veri akış diyagramlarını detaylandırmaktadır.

---

## 1. Katmanlı Sistem Mimarisi (Architectural Layers)

Sistem, **Sıfır Güven Mimarisi (Zero Trust Architecture)** prensiplerine dayanarak 4 ana katmana ayrılmıştır:

```mermaid
flowchart TD
    subgraph L3["Katman 3: İstemci, Donanım & Hakem Heyeti (Clients & IoT)"]
        UI["12 Sekmeli Web3 Konsolu (Tailwind / Chart.js)"]
        CLI["Geliştirici CLI Terminali (Node.js)"]
        Sensors["Aviyonik & IoT Sensörleri (GPS, Sıcaklık, İrtifa)"]
        JuryNode["Hakem & Değerlendirici Düğümleri"]
    end

    subgraph L2["Katman 2: Entegrasyon, ZK, Oracle & Köprü Katmanı"]
        SDK["BlockArchitect JavaScript/Node SDK (11 Sözleşme)"]
        API["REST API & Webhook Servisi"]
        Merkle["Merkle Tree & ZK Proof Doğrulama Motoru"]
        Oracle["TelemetryOracleHub Çoklu Düğüm Medyan Motoru"]
        Paymaster["TeknofestPaymaster ERC-4337 Gaz Sponsoru"]
        Relayer["Cross-Chain Relayer Multi-Sig Rölesi"]
    end

    subgraph L1["Katman 1: Uygulama & DApp Sözleşmeleri (Business Contracts)"]
        DID["IdentityRegistry.sol (W3C DID / SSI)"]
        SC["SupplyChainTracker.sol (Lojistik & Telemetri)"]
        ZK["ZKProofVerifier.sol (Gizlilik & Nullifier)"]
        JURY["JuryScoringProtocol.sol (Commit-Reveal Puanlama)"]
        NFT["TeknofestBadgeNFT.sol (EIP-5192 Soulbound Rozet)"]
        ORC["TelemetryOracleHub.sol (Medyan Oracle Hub)"]
        PM["TeknofestPaymaster.sol (Gazsız Sponsorluk)"]
        BRIDGE["CrossChainBridgeAnchor.sol (L2 Köprü)"]
        DAO["GovernanceDAO.sol (Yönetişim & Oylama)"]
        TKF["TeknofestToken.sol (ERC-20, Staking %12 APY)"]
    end

    subgraph L0["Katman 0: Çekirdek Güvenlik & Konsensüs (Core Layer)"]
        Core["BlockArchitectCore.sol (RBAC, Devre Kesici, Denetim)"]
        EVM["EVM Konsensüs Ağı (Avalanche Subnet / Polygon / Ethereum)"]
    end

    UI --> SDK
    CLI --> SDK
    Sensors --> API
    JuryNode --> UI
    API --> SDK
    SDK --> Merkle
    SDK --> Oracle
    SDK --> Paymaster
    SDK --> Relayer
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

## 3. Sıfır Bilgi İspatı (Zero-Knowledge) & Nullifier Yaşam Döngüsü

Kişisel veriler (TC No, doğum tarihi) veya gizli aviyonik telemetriler ifşa edilmeden Merkle üyeliği ve Pedersen aralık kanıtları ($min \le v \le max$) doğrulanır:

```mermaid
sequenceDiagram
    autonumber
    actor Participant as Anonim Katılımcı
    participant Verifier as ZKProofVerifier.sol
    participant NullifierRegistry as Nullifier Havuzu

    Participant->>Participant: Merkle Kanıtı ve Nullifier Hesapla (N = H(Secret || Scope))
    Participant->>Verifier: verifyAndConsumeCredential(Root, Leaf, Proof, Nullifier)
    Verifier->>NullifierRegistry: Nullifier Daha Önce Harcandı mı?
    alt Harcanmamış (Geçerli)
        NullifierRegistry-->>Verifier: Temiz (Harcanmadı)
        Verifier->>NullifierRegistry: Nullifier'ı Mühürle (Harcanmış Olarak İşaretle)
        Verifier-->>Participant: İspat Geçerli & İşlem Onaylandı
    else Zaten Harcanmış (Çift Harcama)
        NullifierRegistry-->>Verifier: HATA: NULLIFIER_ALREADY_CONSUMED
        Verifier-->>Participant: İşlem İptal Edildi (Anti-Double-Spend)
    end
```

---

## 4. Hakem Heyeti Anti-Collusion Commit-Reveal Protokolü

Hakemlerin birbirlerinin notlarını görmeden bağımsız değerlendirme yapabilmesi için kriptografik iki aşamalı protokol uygulanır:

```mermaid
sequenceDiagram
    autonumber
    actor Jury as Jüri Üyesi
    participant Protocol as JuryScoringProtocol.sol
    actor Coordinator as Yarışma Koordinatörü

    Coordinator->>Protocol: setPhase(Commit)
    Jury->>Jury: Rubrik Notlarını ve Gizli Tuzu Hashle (CommitHash = H(Scores || Salt || Address))
    Jury->>Protocol: commitScore(teamId, CommitHash)
    Protocol-->>Jury: Taahhüt Blokzincire Yazıldı
    
    Coordinator->>Protocol: setPhase(Reveal)
    Jury->>Protocol: revealScore(teamId, Rubric, Salt)
    Protocol->>Protocol: CommitHash Doğrulaması Yap
    Protocol-->>Coordinator: Puan Konsensüse Eklendi
    
    Coordinator->>Protocol: finalizeEvaluation(teamId)
    Protocol-->>Coordinator: Ağırlıklı Konsensüs Puanı ve Derece Tescil Edildi
```

---

## 5. Soulbound Başarı Rozetleri (EIP-5192) Mimarisi

Yarışmada dereceye giren takımların elde ettiği madalyalar (`TeknofestBadgeNFT.sol`), geleneksel NFT'lerin aksine devredilemez (soulbound) niteliktedir:

```mermaid
flowchart TD
    Jury["Hakem Heyeti / Admin"] -->|"mintBadge(recipient, Gold, Cezeri Takımı)"| NFT["TeknofestBadgeNFT.sol"]
    NFT -->|"EIP-5192 Locked(tokenId)"| Holder["Öğrenci / Takım Cüzdanı"]
    Holder -.->|"transferFrom / safeTransferFrom"| Blocked["❌ REVERT: SoulboundTokenCannotBeTransferred()"]
```

---

## 6. Bizans Hata Toleranslı Telemetri Oracle Hub Mimarisi

Dağıtık uç yer istasyonlarından gelen sıcaklık ve irtifa verileri, aykırı değer filtresinden geçirilerek medyan hesaplanır:

```mermaid
flowchart LR
    N1["Trabzon Düğümü (21.4°C, 1250m)"] --> Hub["TelemetryOracleHub.sol"]
    N2["Samsun Düğümü (21.6°C, 1248m)"] --> Hub
    N3["Ankara Düğümü (21.5°C, 1252m)"] --> Hub
    N4["Hatalı Sensör (65.0°C - Outlier)"] --> Hub
    Hub --> Filter["Medyan & Aykırı Değer Filtresi"]
    Filter --> Consensus["Konsensüs Telemetri: 21.5°C, 1250m"]
```

---

## 7. ERC-4337 Hesap Soyutlama & Paymaster Gaz Sponsorluğu

Öğrenci takımlarının işlem maliyetlerini minimize etmek adına gazsız sponsorluk döngüsü:

```mermaid
sequenceDiagram
    autonumber
    actor Team as Öğrenci Takımı (0 Gaz Bakiyesi)
    participant PM as TeknofestPaymaster.sol
    participant Target as BlockArchitectCore.sol

    Team->>PM: executeSponsoredTransaction(target, callData)
    PM->>PM: Whitelist ve Günlük Kota Kontrolü Yap
    PM->>Target: İşlemi Yürüt (callData)
    Target-->>PM: İşlem Başarılı
    PM-->>Team: Sıfır Gaz ile İşlem Tamamlandı (Kota -1)
```

---

## 8. Çapraz Zincir Durum Köprüsü (Cross-Chain Bridge Anchor)

TEKNOFEST yerel alt ağı (Subnet / Rollup) ile Polygon veya Ethereum ana ağı arasında durum rölesi:

```mermaid
flowchart LR
    A["Yerel Ağ (Subnet #31337)"] -->|"dispatchMessage(targetChainId, payload)"| B["CrossChainBridgeAnchor.sol"]
    B -->|"BridgeMessageDispatched Event"| C["Relayer Multi-Sig Düğümleri (M-of-N)"]
    C -->|"processInboundMessage(... + signatures)"| D["Hedef Ağ (Polygon #137 / L1)"]
    D -->|"Replay Protection Monotonic Nonce"| E["Hedef Akıllı Sözleşme İcrası"]
```

---

## 9. Güvenlik ve Defansif Kodlama Önlemleri

1. **Reentrancy Koruması:** Tüm fonksiyonel dış çağrılarda `nonReentrant` bayrağı ile reentrancy zafiyetleri engellenmiştir (`contracts/security/ReentrancyAttacker.sol` ile test edilip doğrulanmıştır).
2. **Rol Tabanlı Erişim Kontrolü (RBAC):** `DEFAULT_ADMIN_ROLE`, `OPERATOR_ROLE`, `VERIFIER_ROLE`, `JURY_ROLE`, `COORDINATOR_ROLE`, `ORACLE_NODE_ROLE`, `RELAYER_ROLE` ve `BRIDGE_ADMIN_ROLE` ile yetki ayrımı sağlanmıştır.
3. **Acil Durum Devre Kesicisi (Circuit Breaker):** Beklenmedik durumlarda sistem `emergencyPause()` ile dondurulabilir, inceleme sonrası `emergencyResume()` ile sürdürülebilir.
4. **Kriptografik Replay Koruması:** Hem ZK kimliklerinde `nullifier` harcama denetimi hem de çapraz zincir köprüsünde zincir-bazlı `nonce` kontrolü uygulanmıştır.
5. **Soulbound Kilitleme:** EIP-5192 standardına uygun `_beforeTokenTransfer` kancası ile başarı rozetlerinin satışı veya transferi engellenmiştir.
