/**
 * @file app.js
 * @author Bahattin Yunus Çetin (IT Architect)
 * @notice Interactive Web3 Dashboard application logic for Block-Architect-TR.
 */

// --- State Store ---
const AppState = {
    connectedAddress: '0xBahattin...771c (Sandbox Mimari Modu)',
    isWalletConnected: true,
    blockNumber: 49284,
    operationsCount: 1248,
    identities: [
        {
            didUri: 'did:teknofest:2025:team:arch-trabzon-01',
            docHash: '0x9482fba734d092...381a',
            status: 'Aktif',
            verified: true,
            org: 'Karadeniz Teknik Üniversitesi'
        },
        {
            didUri: 'did:teknofest:2025:validator:of-genesis-node',
            docHash: '0xab27c014798e1f...914d',
            status: 'Aktif',
            verified: true,
            org: 'Trabzon Of Blokzincir Düğümü'
        },
        {
            didUri: 'did:teknofest:2025:student:bahattinyunus',
            docHash: '0x7e2938afdc918b...452c',
            status: 'Aktif',
            verified: true,
            org: 'IT Architect & Researcher'
        }
    ],
    shipments: [
        {
            code: 'TKF-IHA-2025-01',
            manifest: 'Otonom Aviyonik Uçuş Kontrol Bilgisayarı v4.1',
            origin: 'Trabzon/Of Lojistik Terminali',
            destination: 'TEKNOFEST Samsun Ana Yarışma Alanı',
            status: 'Taşımada (InTransit)',
            temp: '21.4°C',
            humidity: '%48.2',
            checkpoints: [
                { time: '10:15', loc: 'Trabzon Lojistik Hub Çıkışı', temp: '20.1°C' },
                { time: '13:40', loc: 'Ordu Otoyol Kontrol İstasyonu', temp: '21.4°C' }
            ]
        },
        {
            code: 'TKF-ROBO-2025-09',
            manifest: 'LiDAR Mesafe Sensörü ve Titreşim Damper Kiti',
            origin: 'İstanbul Teknopark',
            destination: 'Ankara İnceleme Merkezi',
            status: 'Teslim Edildi',
            temp: '19.8°C',
            humidity: '%42.0',
            checkpoints: [
                { time: '08:30', loc: 'İstanbul Çıkış', temp: '18.5°C' },
                { time: '14:20', loc: 'Ankara Giriş Kabul', temp: '19.8°C' }
            ]
        }
    ],
    proposals: [
        {
            id: 1,
            title: 'Doğrulayıcı Düğüm Minimum Stake Teminatı Güncellemesi',
            desc: 'Ağ güvenliğini güçlendirmek amacıyla minimum stake miktarının 1,000 TKF olarak sabitlenmesi.',
            forVotes: 8500,
            againstVotes: 120,
            status: 'Başarılı (Kuyrukta)'
        },
        {
            id: 2,
            title: 'TEKNOFEST 2025 IoT Telemetri Oracle Entegrasyonu',
            desc: 'Chainlink oracle protokolü üzerinden sıcaklık/konum doğrulaması yapan sözleşmenin onaylanması.',
            forVotes: 6420,
            againstVotes: 350,
            status: 'Oylamada'
        }
    ],
    zkProofs: [
        {
            nullifier: '0x9fa102b84...32c1',
            root: '0x55f2d6fa0...fee5',
            status: 'Doğrulandı (Valid)',
            time: '3 dk önce'
        },
        {
            nullifier: '0x1c4e789a2...99b0',
            root: '0x55f2d6fa0...fee5',
            status: 'Doğrulandı (Valid)',
            time: '18 dk önce'
        }
    ],
    teams: [
        {
            id: 1,
            name: 'Cezeri Blokzincir Takımı',
            title: 'Havacılık Güvenli Telemetri Ağı',
            score: 99.2,
            rank: '🥇 Türkiye Birincisi (Şampiyon)'
        },
        {
            id: 2,
            name: 'Alpha Mimarlık Takımı',
            title: 'Sıfır Güven Tabanlı DID ve Kimlik Doğrulama',
            score: 98.4,
            rank: '🥈 İkincilik Ödülü'
        },
        {
            id: 3,
            name: 'Selçuk Otonom Savunma',
            title: 'Aviyonik Parça Tedarik Zinciri & Soğuk Zincir',
            score: 96.8,
            rank: '🥉 Üçüncülük Ödülü'
        }
    ],
    bridgeMessages: [
        {
            nonce: 1,
            targetChain: 'Polygon (#137)',
            payloadHash: '0x7b841a9e...4210',
            status: 'İletildi (Relayed)'
        },
        {
            nonce: 2,
            targetChain: 'Ethereum (#1)',
            payloadHash: '0xd31c9402...9fba',
            status: 'İletildi (Relayed)'
        }
    ],
    token: {
        balance: 100.0,
        staked: 50.0
    },
    juryCommitment: null
};

