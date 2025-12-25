// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title BlockArchitectCore
 * @author Bahattin Yunus Çetin (IT Architect)
 * @notice Enterprise-grade Smart Contract structure for TEKNOFEST 2025.
 * @dev Implements custom access control, event logging, and state management.
 */
contract BlockArchitectCore {
    
    // --- State Variables ---
    address public immutable owner;
    bool public systemActive;
    uint256 public totalOperations;

    struct Operation {
        bytes32 dataHash;
        uint256 timestamp;
        address initiator;
        bool verified;
    }

    mapping(uint256 => Operation) public operations;
    mapping(address => bool) public authorizedNodes;

    // --- Events ---
    event SystemStatusChanged(bool indexed newState, uint256 timestamp);
    event OperationExecuted(uint256 indexed opId, bytes32 indexed dataHash, address initiator);
    event NodeAuthorized(address indexed node, bool status);

    // --- Modifiers ---
    modifier onlyOwner() {
        require(msg.sender == owner, "ERR: UNAUTHORIZED_ACCESS");
        _;
    }

    modifier onlyAuthorized() {
        require(authorizedNodes[msg.sender] || msg.sender == owner, "ERR: NODE_NOT_AUTHORIZED");
        _;
    }

    modifier whenActive() {
        require(systemActive, "ERR: SYSTEM_OFFLINE");
        _;
    }

    // --- Constructor ---
    constructor() {
        owner = msg.sender;
        systemActive = true;
        authorizedNodes[msg.sender] = true;
        emit SystemStatusChanged(true, block.timestamp);
    }

    // --- External Functions ---

    /**
     * @notice Execute a tactical blockchain operation.
     * @param _dataHash Hash of the operation data for integrity verification.
     */
    function executeOperation(bytes32 _dataHash) external onlyAuthorized whenActive {
        uint256 opId = totalOperations++;
        operations[opId] = Operation({
            dataHash: _dataHash,
            timestamp: block.timestamp,
            initiator: msg.sender,
            verified: true
        });

        emit OperationExecuted(opId, _dataHash, msg.sender);
    }

    /**
     * @notice Update system activity status.
     */
    function toggleSystem(bool _status) external onlyOwner {
        systemActive = _status;
        emit SystemStatusChanged(_status, block.timestamp);
    }

    /**
     * @notice Authorize or revoke a node's operational clearance.
     */
    function setNodeStatus(address _node, bool _status) external onlyOwner {
        authorizedNodes[_node] = _status;
        emit NodeAuthorized(_node, _status);
    }

    // --- View Functions ---

    function getOperationDetails(uint256 _opId) external view returns (Operation memory) {
        return operations[_opId];
    }
}
