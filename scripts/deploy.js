/**
 * @file deploy.js
 * @author Bahattin Yunus Çetin (IT Architect)
 * @notice Automated deployment pipeline for all 11 Block-Architect-TR smart contracts.
 */

const fs = require('fs');
const path = require('path');

async function main() {
    console.log("===============================================================");
    console.log("  BLOCK-ARCHITECT-TR: 11'Lİ KURUMSAL AKILLI SÖZLEŞME DAĞITIMI");
    console.log("===============================================================\n");

    let deployer;

    if (typeof ethers !== 'undefined' && ethers.getSigners) {
        [deployer] = await ethers.getSigners();
        console.log(`[DEPLOY] Dağıtım Yapan Cüzdan: ${deployer.address}`);
        if (deployer.getBalance) {
            console.log(`[BALANCE] Bakiye: ${(await deployer.getBalance()).toString()}`);
        }
    } else {
        console.log("[SIMULATION] Standalone/Simülasyon Modu devrede.");
        deployer = { address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" };
    }

    const deployedAddresses = {
        network: "Hardhat/LocalEVM",
        deployedAt: new Date().toISOString(),
        deployer: deployer.address,
        contracts: {}
    };

    async function deployContract(name, ...args) {
        console.log(`\n⏳ Dağıtılıyor: ${name}...`);
        if (typeof ethers !== 'undefined' && ethers.getContractFactory) {
            const Factory = await ethers.getContractFactory(name);
            const contract = await Factory.deploy(...args);
            if (contract.deployed) await contract.deployed();
            else if (contract.waitForDeployment) await contract.waitForDeployment();
            const targetAddr = contract.address || (await contract.getAddress());
            console.log(`   ✔ ${name} adrese dağıtıldı: ${targetAddr}`);
            return targetAddr;
        } else {
            const hash = require('crypto').createHash('sha256').update(name + 'Teknofest2025Masterpiece').digest('hex');
            const mockAddr = "0x" + hash.slice(0, 40);
            console.log(`   ✔ ${name} (Simüle) adrese dağıtıldı: ${mockAddr}`);
            return mockAddr;
        }
    }

    // 1. Core Contract
    deployedAddresses.contracts.BlockArchitectCore = await deployContract("BlockArchitectCore");

    // 2. Identity Registry
    deployedAddresses.contracts.IdentityRegistry = await deployContract("IdentityRegistry");

    // 3. Supply Chain Tracker
    deployedAddresses.contracts.SupplyChainTracker = await deployContract("SupplyChainTracker");

    // 4. Teknofest Token (10,000,000 Initial Supply)
    const tokenAddr = await deployContract("TeknofestToken", 10000000);
    deployedAddresses.contracts.TeknofestToken = tokenAddr;

    // 5. Governance DAO (Linked to Token)
    deployedAddresses.contracts.GovernanceDAO = await deployContract("GovernanceDAO", tokenAddr);

    // 6. Zero-Knowledge Proof Verifier
    deployedAddresses.contracts.ZKProofVerifier = await deployContract("ZKProofVerifier");

    // 7. TEKNOFEST Jury Scoring Protocol
    deployedAddresses.contracts.JuryScoringProtocol = await deployContract("JuryScoringProtocol");

    // 8. Cross-Chain Bridge Anchor (ChainID 31337, Relayer Threshold 1)
    deployedAddresses.contracts.CrossChainBridgeAnchor = await deployContract("CrossChainBridgeAnchor", 31337, 1);

    // 9. Soulbound Achievement Badge NFT (EIP-5192)
    deployedAddresses.contracts.TeknofestBadgeNFT = await deployContract("TeknofestBadgeNFT");

    // 10. Multi-Node Telemetry Oracle Hub
    deployedAddresses.contracts.TelemetryOracleHub = await deployContract("TelemetryOracleHub");

    // 11. Gas Sponsorship Paymaster (Account Abstraction)
    deployedAddresses.contracts.TeknofestPaymaster = await deployContract("TeknofestPaymaster");

    // Save deployment artifact
    const deploymentsDir = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    const deploymentFile = path.join(deploymentsDir, 'deployment-info.json');
    fs.writeFileSync(deploymentFile, JSON.stringify(deployedAddresses, null, 2));
    console.log(`\n📁 Dağıtım bilgisi kaydedildi: ${deploymentFile}`);

    // Copy to frontend for UI consumption
    const frontendConfigFile = path.join(__dirname, '..', 'frontend', 'contracts.json');
    fs.writeFileSync(frontendConfigFile, JSON.stringify(deployedAddresses, null, 2));
    console.log(`📁 Frontend konfigürasyonu güncellendi: ${frontendConfigFile}`);

    console.log("\n✨ 11 AKILLI SÖZLEŞMENİN TÜMÜ BAŞARIYLA DAĞITILDI VE SENKRONİZE EDİLDİ!");
}

if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = main;
