const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ZKProofVerifier (Zero-Knowledge Privacy Engine)", function () {
    let Verifier;
    let verifier;
    let owner;
    let operator;
    let jury;
    let user;

    beforeEach(async function () {
        Verifier = await ethers.getContractFactory("ZKProofVerifier");
        [owner, operator, jury, user] = await ethers.getSigners();
        verifier = await Verifier.deploy();
        if (verifier.deployed) {
            await verifier.deployed();
        } else if (verifier.waitForDeployment) {
            await verifier.waitForDeployment();
        }

        const OPERATOR_ROLE = await verifier.OPERATOR_ROLE();
        const VERIFIER_ROLE = await verifier.VERIFIER_ROLE();
        await verifier.grantRole(OPERATOR_ROLE, operator.address);
        await verifier.grantRole(VERIFIER_ROLE, jury.address);
    });

    it("Should allow operator to commit a valid Merkle root", async function () {
        const root = ethers.utils ? ethers.utils.id("MERKLE_ROOT_01") : ethers.id("MERKLE_ROOT_01");
        await expect(verifier.connect(operator).commitRoot(root))
            .to.emit(verifier, "RootCommitted")
            .withArgs(root, await ethers.provider.getBlock("latest").then(b => b.timestamp + 1));

        expect(await verifier.validRoots(root)).to.equal(true);
        expect(await verifier.totalCommittedRoots()).to.equal(1);
    });

    it("Should verify membership proof and consume nullifier once", async function () {
        const leaf = ethers.utils ? ethers.utils.id("LeafA") : ethers.id("LeafA");
        const sibling = ethers.utils ? ethers.utils.id("SiblingB") : ethers.id("SiblingB");

        // Root = keccak256(leaf + sibling)
        const root = ethers.utils 
            ? ethers.utils.solidityKeccak256(["bytes32", "bytes32"], [leaf, sibling])
            : ethers.solidityPackedKeccak256(["bytes32", "bytes32"], [leaf, sibling]);

        await verifier.connect(operator).commitRoot(root);

        const nullifier = ethers.utils ? ethers.utils.id("Nullifier_Unique_01") : ethers.id("Nullifier_Unique_01");

        // Verify and consume
        await expect(verifier.connect(jury).verifyAndConsumeCredential(root, leaf, [sibling], [false], nullifier))
            .to.emit(verifier, "ProofVerified");

        expect(await verifier.isNullifierUsed(nullifier)).to.equal(true);

        // Double consumption must revert
        await expect(verifier.connect(jury).verifyAndConsumeCredential(root, leaf, [sibling], [false], nullifier))
            .to.be.revertedWith("ERR: NULLIFIER_ALREADY_CONSUMED");
    });

    it("Should verify Pedersen range proof correctly", async function () {
        const value = 22; // 22°C temperature telemetry
        const blindingFactor = ethers.utils ? ethers.utils.id("BlindingSecret") : ethers.id("BlindingSecret");

        const commitment = ethers.utils 
            ? ethers.utils.solidityKeccak256(["uint256", "bytes32"], [value, blindingFactor])
            : ethers.solidityPackedKeccak256(["uint256", "bytes32"], [value, blindingFactor]);

        // Range [15, 30]
        const isValid = await verifier.verifyRangeProof(commitment, value, blindingFactor, 15, 30);
        expect(isValid).to.equal(true);

        // Out of range check
        await expect(verifier.verifyRangeProof(commitment, value, blindingFactor, 25, 40))
            .to.be.revertedWith("ERR: VALUE_OUT_OF_RANGE");
    });
});
