// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./common/Ownable.sol";
import "./common/Pausable.sol";
import "./common/ReentrancyGuard.sol";

/**
 * @title SupplyChainTracker
 * @author Bahattin Yunus Çetin (IT Architect)
 * @notice Enterprise logistics and multi-party supply chain traceability smart contract.
 * @dev Features IoT sensor telemetry recording, chain of custody handoffs, and cryptographic proof verification.
 */
contract SupplyChainTracker is Ownable, Pausable, ReentrancyGuard {

    enum ShipmentState {
        Created,
        Dispatched,
        InTransit,
        CustomsCleared,
        OutForDelivery,
        Delivered,
        Completed,
        Disputed
    }

    struct Checkpoint {
        uint256 timestamp;
        string location;
        int16 temperatureCelsius; // Scaled by 10 (e.g. 215 = 21.5 C)
        uint16 humidityPercent;    // Scaled by 10 (e.g. 650 = 65.0%)
        bytes32 sensorProofHash;  // Hash of raw IoT telemetry packet
        address recordedBy;
    }

    struct Shipment {
        uint256 shipmentId;
        string trackingCode;
        bytes32 itemHash;         // Merkle or SHA-256 hash of physical cargo/manifest
        address sender;
        address recipient;
        address currentCustodian;
        ShipmentState state;
        uint256 createdAt;
        uint256 deliveredAt;
        uint256 checkpointCount;
        bool exists;
    }

    // shipmentId => Shipment
    mapping(uint256 => Shipment) public shipments;
    // trackingCode hash => shipmentId
    mapping(bytes32 => uint256) public trackingCodeToId;
    // shipmentId => list of checkpoints
    mapping(uint256 => Checkpoint[]) private _shipmentCheckpoints;
    // Authorized carriers/couriers
    mapping(address => bool) public authorizedCarriers;

    uint256 public totalShipments;

    // --- Events ---
    event ShipmentCreated(uint256 indexed shipmentId, string trackingCode, address indexed sender, address indexed recipient);
    event CheckpointLogged(uint256 indexed shipmentId, string location, int16 temperature, uint16 humidity);
    event CustodyTransferred(uint256 indexed shipmentId, address indexed previousCustodian, address indexed newCustodian);
    event ShipmentStateChanged(uint256 indexed shipmentId, ShipmentState newState);
    event DisputeRaised(uint256 indexed shipmentId, address indexed initiator, string reason);
    event DisputeResolved(uint256 indexed shipmentId, ShipmentState resolvedState, string resolutionNotes);
    event CarrierStatusUpdated(address indexed carrier, bool status);

    modifier onlyShipmentParty(uint256 shipmentId) {
        Shipment storage s = shipments[shipmentId];
        require(s.exists, "Shipment does not exist");
        require(
            _msgSender() == s.sender || 
            _msgSender() == s.recipient || 
            _msgSender() == s.currentCustodian || 
            _msgSender() == owner(), 
            "Caller not party to shipment"
        );
        _;
    }

    modifier onlyCustodian(uint256 shipmentId) {
        Shipment storage s = shipments[shipmentId];
        require(s.exists, "Shipment does not exist");
        require(_msgSender() == s.currentCustodian || _msgSender() == owner(), "Caller is not current custodian");
        _;
    }

    constructor() Ownable(msg.sender) {
        authorizedCarriers[msg.sender] = true;
    }

    /**
     * @notice Register a new trackable cargo shipment.
     */
    function createShipment(
        string calldata trackingCode,
        bytes32 itemHash,
        address recipient,
        string calldata initialLocation
    ) external whenNotPaused nonReentrant returns (uint256) {
        require(recipient != address(0), "Invalid recipient address");
        require(itemHash != bytes32(0), "Invalid item hash");
        bytes32 codeKey = keccak256(abi.encodePacked(trackingCode));
        require(trackingCodeToId[codeKey] == 0, "Tracking code already used");

        uint256 shipmentId = ++totalShipments;
        trackingCodeToId[codeKey] = shipmentId;

        shipments[shipmentId] = Shipment({
            shipmentId: shipmentId,
            trackingCode: trackingCode,
            itemHash: itemHash,
            sender: _msgSender(),
            recipient: recipient,
            currentCustodian: _msgSender(),
            state: ShipmentState.Created,
            createdAt: block.timestamp,
            deliveredAt: 0,
            checkpointCount: 0,
            exists: true
        });

        // Log genesis checkpoint
        _addCheckpoint(shipmentId, initialLocation, 200, 500, itemHash);

        emit ShipmentCreated(shipmentId, trackingCode, _msgSender(), recipient);
        return shipmentId;
    }

    /**
     * @notice Record a physical checkpoint and IoT environmental telemetry.
     */
    function logCheckpoint(
        uint256 shipmentId,
        string calldata location,
        int16 temperature,
        uint16 humidity,
        bytes32 sensorProofHash
    ) external onlyShipmentParty(shipmentId) whenNotPaused {
        _addCheckpoint(shipmentId, location, temperature, humidity, sensorProofHash);
        
        Shipment storage s = shipments[shipmentId];
        if (s.state == ShipmentState.Created) {
            s.state = ShipmentState.InTransit;
            emit ShipmentStateChanged(shipmentId, ShipmentState.InTransit);
        }
    }

    /**
     * @notice Transfer physical custody to next logistics carrier or recipient.
     */
    function transferCustody(uint256 shipmentId, address newCustodian) external onlyCustodian(shipmentId) whenNotPaused {
        require(newCustodian != address(0), "Invalid new custodian");
        Shipment storage s = shipments[shipmentId];
        address previousCustodian = s.currentCustodian;
        s.currentCustodian = newCustodian;

        emit CustodyTransferred(shipmentId, previousCustodian, newCustodian);
    }

    /**
     * @notice Confirm delivery by recipient or authorized carrier.
     */
    function confirmDelivery(uint256 shipmentId) external onlyShipmentParty(shipmentId) whenNotPaused {
        Shipment storage s = shipments[shipmentId];
        require(s.state != ShipmentState.Delivered && s.state != ShipmentState.Completed, "Already delivered");
        require(_msgSender() == s.recipient || _msgSender() == owner(), "Only recipient or owner can confirm delivery");

        s.state = ShipmentState.Delivered;
        s.deliveredAt = block.timestamp;
        s.currentCustodian = s.recipient;

        emit ShipmentStateChanged(shipmentId, ShipmentState.Delivered);
    }

    /**
     * @notice Raise an audit dispute for damaged or missing shipment.
     */
    function raiseDispute(uint256 shipmentId, string calldata reason) external onlyShipmentParty(shipmentId) whenNotPaused {
        Shipment storage s = shipments[shipmentId];
        require(s.state != ShipmentState.Completed, "Cannot dispute completed shipment");
        s.state = ShipmentState.Disputed;

        emit DisputeRaised(shipmentId, _msgSender(), reason);
        emit ShipmentStateChanged(shipmentId, ShipmentState.Disputed);
    }

    /**
     * @notice Resolve an open dispute as arbitrator (owner).
     */
    function resolveDispute(uint256 shipmentId, ShipmentState resolvedState, string calldata resolutionNotes) external onlyOwner {
        Shipment storage s = shipments[shipmentId];
        require(s.state == ShipmentState.Disputed, "Shipment is not under dispute");

        s.state = resolvedState;
        emit DisputeResolved(shipmentId, resolvedState, resolutionNotes);
        emit ShipmentStateChanged(shipmentId, resolvedState);
    }

    /**
     * @notice Set carrier authorization.
     */
    function setCarrierAuthorization(address carrier, bool status) external onlyOwner {
        authorizedCarriers[carrier] = status;
        emit CarrierStatusUpdated(carrier, status);
    }

    // --- View Functions ---

    function getShipment(uint256 shipmentId) external view returns (Shipment memory) {
        require(shipments[shipmentId].exists, "Shipment does not exist");
        return shipments[shipmentId];
    }

    function getCheckpoints(uint256 shipmentId) external view returns (Checkpoint[] memory) {
        require(shipments[shipmentId].exists, "Shipment does not exist");
        return _shipmentCheckpoints[shipmentId];
    }

    // --- Internal Helpers ---

    function _addCheckpoint(
        uint256 shipmentId,
        string memory location,
        int16 temperature,
        uint16 humidity,
        bytes32 sensorProofHash
    ) internal {
        _shipmentCheckpoints[shipmentId].push(Checkpoint({
            timestamp: block.timestamp,
            location: location,
            temperatureCelsius: temperature,
            humidityPercent: humidity,
            sensorProofHash: sensorProofHash,
            recordedBy: _msgSender()
        }));

        shipments[shipmentId].checkpointCount++;
        emit CheckpointLogged(shipmentId, location, temperature, humidity);
    }
}
