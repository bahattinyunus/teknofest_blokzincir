const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SupplyChainTracker", function () {
    let Tracker;
    let tracker;
    let owner;
    let sender;
    let recipient;
    let carrier;

    beforeEach(async function () {
        Tracker = await ethers.getContractFactory("SupplyChainTracker");
        [owner, sender, recipient, carrier] = await ethers.getSigners();
        tracker = await Tracker.deploy();
        if (tracker.deployed) {
            await tracker.deployed();
        } else if (tracker.waitForDeployment) {
            await tracker.waitForDeployment();
        }
    });

    it("Should create a shipment with initial checkpoint", async function () {
        const itemHash = ethers.utils ? ethers.utils.id("AVIONICS_PAYLOAD") : ethers.id("AVIONICS_PAYLOAD");
        await expect(tracker.connect(sender).createShipment("TKF-001", itemHash, recipient.address, "Trabzon Hub"))
            .to.emit(tracker, "ShipmentCreated");

        expect(await tracker.totalShipments()).to.equal(1);
        const s = await tracker.getShipment(1);
        expect(s.trackingCode).to.equal("TKF-001");
        expect(s.currentCustodian).to.equal(sender.address);
    });

    it("Should allow custody transfer and delivery confirmation", async function () {
        const itemHash = ethers.utils ? ethers.utils.id("SENSOR_PAYLOAD") : ethers.id("SENSOR_PAYLOAD");
        await tracker.connect(sender).createShipment("TKF-002", itemHash, recipient.address, "Ankara Terminal");

        // Transfer custody to carrier
        await expect(tracker.connect(sender).transferCustody(1, carrier.address))
            .to.emit(tracker, "CustodyTransferred")
            .withArgs(1, sender.address, carrier.address);

        // Confirm delivery by recipient
        await expect(tracker.connect(recipient).confirmDelivery(1))
            .to.emit(tracker, "ShipmentStateChanged");

        const s = await tracker.getShipment(1);
        expect(s.state).to.equal(5); // ShipmentState.Delivered
    });
});
