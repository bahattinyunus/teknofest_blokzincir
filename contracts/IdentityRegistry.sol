// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./common/Ownable.sol";
import "./common/Pausable.sol";
import "./common/AccessControl.sol";

/**
 * @title IdentityRegistry
 * @author Bahattin Yunus Çetin (IT Architect)
 * @notice Self-Sovereign Identity (SSI / DID) and Verifiable Credentials Registry for TEKNOFEST.
 * @dev Compliant with W3C Decentralized Identifiers (DIDs) v1.0 architecture.
 */
contract IdentityRegistry is Ownable, Pausable, AccessControl {

    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    enum IdentityStatus { Active, Suspended, Revoked }

    struct Identity {
        address controller;
        string didUri;           // e.g. "did:teknofest:2025:team-arch-001"
        bytes32 docHash;          // Hash of DID Document (containing public keys & service endpoints)
        uint256 createdAt;
        uint256 updatedAt;
        IdentityStatus status;
        bool exists;
    }

    struct VerifiableCredential {
        bytes32 credentialHash;   // Keccak-256 of canonical credential payload
        bytes32 schemaHash;       // Schema identifier (e.g. StudentCredential, TeamQualification)
        address issuer;
        uint256 issuedAt;
        uint256 expiresAt;
        bool revoked;
    }

    // DID => Identity
    mapping(bytes32 => Identity) private _identities;
    // Controller address => DID key
    mapping(address => bytes32) public primaryDID;
    // CredentialHash => VerifiableCredential
    mapping(bytes32 => VerifiableCredential) public credentials;
    // DID key => CredentialHash list
    mapping(bytes32 => bytes32[]) private _identityCredentials;

    uint256 public totalIdentities;
    uint256 public totalCredentials;

    // --- Events ---
    event DIDRegistered(bytes32 indexed didKey, address indexed controller, string didUri);
    event DIDUpdated(bytes32 indexed didKey, bytes32 newDocHash, address newController);
    event DIDStatusChanged(bytes32 indexed didKey, IdentityStatus status);
    event CredentialIssued(bytes32 indexed credHash, bytes32 indexed didKey, address indexed issuer, uint256 expiresAt);
    event CredentialRevoked(bytes32 indexed credHash, address indexed revoker, string reason);

    modifier onlyController(bytes32 didKey) {
        require(_identities[didKey].exists, "DID does not exist");
        require(_identities[didKey].controller == _msgSender(), "Caller is not DID controller");
        _;
    }

    constructor() Ownable(msg.sender) {
        _setRoleAdmin(ISSUER_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(VERIFIER_ROLE, DEFAULT_ADMIN_ROLE);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ISSUER_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
    }

    /**
     * @notice Register a new Decentralized Identifier (DID).
     * @param didUri The URI of the DID (e.g. "did:teknofest:team-01").
     * @param docHash The SHA/Keccak hash of the resolved DID Document.
     */
    function registerDID(string calldata didUri, bytes32 docHash) external whenNotPaused returns (bytes32) {
        bytes32 didKey = keccak256(abi.encodePacked(didUri));
        require(!_identities[didKey].exists, "DID already registered");
        require(primaryDID[_msgSender()] == bytes32(0), "Address already controls a DID");

        _identities[didKey] = Identity({
            controller: _msgSender(),
            didUri: didUri,
            docHash: docHash,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            status: IdentityStatus.Active,
            exists: true
        });

        primaryDID[_msgSender()] = didKey;
        totalIdentities++;

        emit DIDRegistered(didKey, _msgSender(), didUri);
        return didKey;
    }

    /**
     * @notice Update DID Document hash or transfer DID controller.
     */
    function updateDID(bytes32 didKey, bytes32 newDocHash, address newController) external onlyController(didKey) whenNotPaused {
        Identity storage id = _identities[didKey];
        if (newDocHash != bytes32(0)) {
            id.docHash = newDocHash;
        }
        if (newController != address(0) && newController != id.controller) {
            delete primaryDID[id.controller];
            id.controller = newController;
            primaryDID[newController] = didKey;
        }
        id.updatedAt = block.timestamp;

        emit DIDUpdated(didKey, newDocHash, newController);
    }

    /**
     * @notice Issue a Verifiable Credential to a registered DID.
     * @param didKey Target DID.
     * @param credHash Canonical hash of the credential claim.
     * @param schemaHash Hash describing the schema/type of credential.
     * @param validityDuration Seconds until credential expires (0 for permanent).
     */
    function issueCredential(
        bytes32 didKey,
        bytes32 credHash,
        bytes32 schemaHash,
        uint256 validityDuration
    ) external onlyRole(ISSUER_ROLE) whenNotPaused {
        require(_identities[didKey].exists, "Recipient DID does not exist");
        require(_identities[didKey].status == IdentityStatus.Active, "DID is not active");
        require(credentials[credHash].issuedAt == 0, "Credential already exists");

        uint256 expiresAt = validityDuration == 0 ? 0 : block.timestamp + validityDuration;

        credentials[credHash] = VerifiableCredential({
            credentialHash: credHash,
            schemaHash: schemaHash,
            issuer: _msgSender(),
            issuedAt: block.timestamp,
            expiresAt: expiresAt,
            revoked: false
        });

        _identityCredentials[didKey].push(credHash);
        totalCredentials++;

        emit CredentialIssued(credHash, didKey, _msgSender(), expiresAt);
    }

    /**
     * @notice Revoke an issued Verifiable Credential.
     */
    function revokeCredential(bytes32 credHash, string calldata reason) external whenNotPaused {
        VerifiableCredential storage vc = credentials[credHash];
        require(vc.issuedAt != 0, "Credential does not exist");
        require(vc.issuer == _msgSender() || hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "Unauthorized revoker");
        require(!vc.revoked, "Credential already revoked");

        vc.revoked = true;
        emit CredentialRevoked(credHash, _msgSender(), reason);
    }

    /**
     * @notice Set status of a DID (Active, Suspended, Revoked).
     */
    function setDIDStatus(bytes32 didKey, IdentityStatus status) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_identities[didKey].exists, "DID does not exist");
        _identities[didKey].status = status;
        emit DIDStatusChanged(didKey, status);
    }

    /**
     * @notice Verify whether a credential is valid, unrevoked, and unexpired.
     */
    function verifyCredential(bytes32 credHash) external view returns (bool isValid, address issuer, uint256 expiresAt) {
        VerifiableCredential memory vc = credentials[credHash];
        if (vc.issuedAt == 0 || vc.revoked) {
            return (false, address(0), 0);
        }
        if (vc.expiresAt > 0 && block.timestamp > vc.expiresAt) {
            return (false, vc.issuer, vc.expiresAt);
        }
        return (true, vc.issuer, vc.expiresAt);
    }

    /**
     * @notice Get DID details by DID key.
     */
    function getIdentity(bytes32 didKey) external view returns (Identity memory) {
        require(_identities[didKey].exists, "DID does not exist");
        return _identities[didKey];
    }

    /**
     * @notice Get all credentials issued to a DID.
     */
    function getIdentityCredentials(bytes32 didKey) external view returns (bytes32[] memory) {
        return _identityCredentials[didKey];
    }
}