// --- Tab Switching ---
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    const targetSection = document.getElementById(`tab-${tabId}`);
    if (targetSection) targetSection.classList.remove('hidden');

    if (window.event && window.event.currentTarget) {
        window.event.currentTarget.classList.add('active');
    }
}

// --- Render Functions ---
function renderDIDTable() {
    const tbody = document.getElementById('didTableBody');
    if (!tbody) return;
    tbody.innerHTML = AppState.identities.map(id => `
        <tr class="hover:bg-slate-800/40">
            <td class="px-4 py-3 text-sky-400 font-semibold">${id.didUri}</td>
            <td class="px-4 py-3 text-slate-400">${id.docHash}</td>
            <td class="px-4 py-3">
                <span class="px-2 py-0.5 rounded text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">${id.status}</span>
            </td>
            <td class="px-4 py-3 text-slate-300">
                <button onclick="alert('Doğrulama Kanıtı: Geçerli W3C İmzası Doğrulandı!')" class="text-sky-400 hover:text-sky-300 underline">Doğrula</button>
            </td>
        </tr>
    `).join('');
    const badge = document.getElementById('didCountBadge');
    if (badge) badge.innerText = `${AppState.identities.length} Kimlik`;
    const stat = document.getElementById('statIdentities');
    if (stat) stat.innerText = AppState.identities.length;
}

function renderShipments() {
    const container = document.getElementById('shipmentsContainer');
    if (!container) return;
    container.innerHTML = AppState.shipments.map((s, index) => `
        <div class="border border-slate-800 rounded-lg p-5 bg-slate-900/40 space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                    <span class="font-mono text-xs text-amber-400 font-bold">${s.code}</span>
                    <h3 class="text-sm font-semibold text-white">${s.manifest}</h3>
                </div>
                <span class="text-xs px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">${s.status}</span>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-400">
                <div><span class="text-slate-500 block">Sıcaklık:</span> <span class="text-white font-medium">${s.temp}</span></div>
                <div><span class="text-slate-500 block">Nem Oranı:</span> <span class="text-white font-medium">${s.humidity}</span></div>
                <div><span class="text-slate-500 block">Çıkış Noktası:</span> <span class="text-white font-medium">${s.origin}</span></div>
                <div><span class="text-slate-500 block">Hedef:</span> <span class="text-white font-medium">${s.destination}</span></div>
            </div>
            <div class="pt-2">
                <button onclick="addTelemetryCheckpoint(${index})" class="text-xs text-amber-400 hover:text-amber-300 font-medium">
                    <i class="fa-solid fa-plus-circle mr-1"></i> Yeni Telemetri Kontrol Noktası Ekle
                </button>
            </div>
        </div>
    `).join('');
    const stat = document.getElementById('statShipments');
    if (stat) stat.innerText = AppState.shipments.length;
}

