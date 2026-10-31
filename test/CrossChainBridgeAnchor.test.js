const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CrossChainBridgeAnchor (L2 Interoperability Relay)", function () {
    let Bridge;
    let bridge;
    let owner;
    let relayer;
    let user;

    beforeEach(async function () {
        Bridge = await ethers.getContractFactory("CrossChainBridgeAnchor");
        [owner, relayer, user] = await ethers.getSigners();
        bridge = await Bridge.deploy(31337, 1);
        if (bridge.deployed) {
            await bridge.deployed();
        } else if (bridge.waitForDeployment) {
            await bridge.waitForDeployment();
        }

        await bridge.addRelayer(relayer.address);
    });

    it("Should dispatch outbound cross-chain message with incrementing nonces", async function () {
        const payload = ethers.utils ? ethers.utils.toUtf8Bytes("SyncTelemetry_123") : ethers.toUtf8Bytes("SyncTelemetry_123");
        const destinationChainId = 137; // Polygon

        await expect(bridge.connect(user).dispatchMessage(destinationChainId, user.address, payload))
            .to.emit(bridge, "MessageDispatched");

        expect(await bridge.outboundNonce()).to.equal(1);
    });

    it("Should prevent bridging to self", async function () {
        const payload = ethers.utils ? ethers.utils.toUtf8Bytes("Test") : ethers.toUtf8Bytes("Test");
        await expect(bridge.connect(user).dispatchMessage(31337, user.address, payload))
            .to.be.revertedWith("ERR: CANNOT_BRIDGE_TO_SELF");
    });
});
