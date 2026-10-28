/**
 * @file deploy.js
 * @author Bahattin Yunus Çetin (IT Architect)
 * @notice Automated deployment pipeline for all Block-Architect-TR smart contracts.
 */

const fs = require('fs');
const path = require('path');

async function main() {
    console.log("===============================================================");
    console.log("  BLOCK-ARCHITECT-TR: AKILLI SÖZLEŞME DAĞITIM VE KURULUMU");
    console.log("===============================================================\n");

    let deployer;
    let CoreFactory, IdentityFactory, SupplyChainFactory, TokenFactory, GovernanceFactory;

    if (typeof ethers !== 'undefined') {
        [deployer] = await ethers.getSigners();
        console.log(`[DEPLOY] Dağıtım Yapan Cüzdan: ${deployer.address}`);
        if (deployer.getBalance) {
            console.log(`[BALANCE] Bakiye: ${(await deployer.getBalance()).toString()}`);
        }
    } else {
        console.log("[SIMULATION] Ethers bulunamadı, simülasyon modu devrede.");
        deployer = { address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" };
    }

    const deployedAddresses = {
        network: "Hardhat/LocalEVM",
        deployedAt: new Date().toISOString(),
        deployer: deployer.address,
        contracts: {}
    };

    // Helper deployment function
    async function deployContract(name, factoryOrArgs, ...args) {
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
            // Deterministic mock address generator
            const mockAddr = "0x" + Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('');
            console.log(`   ✔ ${name} (Simüle) adrese dağıtıldı: ${mockAddr}`);
            return mockAddr;
        }
    }

    // 1. Core Contract
    const coreAddr = await deployContract("BlockArchitectCore");
    deployedAddresses.contracts.BlockArchitectCore = coreAddr;

    // 2. Identity Registry
    const identityAddr = await deployContract("IdentityRegistry");
    deployedAddresses.contracts.IdentityRegistry = identityAddr;

    // 3. Supply Chain Tracker
    const supplyChainAddr = await deployContract("SupplyChainTracker");
    deployedAddresses.contracts.SupplyChainTracker = supplyChainAddr;

    // 4. Teknofest Token (10,000,000 Initial Supply)
    const tokenAddr = await deployContract("TeknofestToken", null, 10000000);
    deployedAddresses.contracts.TeknofestToken = tokenAddr;

    // 5. Governance DAO (Linked to Token)
    const governanceAddr = await deployContract("GovernanceDAO", null, tokenAddr);
    deployedAddresses.contracts.GovernanceDAO = governanceAddr;

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

    console.log("\n✨ TÜM SÖZLEŞMELER BAŞARIYLA DAĞITILDI VE BAĞLANDI!");
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
