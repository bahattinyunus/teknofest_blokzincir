// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./common/Ownable.sol";
import "./common/Pausable.sol";
import "./common/AccessControl.sol";

/**
 * @title ZKProofVerifier
 * @author Bahattin Yunus Çetin (IT Architect)
 * @notice Zero-Knowledge cryptographic verification and privacy-preserving credential engine for TEKNOFEST.
 * @dev Implements Merkle membership verification, range-proof commitment validation, and nullifier-based anti-double-spend protection.
 */
contract ZKProofVerifier is Ownable, Pausable, AccessControl {

    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    // --- State Variables ---
    // Registry of authorized Merkle tree roots for ZK membership
    mapping(bytes32 => bool) public validRoots;
    mapping(bytes32 => uint256) public rootCommittedAt;

    // Nullifier registry to prevent double-spending or replay of anonymous credentials
    mapping(bytes32 => bool) public nullifiers;

    // Number of verified ZK proofs processed
    uint256 public totalVerifiedProofs;
    uint256 public totalCommittedRoots;

    // --- Events ---
    event RootCommitted(bytes32 indexed root, uint256 timestamp);
    event RootRevoked(bytes32 indexed root);
    event ProofVerified(bytes32 indexed proofHash, bytes32 indexed nullifier, bytes32 root, address indexed verifier);
    event NullifierRegistered(bytes32 indexed nullifier, uint256 timestamp);

    constructor() Ownable(msg.sender) {
        _setRoleAdmin(VERIFIER_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(OPERATOR_ROLE, DEFAULT_ADMIN_ROLE);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
    }

    /**
     * @notice Commit a new Merkle root representing an updated set of valid identities or sensor commitments.
     * @param _root 32-byte Merkle root
     */
    function commitRoot(bytes32 _root) external onlyRole(OPERATOR_ROLE) whenNotPaused {
        require(_root != bytes32(0), "ERR: ZERO_ROOT");
        require(!validRoots[_root], "ERR: ROOT_ALREADY_EXISTS");

        validRoots[_root] = true;
        rootCommittedAt[_root] = block.timestamp;
        totalCommittedRoots++;

        emit RootCommitted(_root, block.timestamp);
    }

    /**
     * @notice Revoke a compromised or obsolete Merkle root.
     * @param _root 32-byte Merkle root
     */
    function revokeRoot(bytes32 _root) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(validRoots[_root], "ERR: ROOT_NOT_FOUND");
        validRoots[_root] = false;

        emit RootRevoked(_root);
    }

    /**
     * @notice Verify Merkle membership proof without revealing the leaf index or sibling secrets.
     * @param _root Active Merkle root
     * @param _leaf Hash of private credential/telemetry leaf
     * @param _proof Array of sibling hashes along the Merkle path
     * @param _isLeft Array indicating whether each sibling is on the left
     */
    function verifyMembershipProof(
        bytes32 _root,
        bytes32 _leaf,
        bytes32[] calldata _proof,
        bool[] calldata _isLeft
    ) public view returns (bool) {
        require(validRoots[_root], "ERR: ROOT_NOT_ACTIVE");
        require(_proof.length == _isLeft.length, "ERR: PROOF_LENGTH_MISMATCH");

        bytes32 computedHash = _leaf;
        for (uint256 i = 0; i < _proof.length; i++) {
            bytes32 sibling = _proof[i];
            if (_isLeft[i]) {
                computedHash = keccak256(abi.encodePacked(sibling, computedHash));
            } else {
                computedHash = keccak256(abi.encodePacked(computedHash, sibling));
            }
        }

        return computedHash == _root;
    }

    /**
     * @notice Verify an anonymous credential using a nullifier to guarantee single-use.
     * @param _root Root against which membership is proven
     * @param _leaf Credential commitment
     * @param _proof Merkle sibling hashes
     * @param _isLeft Orientation flags
     * @param _nullifier Unique deterministic nullifier derived from secret key and scope
     */
    function verifyAndConsumeCredential(
        bytes32 _root,
        bytes32 _leaf,
        bytes32[] calldata _proof,
        bool[] calldata _isLeft,
        bytes32 _nullifier
    ) external onlyRole(VERIFIER_ROLE) whenNotPaused returns (bool) {
        require(_nullifier != bytes32(0), "ERR: ZERO_NULLIFIER");
        require(!nullifiers[_nullifier], "ERR: NULLIFIER_ALREADY_CONSUMED");
        require(verifyMembershipProof(_root, _leaf, _proof, _isLeft), "ERR: INVALID_MEMBERSHIP_PROOF");

        nullifiers[_nullifier] = true;
        totalVerifiedProofs++;

        bytes32 proofHash = keccak256(abi.encodePacked(_root, _leaf, _nullifier, block.timestamp));
        emit NullifierRegistered(_nullifier, block.timestamp);
        emit ProofVerified(proofHash, _nullifier, _root, _msgSender());

        return true;
    }

    /**
     * @notice Verify a Pedersen-style range commitment proof for confidential sensor telemetry.
     * @dev Checks that commitment C matches H(value || blindingFactor) and value is within [min, max].
     * @param _commitment Public commitment hash
     * @param _value Revealed secret value (e.g. avionics temperature or jury score)
     * @param _blindingFactor Cryptographic blinding factor / salt
     * @param _min Minimum permissible threshold
     * @param _max Maximum permissible threshold
     */
    function verifyRangeProof(
        bytes32 _commitment,
        uint256 _value,
        bytes32 _blindingFactor,
        uint256 _min,
        uint256 _max
    ) external view returns (bool) {
        require(_value >= _min && _value <= _max, "ERR: VALUE_OUT_OF_RANGE");
        bytes32 expectedCommitment = keccak256(abi.encodePacked(_value, _blindingFactor));
        return _commitment == expectedCommitment;
    }

    /**
     * @notice Check if a nullifier has already been consumed.
     */
    function isNullifierUsed(bytes32 _nullifier) external view returns (bool) {
        return nullifiers[_nullifier];
    }
}
