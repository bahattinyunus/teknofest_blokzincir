# 📜 White Paper: The Block-Architect Protocol
### TEKNOFEST Blokzinciri için Sıfır Güven Tabanlı Kurumsal DApp Referans Mimarisi

**Yazar:** Bahattin Yunus Çetin  
**Unvan:** IT Architect  
**Konum:** Trabzon / Of  
**Sürüm:** 3.0.0 (Masterpiece Enterprise)  
**Tarih:** 2025/2026  

---

## Özet (Abstract)
Blokzinciri teknolojisi, yalnızca finansal transferler için değil; kamu güvenliği, ulusal savunma sanayii tedarik zinciri, gizlilik korumalı kimlik doğrulama, Soulbound başarı tescili ve merkeziyetsiz yarışma hakemliği için de kritik bir omurga teşkil etmektedir. Bu çalışmada sunulan **Block-Architect Protocol**, Türkiye'nin **Milli Teknoloji Hamlesi** vizyonu doğrultusunda TEKNOFEST Blokzinciri Yarışması için geliştirilmiş, yüksek güvenlikli, modüler ve EVM uyumlu 11 sözleşmeli bir kurumsal blokzinciri ekosistemidir.

Protokol; rol tabanlı erişim kontrollü çekirdek sistem (`BlockArchitectCore`), W3C v1.0 uyumlu Merkeziyetsiz Kimlik kaydı (`IdentityRegistry`), IoT telemetri mühürlü tedarik zinciri takibi (`SupplyChainTracker`), Sıfır Bilgi İspatı doğrulama motoru (`ZKProofVerifier`), jüri manipülasyonunu engelleyen commit-reveal puanlama protokolü (`JuryScoringProtocol`), EIP-5192 Soulbound NFT madalya sertifikasyonu (`TeknofestBadgeNFT`), dağıtık çoklu düğüm Bizans hata toleranslı telemetri oraclesı (`TelemetryOracleHub`), ERC-4337 hesap soyutlama gaz sponsorluğu (`TeknofestPaymaster`), L2 durum aktarımı sağlayan çapraz zincir köprüsü (`CrossChainBridgeAnchor`), deflasyonist ekonomik modele sahip ekosistem jetonu (`TeknofestToken`) ve timelock güvenceli merkeziyetsiz otonom yönetim (`GovernanceDAO`) bileşenlerinden meydana gelir.

---

## 1. Giriş ve Problem Tanımı
Mevcut kurumsal blokzinciri entegrasyonlarında karşılaşılan temel zorluklar şunlardır:
1. **Veri Bütünlüğü ve Dış Dünya Entegrasyonu:** IoT cihazlarından gelen verilerin (sıcaklık, nem, irtifa) tekil oracle manipülasyonlarına açık olması.
2. **Kimlik Yönetiminde Gizlilik ve Güvenlik:** Katılımcıların ve kurumların verilerinin merkezi veritabanlarında sızıntılara maruz kalması.
3. **Değerlendirme Şeffaflığı ve Hakem Kolüzyonu:** Yarışma değerlendirmelerinde hakemlerin birbirlerinin notlarından etkilenmesi veya puan sızıntıları.
4. **Başarı Belgelerinin Devredilebilirliği:** Geleneksel NFT'lerin satılabilir olması sebebiyle yarışma ödül ve madalyalarının sahte transferlere konu olabilmesi.
5. **Kullanıcı Giriş Bariyeri (Gas Maliyeti):** Öğrenci takımlarının işlem gerçekleştirebilmek için yerel kripto para edinme zorunluluğu.
6. **Çoklu Zincir İletişim Engelleri:** Yerel alt ağların (Subnet) Ethereum veya Polygon gibi ana ağlarla güvenli durum senkronizasyonunun eksikliği.

---

## 2. Mimari ve Matematiksel Modeller

### 2.1 Merkle Ağacı ve Toplu İşlem Verimliliği
Toplu telemetri mühürleme işlemlerinde $n$ adet işlem verisi ($L_1, L_2, \dots, L_n$) için Keccak-256 tabanlı ikili Merkle Ağacı kullanılır:

$$H_{parent} = \text{Keccak256}(H_{left} \parallel H_{right})$$

Bu sayede zincir üzerine yalnızca 32 baytlık **Merkle Kökü (Merkle Root)** yazılarak depolama karmaşıklığı $O(n)$ yerine $O(1)$'e indirgenir; doğrulama karmaşıklığı ise $O(\log n)$ olarak garanti edilir.

### 2.2 Sıfır Bilgi İspatı (ZK) & Pedersen Aralık Taahhüdü
Katılımcıların gizli verilerini veya sensör değerlerini ($v$) açıklamadan $v \in [v_{min}, v_{max}]$ olduğunu kanıtlamak için Pedersen taahhütleri ve nullifier mekanizması kullanılır:

$$C = \text{Keccak256}(v \parallel r)$$

Burada $r \in_R \{0, 1\}^{256}$ kriptografik körleme faktörüdür (blinding factor). Çift harcamayı engellemek amacıyla tek kullanımlık **Nullifier** üretilir:

$$\mathcal{N} = \text{Keccak256}(sk \parallel \text{ScopeID})$$

$\mathcal{N}$ değeri zincir üzerinde yalnızca bir defa tüketilebilir ($O(1)$ lookup).

### 2.3 Anti-Collusion Commit-Reveal Protokolü
Jüri üyelerinin puanları eşzamanlı ve gizli sunması için iki aşamalı taahhüt mekanizması uygulanır:

$$\text{CommitPhase}: \quad H_{commit} = \text{Keccak256}(\text{TeamID} \parallel \vec{S} \parallel \text{Salt} \parallel \text{JuryAddress})$$

