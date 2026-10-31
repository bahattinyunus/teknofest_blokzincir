// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./common/Ownable.sol";
import "./common/Pausable.sol";
import "./common/ReentrancyGuard.sol";
import "./common/AccessControl.sol";

/**
 * @title CrossChainBridgeAnchor
 * @author Bahattin Yunus Çetin (IT Architect)
 * @notice Cross-Chain State Relay & Layer-2 Interoperability Anchor for TEKNOFEST Blockchain.
 * @dev Enables trust-minimized state synchronization between local TEKNOFEST subnets and EVM mainnets.
 */
contract CrossChainBridgeAnchor is Ownable, Pausable, ReentrancyGuard, AccessControl {

    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");
    bytes32 public constant BRIDGE_ADMIN_ROLE = keccak256("BRIDGE_ADMIN_ROLE");

    struct CrossChainMessage {
        uint256 nonce;
        uint256 sourceChainId;
        uint256 destinationChainId;
        address sender;
        address targetContract;
        bytes payload;
        bytes32 payloadHash;
        uint256 timestamp;
    }

    uint256 public immutable currentChainId;
    uint256 public outboundNonce;
    uint256 public requiredRelayerThreshold;

    // sourceChainId => nonce => processed
    mapping(uint256 => mapping(uint256 => bool)) public processedInboundNonces;
    // relayer address => isActive
    mapping(address => bool) public isRelayer;
    uint256 public totalActiveRelayers;

    // --- Events ---
    event MessageDispatched(
        uint256 indexed nonce,
        uint256 indexed destinationChainId,
        address indexed sender,
        address targetContract,
        bytes32 payloadHash
    );

    event MessageExecuted(
        uint256 indexed nonce,
        uint256 indexed sourceChainId,
        address indexed sender,
        address targetContract,
        bool success
    );

    event RelayerAdded(address indexed relayer);
    event RelayerRemoved(address indexed relayer);
    event ThresholdUpdated(uint256 newThreshold);

    constructor(uint256 _chainId, uint256 _initialThreshold) Ownable(msg.sender) {
        require(_initialThreshold > 0, "ERR: ZERO_THRESHOLD");
        currentChainId = _chainId;
        requiredRelayerThreshold = _initialThreshold;

        _setRoleAdmin(RELAYER_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(BRIDGE_ADMIN_ROLE, DEFAULT_ADMIN_ROLE);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(BRIDGE_ADMIN_ROLE, msg.sender);
        _grantRole(RELAYER_ROLE, msg.sender);

        isRelayer[msg.sender] = true;
        totalActiveRelayers = 1;
    }

    /**
     * @notice Dispatch an outbound message to a target blockchain.
     * @param _destinationChainId Destination network chain ID (e.g. 1 for Ethereum, 137 for Polygon, 43114 for Avalanche)
     * @param _targetContract Target contract address on destination network
     * @param _payload Serialized calldata or state packet
     */
    function dispatchMessage(
        uint256 _destinationChainId,
        address _targetContract,
        bytes calldata _payload
    ) external whenNotPaused nonReentrant returns (uint256) {
        require(_destinationChainId != currentChainId, "ERR: CANNOT_BRIDGE_TO_SELF");
        require(_targetContract != address(0), "ERR: ZERO_TARGET");
        require(_payload.length > 0, "ERR: EMPTY_PAYLOAD");

        uint256 nonce = ++outboundNonce;
        bytes32 payloadHash = keccak256(_payload);

        emit MessageDispatched(nonce, _destinationChainId, _msgSender(), _targetContract, payloadHash);
        return nonce;
    }

    /**
     * @notice Process an inbound message relayed from an external blockchain after threshold validation.
     * @param _sourceChainId Chain ID where the message originated
     * @param _nonce Monotonic nonce on the source chain
     * @param _sender Original sender address on the source chain
     * @param _targetContract Destination contract to call on this chain
     * @param _payload Raw calldata payload
     * @param _signatures Array of ECDSA signatures from active relayers
     */
    function processInboundMessage(
        uint256 _sourceChainId,
        uint256 _nonce,
        address _sender,
        address _targetContract,
        bytes calldata _payload,
        bytes[] calldata _signatures
    ) external onlyRole(RELAYER_ROLE) whenNotPaused nonReentrant returns (bool) {
        require(!processedInboundNonces[_sourceChainId][_nonce], "ERR: MESSAGE_ALREADY_PROCESSED");
        require(_signatures.length >= requiredRelayerThreshold, "ERR: INSUFFICIENT_SIGNATURES");

        bytes32 messageHash = keccak256(abi.encodePacked(
            _sourceChainId,
            currentChainId,
            _nonce,
            _sender,
            _targetContract,
            keccak256(_payload)
        ));

        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));

        // Validate relayer signatures
        address[] memory verifiedSigners = new address[](_signatures.length);
        for (uint256 i = 0; i < _signatures.length; i++) {
            address signer = _recoverSigner(ethSignedMessageHash, _signatures[i]);
            require(isRelayer[signer], "ERR: INVALID_RELAYER_SIGNATURE");

            // Ensure no duplicate signatures
            for (uint256 j = 0; j < i; j++) {
                require(verifiedSigners[j] != signer, "ERR: DUPLICATE_RELAYER_SIGNATURE");
            }
            verifiedSigners[i] = signer;
        }

        processedInboundNonces[_sourceChainId][_nonce] = true;

        // Execute message payload if target contract has code
        bool success = false;
        if (_targetContract != address(0) && _payload.length > 0) {
            (success, ) = _targetContract.call(_payload);
        } else {
            success = true;
        }

        emit MessageExecuted(_nonce, _sourceChainId, _sender, _targetContract, success);
        return success;
    }

    /**
     * @notice Add a certified bridge relayer node.
     */
    function addRelayer(address _relayer) external onlyRole(BRIDGE_ADMIN_ROLE) {
        require(_relayer != address(0), "ERR: ZERO_ADDRESS");
        require(!isRelayer[_relayer], "ERR: ALREADY_RELAYER");

        isRelayer[_relayer] = true;
        totalActiveRelayers++;
        _grantRole(RELAYER_ROLE, _relayer);

        emit RelayerAdded(_relayer);
    }

    /**
     * @notice Remove a bridge relayer node.
     */
    function removeRelayer(address _relayer) external onlyRole(BRIDGE_ADMIN_ROLE) {
        require(isRelayer[_relayer], "ERR: NOT_A_RELAYER");
        require(totalActiveRelayers > requiredRelayerThreshold, "ERR: CANNOT_DROP_BELOW_THRESHOLD");

        isRelayer[_relayer] = false;
        totalActiveRelayers--;
        _revokeRole(RELAYER_ROLE, _relayer);

        emit RelayerRemoved(_relayer);
    }

    /**
     * @notice Update required multi-signature threshold.
     */
    function setThreshold(uint256 _newThreshold) external onlyRole(BRIDGE_ADMIN_ROLE) {
        require(_newThreshold > 0 && _newThreshold <= totalActiveRelayers, "ERR: INVALID_THRESHOLD");
        requiredRelayerThreshold = _newThreshold;

        emit ThresholdUpdated(_newThreshold);
    }

    // --- Internal Helpers ---

    function _recoverSigner(bytes32 _ethSignedMessageHash, bytes memory _sig) internal pure returns (address) {
        if (_sig.length != 65) {
            return address(0);
        }

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := mload(add(_sig, 32))
            s := mload(add(_sig, 64))
            v := byte(0, mload(add(_sig, 96)))
        }

        if (v < 27) {
            v += 27;
        }

        return ecrecover(_ethSignedMessageHash, v, r, s);
    }
}
