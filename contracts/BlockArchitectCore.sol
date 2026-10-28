// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./common/Ownable.sol";
import "./common/Pausable.sol";
import "./common/ReentrancyGuard.sol";
import "./common/AccessControl.sol";

/**
 * @title BlockArchitectCore
 * @author Bahattin Yunus Çetin (IT Architect)
 * @notice Enterprise-grade Smart Contract structure for TEKNOFEST 2025/2026 Blockchain Competition.
 * @dev Implements zero-trust role-based access control, batched execution, immutable audit trails, and circuit breakers.
 */
contract BlockArchitectCore is Ownable, Pausable, ReentrancyGuard, AccessControl {

    // --- Role Definitions ---
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");

    // --- Data Structures ---
    enum OperationStatus { Submitted, Verified, Audited, Revoked }

    struct Operation {
        bytes32 dataHash;
        uint256 timestamp;
        address initiator;
        bool verified;
        OperationStatus status;
        bytes32 metadataTag; // Category tag (e.g. "DID", "SUPPLY_CHAIN", "GOVERNANCE")
    }

    struct NodeInfo {
        bool authorized;
        uint256 registeredAt;
        uint256 totalProcessed;
        string endpointUri;
    }

    // --- State Variables ---
    uint256 public totalOperations;
    uint256 public totalBatches;
    bool public systemActive;

    mapping(uint256 => Operation) public operations;
    mapping(address => bool) public authorizedNodes;
    mapping(address => NodeInfo) public nodeRegistry;
    mapping(bytes32 => bool) public processedHashes;

    // --- Events ---
    event SystemStatusChanged(bool indexed newState, uint256 timestamp);
    event OperationExecuted(uint256 indexed opId, bytes32 indexed dataHash, address indexed initiator);
    event BatchExecuted(uint256 indexed batchId, uint256 count, address indexed initiator);
    event OperationAudited(uint256 indexed opId, address indexed auditor, bool approved, string remarks);
    event NodeAuthorized(address indexed node, bool status);
    event NodeRegistered(address indexed node, string endpointUri, uint256 timestamp);

    // --- Modifiers ---
    modifier onlyAuthorized() {
        require(
            authorizedNodes[_msgSender()] || 
            hasRole(OPERATOR_ROLE, _msgSender()) || 
            _msgSender() == owner(), 
            "ERR: NODE_NOT_AUTHORIZED"
        );
        _;
    }

    modifier whenActive() {
        require(systemActive && !paused(), "ERR: SYSTEM_OFFLINE");
        _;
    }

    // --- Constructor ---
    constructor() Ownable(msg.sender) {
        systemActive = true;
        authorizedNodes[msg.sender] = true;

        // Set up roles
        _setRoleAdmin(ADMIN_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(OPERATOR_ROLE, ADMIN_ROLE);
        _setRoleAdmin(AUDITOR_ROLE, ADMIN_ROLE);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        _grantRole(AUDITOR_ROLE, msg.sender);

        nodeRegistry[msg.sender] = NodeInfo({
            authorized: true,
            registeredAt: block.timestamp,
            totalProcessed: 0,
            endpointUri: "node://genesis.teknofest.local"
        });

        emit SystemStatusChanged(true, block.timestamp);
    }

    // --- External Functions ---

    /**
     * @notice Execute a tactical blockchain operation.
     * @param _dataHash Hash of the operation data for integrity verification.
     */
    function executeOperation(bytes32 _dataHash) external onlyAuthorized whenActive nonReentrant returns (uint256) {
        return _executeSingle(_dataHash, bytes32("DEFAULT"));
    }

    /**
     * @notice Execute a tagged operation with category metadata.
     * @param _dataHash Hash of the payload.
     * @param _metadataTag Tag representing business domain (e.g., keccak256("DID")).
     */
    function executeTaggedOperation(bytes32 _dataHash, bytes32 _metadataTag) external onlyAuthorized whenActive nonReentrant returns (uint256) {
        return _executeSingle(_dataHash, _metadataTag);
    }

    /**
     * @notice Execute multiple operations in a single gas-efficient batch.
     * @param _dataHashes Array of hashes to commit.
     * @param _metadataTag Tag for the batch.
     */
    function executeBatchOperations(bytes32[] calldata _dataHashes, bytes32 _metadataTag) external onlyAuthorized whenActive nonReentrant returns (uint256) {
        require(_dataHashes.length > 0, "ERR: EMPTY_BATCH");
        require(_dataHashes.length <= 100, "ERR: BATCH_EXCEEDS_LIMIT");

        uint256 startId = totalOperations;
        for (uint256 i = 0; i < _dataHashes.length; i++) {
            _executeSingle(_dataHashes[i], _metadataTag);
        }

        uint256 batchId = totalBatches++;
        emit BatchExecuted(batchId, _dataHashes.length, _msgSender());
        return batchId;
    }

    /**
     * @notice Audit an operation by an accredited auditor node.
     * @param _opId Operation ID to audit.
     * @param _approved Whether the audit passes.
     * @param _remarks Auditor comments or verification proof hash.
     */
    function auditOperation(uint256 _opId, bool _approved, string calldata _remarks) external onlyRole(AUDITOR_ROLE) {
        require(_opId < totalOperations, "ERR: OP_DOES_NOT_EXIST");
        Operation storage op = operations[_opId];

        if (_approved) {
            op.status = OperationStatus.Audited;
        } else {
            op.status = OperationStatus.Revoked;
            op.verified = false;
        }

        emit OperationAudited(_opId, _msgSender(), _approved, _remarks);
    }

    /**
     * @notice Toggle system status (on/off).
     */
    function toggleSystem(bool _status) external onlyOwner {
        systemActive = _status;
        if (!_status) {
            if (!paused()) _pause();
        } else {
            if (paused()) _unpause();
        }
        emit SystemStatusChanged(_status, block.timestamp);
    }

    /**
     * @notice Emergency circuit breaker pause.
     */
    function emergencyPause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Resume system after emergency pause.
     */
    function emergencyResume() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @notice Authorize or revoke a node's operational clearance.
     */
    function setNodeStatus(address _node, bool _status) external onlyOwner {
        authorizedNodes[_node] = _status;
        nodeRegistry[_node].authorized = _status;
        if (_status && nodeRegistry[_node].registeredAt == 0) {
            nodeRegistry[_node].registeredAt = block.timestamp;
        }
        emit NodeAuthorized(_node, _status);
    }

    /**
     * @notice Register a node with full metadata.
     */
    function registerNode(address _node, string calldata _endpointUri) external onlyRole(ADMIN_ROLE) {
        require(_node != address(0), "ERR: ZERO_ADDRESS");
        authorizedNodes[_node] = true;
        nodeRegistry[_node] = NodeInfo({
            authorized: true,
            registeredAt: block.timestamp,
            totalProcessed: 0,
            endpointUri: _endpointUri
        });

        emit NodeAuthorized(_node, true);
        emit NodeRegistered(_node, _endpointUri, block.timestamp);
    }

    // --- View Functions ---

    function getOperationDetails(uint256 _opId) external view returns (Operation memory) {
        return operations[_opId];
    }

    function isOperationVerified(uint256 _opId) external view returns (bool) {
        return operations[_opId].verified;
    }

    function getNodeInfo(address _node) external view returns (NodeInfo memory) {
        return nodeRegistry[_node];
    }

    // --- Internal Helpers ---

    function _executeSingle(bytes32 _dataHash, bytes32 _metadataTag) internal returns (uint256) {
        require(_dataHash != bytes32(0), "ERR: INVALID_HASH");
        require(!processedHashes[_dataHash], "ERR: DUPLICATE_HASH");

        uint256 opId = totalOperations++;
        operations[opId] = Operation({
            dataHash: _dataHash,
            timestamp: block.timestamp,
            initiator: _msgSender(),
            verified: true,
            status: OperationStatus.Submitted,
            metadataTag: _metadataTag
        });

        processedHashes[_dataHash] = true;
        nodeRegistry[_msgSender()].totalProcessed++;

        emit OperationExecuted(opId, _dataHash, _msgSender());
        return opId;
    }
}
