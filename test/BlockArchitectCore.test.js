const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BlockArchitectCore (Enterprise)", function () {
    let Core;
    let core;
    let owner;
    let operator;
    let auditor;
    let unauthorized;

    beforeEach(async function () {
        Core = await ethers.getContractFactory("BlockArchitectCore");
        [owner, operator, auditor, unauthorized] = await ethers.getSigners();
        core = await Core.deploy();
        if (core.deployed) {
            await core.deployed();
        } else if (core.waitForDeployment) {
            await core.waitForDeployment();
        }

        // Grant Operator and Auditor roles
        const OPERATOR_ROLE = await core.OPERATOR_ROLE();
        const AUDITOR_ROLE = await core.AUDITOR_ROLE();
        await core.grantRole(OPERATOR_ROLE, operator.address);
        await core.grantRole(AUDITOR_ROLE, auditor.address);
    });

    it("Should initialize with owner and active system status", async function () {
        expect(await core.owner()).to.equal(owner.address);
        expect(await core.systemActive()).to.equal(true);
        expect(await core.totalOperations()).to.equal(0);
    });

    it("Should allow operator to execute single operation", async function () {
        const dataHash = ethers.utils 
            ? ethers.utils.formatBytes32String("Op_1") 
            : ethers.encodeBytes32String("Op_1");

        await expect(core.connect(operator).executeOperation(dataHash))
            .to.emit(core, "OperationExecuted");

        expect(await core.totalOperations()).to.equal(1);
        const op = await core.getOperationDetails(0);
        expect(op.dataHash).to.equal(dataHash);
        expect(op.verified).to.equal(true);
    });

    it("Should allow batch operation execution", async function () {
        const h1 = ethers.utils ? ethers.utils.formatBytes32String("Batch_1") : ethers.encodeBytes32String("Batch_1");
        const h2 = ethers.utils ? ethers.utils.formatBytes32String("Batch_2") : ethers.encodeBytes32String("Batch_2");
        const tag = ethers.utils ? ethers.utils.formatBytes32String("DID_TAG") : ethers.encodeBytes32String("DID_TAG");

        await expect(core.connect(operator).executeBatchOperations([h1, h2], tag))
            .to.emit(core, "BatchExecuted");

        expect(await core.totalOperations()).to.equal(2);
    });

    it("Should allow auditor to audit and verify operations", async function () {
        const dataHash = ethers.utils ? ethers.utils.formatBytes32String("Audit_Me") : ethers.encodeBytes32String("Audit_Me");
        await core.connect(operator).executeOperation(dataHash);

        await expect(core.connect(auditor).auditOperation(0, true, "Cryptographic audit passed"))
            .to.emit(core, "OperationAudited")
            .withArgs(0, auditor.address, true, "Cryptographic audit passed");

        const op = await core.getOperationDetails(0);
        expect(op.status).to.equal(2); // OperationStatus.Audited
    });

    it("Should reject execution from unauthorized caller", async function () {
        const dataHash = ethers.utils ? ethers.utils.formatBytes32String("Illegal") : ethers.encodeBytes32String("Illegal");
        await expect(core.connect(unauthorized).executeOperation(dataHash))
            .to.be.revertedWith("ERR: NODE_NOT_AUTHORIZED");
    });

    it("Should respect emergency pause circuit breaker", async function () {
        await core.emergencyPause();
        const dataHash = ethers.utils ? ethers.utils.formatBytes32String("Paused") : ethers.encodeBytes32String("Paused");

        await expect(core.connect(operator).executeOperation(dataHash))
            .to.be.revertedWith("ERR: SYSTEM_OFFLINE");

        await core.emergencyResume();
        await expect(core.connect(operator).executeOperation(dataHash))
            .to.emit(core, "OperationExecuted");
    });
});
