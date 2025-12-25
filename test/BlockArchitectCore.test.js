const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BlockArchitectCore", function () {
    let Core;
    let core;
    let owner;
    let addr1;

    beforeEach(async function () {
        Core = await ethers.getContractFactory("BlockArchitectCore");
        [owner, addr1] = await ethers.getSigners();
        core = await Core.deploy();
        await core.deployed();
    });

    it("Should set the right owner", async function () {
        expect(await core.owner()).to.equal(owner.address);
    });

    it("Should allow owner to authorize nodes", async function () {
        await core.setNodeStatus(addr1.address, true);
        expect(await core.authorizedNodes(addr1.address)).to.equal(true);
    });

    it("Should allow authorized nodes to execute operations", async function () {
        const dataHash = ethers.utils.formatBytes32String("Tactical Data");
        await core.setNodeStatus(addr1.address, true);

        await expect(core.connect(addr1).executeOperation(dataHash))
            .to.emit(core, "OperationExecuted")
            .withArgs(0, dataHash, addr1.address);

        expect(await core.totalOperations()).to.equal(1);
        const op = await core.getOperationDetails(0);
        expect(op.dataHash).to.equal(dataHash);
    });

    it("Should fail if unauthorized node tries to execute", async function () {
        const dataHash = ethers.utils.formatBytes32String("Illegal Access");
        await expect(core.connect(addr1).executeOperation(dataHash))
            .to.be.revertedWith("ERR: NODE_NOT_AUTHORIZED");
    });

    it("Should allow owner to toggle system status", async function () {
        await core.toggleSystem(false);
        expect(await core.systemActive()).to.equal(false);

        const dataHash = ethers.utils.formatBytes32String("Offline Data");
        await expect(core.executeOperation(dataHash))
            .to.be.revertedWith("ERR: SYSTEM_OFFLINE");
    });
});
