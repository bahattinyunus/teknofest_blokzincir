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
            title: 'TEKNOFEST 2025 IoT Telemetri Oracel Entegrasyonu',
            desc: 'Chainlink oracel protokolü üzerinden sıcaklık/konum doğrulaması yapan sözleşmenin onaylanması.',
            forVotes: 6420,
            againstVotes: 350,
            status: 'Oylamada'
        }
    ],
    token: {
        balance: 100.0,
        staked: 50.0
    }
};

// --- Tab Switching ---
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    const targetSection = document.getElementById(`tab-${tabId}`);
    if (targetSection) targetSection.classList.remove('hidden');

    // Highlight button
    event.currentTarget.classList.add('active');
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
    document.getElementById('didCountBadge').innerText = `${AppState.identities.length} Kimlik`;
    document.getElementById('statIdentities').innerText = AppState.identities.length;
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
    document.getElementById('statShipments').innerText = AppState.shipments.length;
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
    document.getElementById('userTokenBalance').innerText = `${AppState.token.balance.toFixed(2)} TKF`;
    document.getElementById('userStakedBalance').innerText = `${AppState.token.staked.toFixed(2)} TKF`;
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

function commitDirectOperation() {
    const input = document.getElementById('rawOpInput');
    const val = input.value.trim();
    if (!val) return;
    AppState.operationsCount++;
    document.getElementById('statOperations').innerText = AppState.operationsCount.toLocaleString();
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

    // Periodic block increment
    setInterval(() => {
        AppState.blockNumber++;
        const el = document.getElementById('currentBlockNumber');
        if (el) el.innerText = AppState.blockNumber.toLocaleString();
    }, 5000);
}

// --- Wallet Button Interaction ---
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
    renderProposals();
    updateTokenUI();
    initChart();
    initBlockStream();
});