function renderZKProofs() {
    const tbody = document.getElementById('zkProofTableBody');
    if (!tbody) return;
    tbody.innerHTML = AppState.zkProofs.map(p => `
        <tr class="hover:bg-slate-800/40">
            <td class="px-4 py-3 text-teal-400 font-semibold">${p.nullifier}</td>
            <td class="px-4 py-3 text-slate-400">${p.root}</td>
            <td class="px-4 py-3">
                <span class="px-2 py-0.5 rounded text-[11px] bg-teal-500/10 text-teal-400 border border-teal-500/20">${p.status}</span>
            </td>
            <td class="px-4 py-3 text-slate-500">${p.time}</td>
        </tr>
    `).join('');
}

function renderJuryLeaderboard() {
    const tbody = document.getElementById('juryLeaderboardBody');
    if (!tbody) return;
    tbody.innerHTML = AppState.teams.map((t, idx) => `
        <tr class="hover:bg-slate-800/40 ${idx === 0 ? 'bg-rose-950/20 border-l-2 border-rose-500' : ''}">
            <td class="px-4 py-3 font-bold text-white">#${idx + 1}</td>
            <td class="px-4 py-3 text-rose-300 font-semibold">${t.name}</td>
            <td class="px-4 py-3 text-slate-400">${t.title}</td>
            <td class="px-4 py-3 font-mono font-bold text-white text-sm">${t.score.toFixed(1)} / 100</td>
            <td class="px-4 py-3">
                <span class="px-2 py-0.5 rounded text-[11px] bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">${t.rank}</span>
            </td>
        </tr>
    `).join('');
}

function renderBridgeMessages() {
    const tbody = document.getElementById('bridgeTableBody');
    if (!tbody) return;
    tbody.innerHTML = AppState.bridgeMessages.map(m => `
        <tr class="hover:bg-slate-800/40">
            <td class="px-4 py-3 text-cyan-400 font-bold">#${m.nonce}</td>
            <td class="px-4 py-3 text-white font-medium">${m.targetChain}</td>
            <td class="px-4 py-3 text-slate-400">${m.payloadHash}</td>
            <td class="px-4 py-3">
                <span class="px-2 py-0.5 rounded text-[11px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">${m.status}</span>
            </td>
        </tr>
    `).join('');
}

function renderProposals() {
    const container = document.getElementById('proposalsList');
    if (!container) return;
    container.innerHTML = AppState.proposals.map(p => {
        const total = p.forVotes + p.againstVotes;
        const forPercent = total ? Math.round((p.forVotes / total) * 100) : 0;
        return `
            <div class="border border-slate-800 rounded-lg p-5 bg-slate-900/40 space-y-3">
                <div class="flex items-center justify-between">
                    <h3 class="text-sm font-bold text-white flex items-center gap-2">
                        <span class="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">#${p.id}</span>
                        ${p.title}
                    </h3>
                    <span class="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">${p.status}</span>
                </div>
                <p class="text-xs text-slate-400 leading-relaxed">${p.desc}</p>
                <div class="space-y-1">
                    <div class="flex justify-between text-xs text-slate-400 font-mono">
                        <span>Evet: %${forPercent} (${p.forVotes} TKF)</span>
                        <span>Hayır: %${100 - forPercent} (${p.againstVotes} TKF)</span>
                    </div>
                    <div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex">
                        <div class="bg-emerald-500 h-full" style="width: ${forPercent}%"></div>
                        <div class="bg-red-500 h-full" style="width: ${100 - forPercent}%"></div>
                    </div>
                </div>
                <div class="flex gap-2 pt-2">
                    <button onclick="voteProposal(${p.id}, true)" class="px-3 py-1.5 rounded bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/50 text-xs font-semibold">Evet Oyu Ver</button>
                    <button onclick="voteProposal(${p.id}, false)" class="px-3 py-1.5 rounded bg-red-600/30 text-red-400 border border-red-500/30 hover:bg-red-600/50 text-xs font-semibold">Hayır Oyu Ver</button>
                </div>
            </div>
        `;
    }).join('');
}

