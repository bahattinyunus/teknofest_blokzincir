// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./common/Ownable.sol";
import "./common/Pausable.sol";
import "./common/AccessControl.sol";

/**
 * @title JuryScoringProtocol
 * @author Bahattin Yunus Çetin (IT Architect)
 * @notice Decentralized jury evaluation and anti-collusion scoring protocol for TEKNOFEST Blockchain competitions.
 * @dev Employs a cryptographic Commit-Reveal scheme to prevent front-running, score copying, and evaluator collusion.
 */
contract JuryScoringProtocol is Ownable, Pausable, AccessControl {

    bytes32 public constant JURY_ROLE = keccak256("JURY_ROLE");
    bytes32 public constant COORDINATOR_ROLE = keccak256("COORDINATOR_ROLE");

    enum EvaluationPhase { Inactive, Commit, Reveal, Finalized }

    struct Rubric {
        uint16 architecture;   // Max 25 (scaled by 100 => 2500)
        uint16 security;       // Max 25
        uint16 innovation;     // Max 25
        uint16 implementation; // Max 15
        uint16 presentation;   // Max 10
    } // Total max = 10000 (100.00%)

    struct Commitment {
        bytes32 commitHash;
        uint256 committedAt;
        bool revealed;
    }

    struct TeamEvaluation {
        uint256 teamId;
        string teamName;
        string projectTitle;
        uint256 totalCommittedJuries;
        uint256 totalRevealedJuries;
        uint256 aggregateScore; // Sum of revealed scores
        uint256 finalWeightedScore; // Normalized out of 10000
        bool finalized;
        bool certified;
    }

    // teamId => TeamEvaluation
    mapping(uint256 => TeamEvaluation) public teams;
    // teamId => juryAddress => Commitment
    mapping(uint256 => mapping(address => Commitment)) public commitments;
    // teamId => list of revealed scores
    mapping(uint256 => uint256[]) private _teamScoreList;
    // Authorized Jury registry
    mapping(address => bool) public isJury;

    uint256 public totalTeams;
    EvaluationPhase public currentPhase;

    // --- Events ---
    event PhaseChanged(EvaluationPhase newPhase, uint256 timestamp);
    event TeamRegistered(uint256 indexed teamId, string teamName, string projectTitle);
    event ScoreCommitted(uint256 indexed teamId, address indexed jury, bytes32 commitHash);
    event ScoreRevealed(uint256 indexed teamId, address indexed jury, uint256 calculatedScore);
    event EvaluationFinalized(uint256 indexed teamId, uint256 finalScore, uint256 juryCount);
    event TeamCertified(uint256 indexed teamId, string awardRank);

    constructor() Ownable(msg.sender) {
        _setRoleAdmin(JURY_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(COORDINATOR_ROLE, DEFAULT_ADMIN_ROLE);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(COORDINATOR_ROLE, msg.sender);
        _grantRole(JURY_ROLE, msg.sender);
        isJury[msg.sender] = true;

        currentPhase = EvaluationPhase.Inactive;
    }

    /**
     * @notice Register a new finalist team for evaluation.
     */
    function registerTeam(string calldata _teamName, string calldata _projectTitle) external onlyRole(COORDINATOR_ROLE) returns (uint256) {
        uint256 teamId = ++totalTeams;
        teams[teamId] = TeamEvaluation({
            teamId: teamId,
            teamName: _teamName,
            projectTitle: _projectTitle,
            totalCommittedJuries: 0,
            totalRevealedJuries: 0,
            aggregateScore: 0,
            finalWeightedScore: 0,
            finalized: false,
            certified: false
        });

        emit TeamRegistered(teamId, _teamName, _projectTitle);
        return teamId;
    }

    /**
     * @notice Set competition evaluation phase (Commit, Reveal, Finalized).
     */
    function setPhase(EvaluationPhase _phase) external onlyRole(COORDINATOR_ROLE) {
        currentPhase = _phase;
        emit PhaseChanged(_phase, block.timestamp);
    }

    /**
     * @notice Add or remove an accredited jury evaluator.
     */
    function setJuryMember(address _jury, bool _status) external onlyRole(DEFAULT_ADMIN_ROLE) {
        isJury[_jury] = _status;
        if (_status) {
            _grantRole(JURY_ROLE, _jury);
        } else {
            _revokeRole(JURY_ROLE, _jury);
        }
    }

    /**
     * @notice Commit an encrypted score during the Commit Phase.
     * @param _teamId ID of target team
     * @param _commitHash keccak256(abi.encodePacked(_teamId, scores, salt, msg.sender))
     */
    function commitScore(uint256 _teamId, bytes32 _commitHash) external onlyRole(JURY_ROLE) whenNotPaused {
        require(currentPhase == EvaluationPhase.Commit, "ERR: NOT_IN_COMMIT_PHASE");
        require(_teamId > 0 && _teamId <= totalTeams, "ERR: INVALID_TEAM_ID");
        require(commitments[_teamId][_msgSender()].committedAt == 0, "ERR: SCORE_ALREADY_COMMITTED");

        commitments[_teamId][_msgSender()] = Commitment({
            commitHash: _commitHash,
            committedAt: block.timestamp,
            revealed: false
        });

        teams[_teamId].totalCommittedJuries++;
        emit ScoreCommitted(_teamId, _msgSender(), _commitHash);
    }

    /**
     * @notice Reveal the committed rubric grade during the Reveal Phase.
     * @param _teamId ID of target team
     * @param _rubric Breakdown of rubric scores
     * @param _salt Secret salt used during commit
     */
    function revealScore(
        uint256 _teamId,
        Rubric calldata _rubric,
        bytes32 _salt
    ) external onlyRole(JURY_ROLE) whenNotPaused {
        require(currentPhase == EvaluationPhase.Reveal, "ERR: NOT_IN_REVEAL_PHASE");
        Commitment storage c = commitments[_teamId][_msgSender()];
        require(c.committedAt > 0, "ERR: NO_COMMITMENT_FOUND");
        require(!c.revealed, "ERR: SCORE_ALREADY_REVEALED");

        // Validate rubric ranges
        require(_rubric.architecture <= 2500, "ERR: ARCH_SCORE_OVERFLOW");
        require(_rubric.security <= 2500, "ERR: SEC_SCORE_OVERFLOW");
        require(_rubric.innovation <= 2500, "ERR: INNOV_SCORE_OVERFLOW");
        require(_rubric.implementation <= 1500, "ERR: IMPL_SCORE_OVERFLOW");
        require(_rubric.presentation <= 1000, "ERR: PRES_SCORE_OVERFLOW");

        uint256 totalRubricScore = uint256(_rubric.architecture) +
            uint256(_rubric.security) +
            uint256(_rubric.innovation) +
            uint256(_rubric.implementation) +
            uint256(_rubric.presentation);

        // Verify cryptographic hash integrity
        bytes32 expectedHash = keccak256(abi.encodePacked(
            _teamId,
            _rubric.architecture,
            _rubric.security,
            _rubric.innovation,
            _rubric.implementation,
            _rubric.presentation,
            _salt,
            _msgSender()
        ));

        require(c.commitHash == expectedHash, "ERR: COMMIT_HASH_MISMATCH");

        c.revealed = true;
        teams[_teamId].totalRevealedJuries++;
        teams[_teamId].aggregateScore += totalRubricScore;
        _teamScoreList[_teamId].push(totalRubricScore);

        emit ScoreRevealed(_teamId, _msgSender(), totalRubricScore);
    }

    /**
     * @notice Finalize team evaluation and compute consensus score.
     * @param _teamId ID of target team
     */
    function finalizeEvaluation(uint256 _teamId) external onlyRole(COORDINATOR_ROLE) whenNotPaused {
        TeamEvaluation storage team = teams[_teamId];
        require(!team.finalized, "ERR: ALREADY_FINALIZED");
        require(team.totalRevealedJuries > 0, "ERR: NO_REVEALED_JURY_SCORES");

        uint256 count = team.totalRevealedJuries;
        uint256 finalAvg = team.aggregateScore / count;
        team.finalWeightedScore = finalAvg;
        team.finalized = true;

        emit EvaluationFinalized(_teamId, finalAvg, count);
    }

    /**
     * @notice Award official TEKNOFEST achievement certification on-chain.
     */
    function certifyTeam(uint256 _teamId, string calldata _awardRank) external onlyRole(COORDINATOR_ROLE) {
        TeamEvaluation storage team = teams[_teamId];
        require(team.finalized, "ERR: EVALUATION_NOT_FINALIZED");
        team.certified = true;

        emit TeamCertified(_teamId, _awardRank);
    }

    // --- View Functions ---

    function getTeamScores(uint256 _teamId) external view returns (uint256[] memory) {
        return _teamScoreList[_teamId];
    }

    function getTeam(uint256 _teamId) external view returns (TeamEvaluation memory) {
        return teams[_teamId];
    }
}
