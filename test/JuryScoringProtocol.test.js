const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("JuryScoringProtocol (Anti-Collusion Commit-Reveal)", function () {
    let Protocol;
    let protocol;
    let owner;
    let coordinator;
    let jury1;
    let jury2;

    beforeEach(async function () {
        Protocol = await ethers.getContractFactory("JuryScoringProtocol");
        [owner, coordinator, jury1, jury2] = await ethers.getSigners();
        protocol = await Protocol.deploy();
        if (protocol.deployed) {
            await protocol.deployed();
        } else if (protocol.waitForDeployment) {
            await protocol.waitForDeployment();
        }

        const COORDINATOR_ROLE = await protocol.COORDINATOR_ROLE();
        await protocol.grantRole(COORDINATOR_ROLE, coordinator.address);

        await protocol.setJuryMember(jury1.address, true);
        await protocol.setJuryMember(jury2.address, true);
    });

    it("Should register a finalist team and transition phases", async function () {
        await protocol.connect(coordinator).registerTeam("Cezeri Mimarlık", "Blokzincir Aviyonik Güvenlik");
        expect(await protocol.totalTeams()).to.equal(1);

        // Transition to Commit phase (Enum index 1)
        await protocol.connect(coordinator).setPhase(1);
        expect(await protocol.currentPhase()).to.equal(1);
    });

    it("Should execute commit and reveal flow for jury scoring", async function () {
        await protocol.connect(coordinator).registerTeam("Alpha Team", "DID Identity System");
        await protocol.connect(coordinator).setPhase(1); // Commit phase

        const rubric = {
            architecture: 2500,
            security: 2400,
            innovation: 2450,
            implementation: 1450,
            presentation: 950
        };
        const salt = ethers.utils ? ethers.utils.id("JurySecretSalt") : ethers.id("JurySecretSalt");

        const commitHash = ethers.utils 
            ? ethers.utils.solidityKeccak256(
                ["uint256", "uint16", "uint16", "uint16", "uint16", "uint16", "bytes32", "address"],
                [1, rubric.architecture, rubric.security, rubric.innovation, rubric.implementation, rubric.presentation, salt, jury1.address]
              )
            : ethers.solidityPackedKeccak256(
                ["uint256", "uint16", "uint16", "uint16", "uint16", "uint16", "bytes32", "address"],
                [1, rubric.architecture, rubric.security, rubric.innovation, rubric.implementation, rubric.presentation, salt, jury1.address]
              );

        // Commit score
        await expect(protocol.connect(jury1).commitScore(1, commitHash))
            .to.emit(protocol, "ScoreCommitted")
            .withArgs(1, jury1.address, commitHash);

        // Transition to Reveal phase (Enum index 2)
        await protocol.connect(coordinator).setPhase(2);

        // Reveal score
        await expect(protocol.connect(jury1).revealScore(1, rubric, salt))
            .to.emit(protocol, "ScoreRevealed")
            .withArgs(1, jury1.address, 9750); // Total sum

        // Finalize evaluation
        await expect(protocol.connect(coordinator).finalizeEvaluation(1))
            .to.emit(protocol, "EvaluationFinalized");

        const team = await protocol.getTeam(1);
        expect(team.finalized).to.equal(true);
        expect(team.finalWeightedScore).to.equal(9750);
    });
});