function updateTokenUI() {
    const balEl = document.getElementById('userTokenBalance');
    if (balEl) balEl.innerText = `${AppState.token.balance.toFixed(2)} TKF`;
    const stakeEl = document.getElementById('userStakedBalance');
    if (stakeEl) stakeEl.innerText = `${AppState.token.staked.toFixed(2)} TKF`;
}

// --- User Actions ---
function handleStake() {
    const amount = parseFloat(document.getElementById('stakeAmount').value);
    if (isNaN(amount) || amount <= 0 || amount > AppState.token.balance) {
        alert('Geçersiz stake miktarı veya yetersiz bakiye!');
        return;
    }
    AppState.token.balance -= amount;
    AppState.token.staked += amount;
    updateTokenUI();
    logTerminal(`[STAKE] ${amount} TKF başarıyla kilitlendi. Yıllık %12 getiri devrede.`);
}

function handleUnstake() {
    const amount = parseFloat(document.getElementById('stakeAmount').value);
    if (isNaN(amount) || amount <= 0 || amount > AppState.token.staked) {
        alert('Stake edilmiş bakiyeden fazlasını çekemezsiniz!');
        return;
    }
    AppState.token.staked -= amount;
    AppState.token.balance += amount;
    updateTokenUI();
    logTerminal(`[UNSTAKE] ${amount} TKF havuzdan çözüldü ve bakiyenize aktarıldı.`);
}

function claimFaucet() {
    AppState.token.balance += 100.0;
    updateTokenUI();
    logTerminal(`[FAUCET] Jüri/Testnet musluğundan 100.00 TKF çekildi.`);
    alert('Tebrikler! 100 TKF test jetonu hesabınıza tanımlandı.');
}

function voteProposal(id, isFor) {
    const p = AppState.proposals.find(item => item.id === id);
    if (!p) return;
    if (isFor) p.forVotes += 50;
    else p.againstVotes += 50;
    renderProposals();
    logTerminal(`[VOTE] Teklif #${id} için ${isFor ? 'EVET' : 'HAYIR'} oyu kullanıldı.`);
}

function addTelemetryCheckpoint(index) {
    const s = AppState.shipments[index];
    const newTemp = (20.0 + Math.random() * 2).toFixed(1) + '°C';
    s.temp = newTemp;
    s.checkpoints.push({
        time: new Date().toLocaleTimeString().slice(0, 5),
        loc: 'IoT Yol Kontrol Noktası',
        temp: newTemp
    });
    renderShipments();
    logTerminal(`[IOT] ${s.code} için telemetri paketi blokzincire kaydedildi: Sıcaklık ${newTemp}`);
}

function handleJuryCommit() {
    const arch = parseInt(document.getElementById('scoreArch').value);
    const sec = parseInt(document.getElementById('scoreSec').value);
    const innov = parseInt(document.getElementById('scoreInnov').value);
    const impl = parseInt(document.getElementById('scoreImpl').value);
    const pres = parseInt(document.getElementById('scorePres').value);
    const teamId = parseInt(document.getElementById('juryTargetTeam').value);

    const total = arch + sec + innov + impl + pres;
    const fakeCommitHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');

    AppState.juryCommitment = {
        teamId,
        score: total,
        commitHash: fakeCommitHash
    };

    document.getElementById('juryPhaseLabel').innerText = 'REVEAL AŞAMASI (Şifre Açma)';
    logTerminal(`[JURY_COMMIT] Takım #${teamId} için puan özeti ağa taahhüt edildi: ${fakeCommitHash.slice(0, 20)}...`);
    alert(`[Commit Başarılı] Puanınız şifrelendi ve taahhüt edildi. Hash: ${fakeCommitHash.slice(0, 16)}...`);
}

