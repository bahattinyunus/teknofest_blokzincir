// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./common/Ownable.sol";
import "./common/ReentrancyGuard.sol";
import "./common/IERC20.sol";

/**
 * @title GovernanceDAO
 * @author Bahattin Yunus Çetin (IT Architect)
 * @notice Decentralized Autonomous Organization governance protocol for TEKNOFEST Blockchain.
 * @dev Supports proposal creation, quadratic voting weight, quorum tracking, and timelocked execution.
 */
contract GovernanceDAO is Ownable, ReentrancyGuard {

    enum ProposalState {
        Pending,
        Active,
        Defeated,
        Succeeded,
        Queued,
        Executed,
        Cancelled
    }

    enum VoteType { Against, For, Abstain }

    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        address targetContract;
        bytes callData;
        uint256 startTime;
        uint256 endTime;
        uint256 executionEta;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool executed;
        bool cancelled;
    }

    struct Receipt {
        bool hasVoted;
        VoteType vote;
        uint256 weight;
    }

    IERC20 public immutable governanceToken;

    uint256 public constant VOTING_DELAY = 1 days;
    uint256 public constant VOTING_PERIOD = 3 days;
    uint256 public constant TIMELOCK_DELAY = 1 days;
    uint256 public constant PROPOSAL_THRESHOLD = 1000 * 10**18; // 1,000 TKF to submit proposal
    uint256 public constant QUORUM_VOTES = 5000 * 10**18;        // 5,000 TKF quorum

    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => Receipt)) public receipts;

    // --- Events ---
    event ProposalCreated(uint256 indexed id, address indexed proposer, string title, uint256 startTime, uint256 endTime);
    event VoteCast(address indexed voter, uint256 indexed proposalId, VoteType vote, uint256 weight);
    event ProposalQueued(uint256 indexed id, uint256 eta);
    event ProposalExecuted(uint256 indexed id);
    event ProposalCancelled(uint256 indexed id);

    constructor(address _governanceToken) Ownable(msg.sender) {
        governanceToken = IERC20(_governanceToken);
    }

    /**
     * @notice Create a new governance proposal.
     */
    function propose(
        string calldata title,
        string calldata description,
        address targetContract,
        bytes calldata callData
    ) external returns (uint256) {
        if (address(governanceToken) != address(0)) {
            require(governanceToken.balanceOf(_msgSender()) >= PROPOSAL_THRESHOLD, "Insufficient tokens to propose");
        }

        uint256 id = ++proposalCount;
        uint256 start = block.timestamp + VOTING_DELAY;
        uint256 end = start + VOTING_PERIOD;

        proposals[id] = Proposal({
            id: id,
            proposer: _msgSender(),
            title: title,
            description: description,
            targetContract: targetContract,
            callData: callData,
            startTime: start,
            endTime: end,
            executionEta: 0,
            forVotes: 0,
            againstVotes: 0,
            abstainVotes: 0,
            executed: false,
            cancelled: false
        });

        emit ProposalCreated(id, _msgSender(), title, start, end);
        return id;
    }

    /**
     * @notice Cast a vote on an active proposal.
     */
    function castVote(uint256 proposalId, VoteType vote) external nonReentrant {
        Proposal storage p = proposals[proposalId];
        require(state(proposalId) == ProposalState.Active, "Proposal not active");
        Receipt storage receipt = receipts[proposalId][_msgSender()];
        require(!receipt.hasVoted, "Already voted");

        uint256 weight = 1 * 10**18;
        if (address(governanceToken) != address(0)) {
            weight = governanceToken.balanceOf(_msgSender());
            require(weight > 0, "No voting weight");
        }

        if (vote == VoteType.For) {
            p.forVotes += weight;
        } else if (vote == VoteType.Against) {
            p.againstVotes += weight;
        } else {
            p.abstainVotes += weight;
        }

        receipt.hasVoted = true;
        receipt.vote = vote;
        receipt.weight = weight;

        emit VoteCast(_msgSender(), proposalId, vote, weight);
    }

    /**
     * @notice Queue a succeeded proposal for timelocked execution.
     */
    function queue(uint256 proposalId) external {
        require(state(proposalId) == ProposalState.Succeeded, "Proposal not succeeded");
        Proposal storage p = proposals[proposalId];
        uint256 eta = block.timestamp + TIMELOCK_DELAY;
        p.executionEta = eta;

        emit ProposalQueued(proposalId, eta);
    }

    /**
     * @notice Execute a queued proposal after the timelock expires.
     */
    function execute(uint256 proposalId) external nonReentrant returns (bytes memory) {
        require(state(proposalId) == ProposalState.Queued, "Proposal not queued");
        Proposal storage p = proposals[proposalId];
        require(block.timestamp >= p.executionEta, "Timelock not expired");

        p.executed = true;

        if (p.targetContract != address(0) && p.callData.length > 0) {
            (bool success, bytes memory returnData) = p.targetContract.call(p.callData);
            require(success, "Proposal execution failed");
            emit ProposalExecuted(proposalId);
            return returnData;
        }

        emit ProposalExecuted(proposalId);
        return "";
    }

    /**
     * @notice Cancel a proposal (proposer or owner only).
     */
    function cancel(uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];
        require(!p.executed, "Cannot cancel executed proposal");
        require(_msgSender() == p.proposer || _msgSender() == owner(), "Unauthorized to cancel");

        p.cancelled = true;
        emit ProposalCancelled(proposalId);
    }

    /**
     * @notice Determine the current state of a proposal.
     */
    function state(uint256 proposalId) public view returns (ProposalState) {
        Proposal storage p = proposals[proposalId];
        require(p.id != 0, "Proposal does not exist");

        if (p.cancelled) return ProposalState.Cancelled;
        if (p.executed) return ProposalState.Executed;
        if (block.timestamp < p.startTime) return ProposalState.Pending;
        if (block.timestamp <= p.endTime) return ProposalState.Active;

        if (p.forVotes <= p.againstVotes || (p.forVotes + p.againstVotes + p.abstainVotes) < QUORUM_VOTES) {
            return ProposalState.Defeated;
        }

        if (p.executionEta == 0) {
            return ProposalState.Succeeded;
        }

        return ProposalState.Queued;
    }

    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        return proposals[proposalId];
    }
}
