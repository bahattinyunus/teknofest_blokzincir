const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("IdentityRegistry (DID / SSI)", function () {
    let Registry;
    let registry;
    let owner;
    let issuer;
    let student;

    beforeEach(async function () {
        Registry = await ethers.getContractFactory("IdentityRegistry");
        [owner, issuer, student] = await ethers.getSigners();
        registry = await Registry.deploy();
        if (registry.deployed) {
            await registry.deployed();
        } else if (registry.waitForDeployment) {
            await registry.waitForDeployment();
        }

        const ISSUER_ROLE = await registry.ISSUER_ROLE();
        await registry.grantRole(ISSUER_ROLE, issuer.address);
    });

    it("Should allow participant to register a DID", async function () {
        const didUri = "did:teknofest:2025:student:bahattinyunus";
        const docHash = ethers.utils ? ethers.utils.id("DID_DOC_METADATA") : ethers.id("DID_DOC_METADATA");

        await expect(registry.connect(student).registerDID(didUri, docHash))
            .to.emit(registry, "DIDRegistered");

        expect(await registry.totalIdentities()).to.equal(1);
    });

    it("Should allow issuer to issue a verifiable credential", async function () {
        const didUri = "did:teknofest:2025:student:bahattinyunus";
        const docHash = ethers.utils ? ethers.utils.id("DID_DOC_METADATA") : ethers.id("DID_DOC_METADATA");
        await registry.connect(student).registerDID(didUri, docHash);

        const didKey = ethers.utils 
            ? ethers.utils.solidityKeccak256(["string"], [didUri])
            : ethers.solidityPackedKeccak256(["string"], [didUri]);

        const credHash = ethers.utils ? ethers.utils.id("CREDENTIAL_PAYLOAD") : ethers.id("CREDENTIAL_PAYLOAD");
        const schemaHash = ethers.utils ? ethers.utils.id("StudentSchema") : ethers.id("StudentSchema");

        await expect(registry.connect(issuer).issueCredential(didKey, credHash, schemaHash, 3600))
            .to.emit(registry, "CredentialIssued");

        const [isValid] = await registry.verifyCredential(credHash);
        expect(isValid).to.equal(true);
    });

    it("Should allow issuer to revoke a credential", async function () {
        const didUri = "did:teknofest:2025:team:alpha";
        const docHash = ethers.utils ? ethers.utils.id("DOC") : ethers.id("DOC");
        await registry.connect(student).registerDID(didUri, docHash);

        const didKey = ethers.utils 
            ? ethers.utils.solidityKeccak256(["string"], [didUri])
            : ethers.solidityPackedKeccak256(["string"], [didUri]);

        const credHash = ethers.utils ? ethers.utils.id("CRED_REVOKE") : ethers.id("CRED_REVOKE");
        const schemaHash = ethers.utils ? ethers.utils.id("Schema") : ethers.id("Schema");

        await registry.connect(issuer).issueCredential(didKey, credHash, schemaHash, 0);
        await registry.connect(issuer).revokeCredential(credHash, "Disqualified");

        const [isValid] = await registry.verifyCredential(credHash);
        expect(isValid).to.equal(false);
    });
});