function handleJuryReveal() {
    if (!AppState.juryCommitment) {
        alert('Lütfen önce [1] Commit butonuna basarak puanı taahhüt edin!');
        return;
    }

    const { teamId, score } = AppState.juryCommitment;
    const team = AppState.teams.find(t => t.id === teamId);
    if (team) {
        team.score = parseFloat(((team.score + score) / 2).toFixed(1));
    }
    AppState.teams.sort((a, b) => b.score - a.score);
    renderJuryLeaderboard();

    document.getElementById('juryPhaseLabel').innerText = 'FINALIZED (Tescil Edildi)';
    logTerminal(`[JURY_REVEAL] Takım #${teamId} puanı çözüldü ve konsensüse dahil edildi: ${score}/100`);
    alert(`[Reveal Başarılı] Puan doğrulandı ve Liderlik Tablosu güncellendi!`);
    AppState.juryCommitment = null;
}

function commitDirectOperation() {
    const input = document.getElementById('rawOpInput');
    const val = input.value.trim();
    if (!val) return;
    AppState.operationsCount++;
    const statEl = document.getElementById('statOperations');
    if (statEl) statEl.innerText = AppState.operationsCount.toLocaleString();
    const fakeHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
    logTerminal(`[EXECUTE] Veri mühürlendi -> Hash: ${fakeHash.slice(0, 20)}... Payload: "${val}"`);
    input.value = '';
}

function logTerminal(msg) {
    const log = document.getElementById('operationTerminalLog');
    if (!log) return;
    const div = document.createElement('div');
    div.innerText = `[${new Date().toLocaleTimeString()}] ${msg}`;
    log.prepend(div);
}

// --- Form Submissions ---
document.getElementById('didForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const cat = document.getElementById('didCategory').value;
    const id = document.getElementById('didIdentifier').value.trim();
    const meta = document.getElementById('didMetadata').value.trim();

    const newDID = {
        didUri: `did:teknofest:2025:${cat}:${id.toLowerCase().replace(/\s+/g, '-')}`,
        docHash: '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('').slice(0, 16) + '...',
        status: 'Aktif',
        verified: true,
        org: meta || 'TEKNOFEST Katılımcısı'
    };

    AppState.identities.unshift(newDID);
    renderDIDTable();
    logTerminal(`[DID_REGISTER] Yeni kimlik mühürlendi: ${newDID.didUri}`);
    e.target.reset();
});

document.getElementById('shipmentForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const code = document.getElementById('shipmentCode').value.trim();
    const manifest = document.getElementById('shipmentManifest').value.trim();
    const origin = document.getElementById('shipmentOrigin').value.trim();

    AppState.shipments.unshift({
        code,
        manifest,
        origin,
        destination: 'Samsun / TEKNOFEST Alanı',
        status: 'Oluşturuldu',
        temp: '20.0°C',
        humidity: '%50.0',
        checkpoints: [{ time: new Date().toLocaleTimeString().slice(0, 5), loc: origin, temp: '20.0°C' }]
    });

    renderShipments();
    logTerminal(`[SUPPLY_CHAIN] Yeni kargo kaydı açıldı: [${code}]`);
    e.target.reset();
});

document.getElementById('zkVerifyForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const claim = document.getElementById('zkSecretClaim').value.trim();
    const scope = document.getElementById('zkScope').value.trim();

    const fakeNullifier = '0x' + Array.from({length: 20}, () => Math.floor(Math.random()*16).toString(16)).join('') + '...null';
    const fakeRoot = '0x55f2d6fa0...fee5';

    AppState.zkProofs.unshift({
        nullifier: fakeNullifier,
        root: fakeRoot,
        status: 'Doğrulandı (Valid)',
        time: 'Az önce'
    });
    renderZKProofs();
    logTerminal(`[ZK_VERIFY] Sıfır bilgi üyelik ve nullifier doğrulandı: ${fakeNullifier} (Kapsam: ${scope})`);
    alert('Sıfır Bilgi İspatı (ZK-Proof) başarıyla doğrulandı ve tek kullanımlık Nullifier zincire yazıldı!');
    e.target.reset();
});