$$\text{RevealPhase}: \quad \text{Verify}(H_{commit} \stackrel{?}{=} \text{Keccak256}(\dots))$$

Tüm geçerli oylar açığa çıkarıldıktan sonra kırpılmış ağırlıklı ortalama (trimmed mean) hesaplanır.

### 2.4 Bizans Hata Toleranslı Telemetri Medyanı
$K$ adet sensör düğümünden gelen okumalar $\{x_1, x_2, \dots, x_k\}$ sıralanır:

$$\tilde{x} = \text{Median}(x_1, x_2, \dots, x_k)$$

Uç değerler ($|x_i - \tilde{x}| > 3\sigma$) aykırı değer kabul edilerek elenir.

### 2.5 EIP-5192 Soulbound Kilit Matematiksel Kısıtı
Akıllı sözleşme düzeyinde tüm transfer fonksiyonları için:

$$\forall \text{from} \ne 0, \quad \text{Transfer}(\text{from}, \text{to}, \text{tokenId}) \implies \bot \quad (\text{Revert})$$

### 2.6 Çapraz Zincir Eşik Çoklu İmza (Threshold Multi-Sig) Doğrulaması
$N$ adet relayer düğümünden en az $M$ tanesinin geçerli ECDSA imzası şart koşulur ($M$-of-$N$ threshold):

$$\sum_{i=1}^{N} \mathbb{I}(\text{ecrecover}(\text{Digest}, \sigma_i) \in \mathcal{R}) \ge M$$

Replay saldırılarına karşı her dış zincir için monotonik artan bir `nonce` tablosu zorunlu tutulur.

### 2.7 Staking ve Yıllık Ödül Modeli (APY)
Doğrulayıcı düğümlerin ağa kilitledikleri $S$ miktarındaki TKF jetonları için yıllık %12 oranında ödül tahakkuk eder:

$$R = \frac{S \times 12 \times \Delta t}{365 \times 86400 \times 100}$$

---

## 3. 11'li Protokol Sözleşmeleri Matrisi

| Akıllı Sözleşme | Görev ve Standart | Güvenlik Mekanizması |
|---|---|---|
| `BlockArchitectCore.sol` | Çekirdek İşlem ve Düğüm Yetkilendirme | RBAC, Pausable, ReentrancyGuard |
| `IdentityRegistry.sol` | W3C DID v1.0 & Doğrulanabilir Başarı Belgesi (VC) | Hiyerarşik İzinler, Geçerlilik Süresi |
| `SupplyChainTracker.sol` | Aviyonik ve Kargo Telemetri Takibi | IoT SHA3 İmzaları, Çok Taraflı İmza |
| `ZKProofVerifier.sol` | Sıfır Bilgi İspatı & Nullifier Gizlilik Motoru | Anti-Double-Spend, Merkle Membership |
| `JuryScoringProtocol.sol` | TEKNOFEST Hakem Heyeti Puanlama Konsensüsü | Commit-Reveal Anti-Collusion Scheme |
| `TeknofestBadgeNFT.sol` | EIP-5192 Soulbound Başarı Rozeti & Madalyaları | Kalıcı Transfer Kilidi (Non-transferable) |
| `TelemetryOracleHub.sol` | Dağıtık Çoklu Düğüm Telemetri Konsensüsü | Bizans Hata Toleranslı Medyan Filtresi |
| `TeknofestPaymaster.sol` | ERC-4337 Hesap Soyutlama & Gazsız Sponsorluk | Günlük Bütçe Kotası, Whitelist Kontrolü |
| `CrossChainBridgeAnchor.sol`| L2/Subnet ile Ethereum/Polygon Durum Köprüsü | Monotonic Nonce Replay Guard, Multi-Sig |
| `TeknofestToken.sol` | $TKF ERC-20 Fayda ve Doğrulayıcı Teminatı | Fixed Cap (10M), Ceza Yakımı (Slashing) |
| `GovernanceDAO.sol` | Topluluk Teklifleri ve Parametre Değişimi | Kuorum, 24 Saatlik Timelock |

---

## 4. Tehdit Analizi ve Karşı Önlemler
* **Sybil Saldırıları:** Yalnızca `ADMIN_ROLE` tarafından yetkilendirilmiş veya minimum 1,000 TKF teminat yatırmış doğrulayıcı düğümler işlem mühürleyebilir.
* **Front-Running ve MEV:** Hassas lojistik ve jüri puanlama süreçlerinde Commit-Reveal şeması ile sızıntılar engellenir.
* **Replay ve Çift Harcama:** ZK nullifier'ları ve köprü nonce tabloları ile her işlem tekil kılınır.
* **Reentrancy Saldırıları:** `ReentrancyGuard` kilitleri ve `contracts/security/ReentrancyAttacker.sol` test donanımı ile doğrulanmış CEI mimarisi.

---

## 5. Yol Haritası (Roadmap)
* **Faz 1 (2025 Q1-Q2):** Çekirdek mimari tasarım, temel sözleşmeler ve birim test süitinin tamamlanması.
* **Faz 2 (2025 Q3-Q4):** 12 sekmeli Web3 Yönetim Konsolu, ZK-Proof motoru, Jüri Commit-Reveal protokolü ve Çapraz Zincir Köprüsü.
* **Faz 3 (2026 Q1-Q2):** TEKNOFEST yarışma sahasında canlı aviyonik parça lojistik takibi, Soulbound NFT ve Paymaster gaz sponsorluğu.
* **Faz 4 (2026 Q3+):** Yerli ve milli blokzinciri altyapıları ile Layer-2 Rollup entegrasyonu.