document.getElementById('bridgeForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const chainSelect = document.getElementById('bridgeDestChain');
    const targetChainName = chainSelect.options[chainSelect.selectedIndex].text;
    const payload = document.getElementById('bridgePayload').value.trim();

    const nextNonce = AppState.bridgeMessages.length + 1;
    const fakeHash = '0x' + Array.from({length: 16}, () => Math.floor(Math.random()*16).toString(16)).join('') + '...poly';

    AppState.bridgeMessages.unshift({
        nonce: nextNonce,
        targetChain: targetChainName,
        payloadHash: fakeHash,
        status: 'İletildi (Relayed)'
    });
    renderBridgeMessages();
    logTerminal(`[BRIDGE_DISPATCH] Mesaj sevk edildi -> Hedef: ${targetChainName} (Nonce #${nextNonce})`);
    alert(`Köprü mesajı sevk edildi! Nonce #${nextNonce} - Durum dış zincire başarıyla aktarıldı.`);
});

document.getElementById('daoForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('proposalTitle').value.trim();
    const desc = document.getElementById('proposalDesc').value.trim();

    AppState.proposals.unshift({
        id: AppState.proposals.length + 1,
        title,
        desc,
        forVotes: 100,
        againstVotes: 0,
        status: 'Oylamada'
    });

    renderProposals();
    logTerminal(`[DAO_PROPOSAL] Yeni teklif sunuldu: "${title}"`);
    e.target.reset();
});

// --- Chart Initialization ---
function initChart() {
    const ctx = document.getElementById('networkActivityChart');
    if (!ctx) return;
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'],
            datasets: [
                {
                    label: 'İşlem Sayısı (Tx)',
                    data: [120, 190, 300, 480, 520, 710, 890],
                    borderColor: '#38bdf8',
                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'IoT Telemetri Paketleri',
                    data: [80, 130, 210, 340, 410, 590, 740],
                    borderColor: '#f97316',
                    backgroundColor: 'rgba(249, 115, 22, 0.05)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#94a3b8' } }
            },
            scales: {
                x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
        }
    });
}

function initBlockStream() {
    const container = document.getElementById('liveBlockStream');
    if (!container) return;
    const blocks = [
        { num: 49284, hash: '0x3a9f...8b21', txs: 14, time: '2s önce' },
        { num: 49283, hash: '0x1c4d...a719', txs: 8, time: '7s önce' },
        { num: 49282, hash: '0x99e2...04df', txs: 23, time: '12s önce' }
    ];
    container.innerHTML = blocks.map(b => `
        <div class="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-800 text-xs">
            <div>
                <span class="font-bold text-sky-400">#${b.num}</span>
                <span class="text-slate-400 font-mono ml-2">${b.hash}</span>
            </div>
            <div class="text-right">
                <span class="text-white font-medium">${b.txs} Tx</span>
                <span class="text-slate-500 block text-[10px]">${b.time}</span>
            </div>
        </div>
    `).join('');

    setInterval(() => {
        AppState.blockNumber++;
        const el = document.getElementById('currentBlockNumber');
        if (el) el.innerText = AppState.blockNumber.toLocaleString();
    }, 5000);
}

// --- Wallet Connection ---
document.getElementById('walletBtn').addEventListener('click', () => {
    if (window.ethereum) {
        window.ethereum.request({ method: 'eth_requestAccounts' })
            .then(accounts => {
                if (accounts.length > 0) {
                    const acc = accounts[0];
                    document.getElementById('walletBtnText').innerText = acc.slice(0, 6) + '...' + acc.slice(-4);
                    logTerminal(`[METAMASK] Cüzdan bağlandı: ${acc}`);
                }
            })
            .catch(err => {
                console.error(err);
                alert('MetaMask bağlantısı reddedildi, Sandbox modu aktif.');
            });
    } else {
        alert('MetaMask tespit edilmedi. Sistem tam fonksiyonel "Sandbox Mimari Modu"nda çalışıyor.');
    }
});

// Bootstrap on load
window.addEventListener('DOMContentLoaded', () => {
    renderDIDTable();
    renderShipments();
    renderZKProofs();
    renderJuryLeaderboard();
    renderBridgeMessages();
    renderProposals();
    updateTokenUI();
    initChart();
    initBlockStream();
});
