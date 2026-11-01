// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./common/Ownable.sol";
import "./common/Pausable.sol";
import "./common/AccessControl.sol";

/**
 * @title TelemetryOracleHub
 * @author Bahattin Yunus Çetin (IT Architect)
 * @notice Decentralized Multi-Node IoT & Avionics Telemetry Oracle Hub for TEKNOFEST.
 * @dev Collects telemetry feeds from distributed edge nodes, computes consensus medians, and triggers alerts on deviations.
 */
contract TelemetryOracleHub is Ownable, Pausable, AccessControl {

    bytes32 public constant ORACLE_NODE_ROLE = keccak256("ORACLE_NODE_ROLE");

    struct TelemetryData {
        int256 temperatureScaled; // e.g. 2150 => 21.50 C
        uint256 altitudeMeters;
        uint256 speedKmh;
        uint256 timestamp;
        bytes32 packetHash;
    }

    struct FeedRound {
        uint256 roundId;
        uint256 submittedCount;
        int256 consensusTemperature;
        uint256 consensusAltitude;
        bool finalized;
    }

    // feedId => roundId => FeedRound
    mapping(bytes32 => mapping(uint256 => FeedRound)) public rounds;
    // feedId => current roundId
    mapping(bytes32 => uint256) public currentRounds;
    // feedId => roundId => nodeAddress => TelemetryData
    mapping(bytes32 => mapping(uint256 => mapping(address => TelemetryData))) public submissions;
    // feedId => roundId => node addresses list
    mapping(bytes32 => mapping(uint256 => address[])) private _roundNodes;

    // Minimum oracle nodes required to finalize consensus
    uint256 public requiredSubmissions = 3;
    // Max permissible deviation in temperature before triggering critical alert (e.g. 500 => 5.00 C)
    int256 public maxAllowedDeviationTemp = 500;

    // --- Events ---
    event TelemetrySubmitted(bytes32 indexed feedId, uint256 indexed roundId, address indexed node, int256 temp, uint256 altitude);
    event ConsensusFinalized(bytes32 indexed feedId, uint256 indexed roundId, int256 consensusTemp, uint256 consensusAltitude);
    event TelemetryAnomalyAlert(bytes32 indexed feedId, uint256 indexed roundId, address indexed faultyNode, int256 deviation);
    event OracleNodeRegistered(address indexed node, string locationTag);

    constructor() Ownable(msg.sender) {
        _setRoleAdmin(ORACLE_NODE_ROLE, DEFAULT_ADMIN_ROLE);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORACLE_NODE_ROLE, msg.sender);
    }

    /**
     * @notice Register an authorized telemetry edge node (e.g. Trabzon, Samsun, Istanbul, Ankara).
     */
    function registerOracleNode(address node, string calldata locationTag) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(node != address(0), "Zero address");
        _grantRole(ORACLE_NODE_ROLE, node);
        emit OracleNodeRegistered(node, locationTag);
    }

    /**
     * @notice Submit sensor data for a specific feed (e.g. "TKF-IHA-01").
     */
    function submitTelemetry(
        bytes32 feedId,
        int256 temperatureScaled,
        uint256 altitudeMeters,
        uint256 speedKmh,
        bytes32 packetHash
    ) external onlyRole(ORACLE_NODE_ROLE) whenNotPaused {
        uint256 roundId = currentRounds[feedId];
        if (roundId == 0) {
            roundId = 1;
            currentRounds[feedId] = 1;
        }

        FeedRound storage round = rounds[feedId][roundId];
        require(!round.finalized, "Round already finalized");
        require(submissions[feedId][roundId][msg.sender].timestamp == 0, "Node already submitted for this round");

        submissions[feedId][roundId][msg.sender] = TelemetryData({
            temperatureScaled: temperatureScaled,
            altitudeMeters: altitudeMeters,
            speedKmh: speedKmh,
            timestamp: block.timestamp,
            packetHash: packetHash
        });

        _roundNodes[feedId][roundId].push(msg.sender);
        round.submittedCount++;

        emit TelemetrySubmitted(feedId, roundId, msg.sender, temperatureScaled, altitudeMeters);

        // Auto finalize if required threshold is reached
        if (round.submittedCount >= requiredSubmissions) {
            _finalizeRound(feedId, roundId);
        }
    }

    /**
     * @notice Calculate consensus median and finalize telemetry round.
     */
    function _finalizeRound(bytes32 feedId, uint256 roundId) internal {
        FeedRound storage round = rounds[feedId][roundId];
        address[] memory nodes = _roundNodes[feedId][roundId];
        uint256 len = nodes.length;

        int256[] memory temps = new int256[](len);
        uint256[] memory alts = new uint256[](len);

        for (uint256 i = 0; i < len; i++) {
            temps[i] = submissions[feedId][roundId][nodes[i]].temperatureScaled;
            alts[i] = submissions[feedId][roundId][nodes[i]].altitudeMeters;
        }

        // Sort arrays to compute median
        _sortInt(temps);
        _sortUint(alts);

        int256 medianTemp = temps[len / 2];
        uint256 medianAlt = alts[len / 2];

        round.consensusTemperature = medianTemp;
        round.consensusAltitude = medianAlt;
        round.finalized = true;

        // Check for anomalies against median
        for (uint256 i = 0; i < len; i++) {
            int256 diff = submissions[feedId][roundId][nodes[i]].temperatureScaled - medianTemp;
            if (diff < 0) diff = -diff;

            if (diff > maxAllowedDeviationTemp) {
                emit TelemetryAnomalyAlert(feedId, roundId, nodes[i], diff);
            }
        }

        emit ConsensusFinalized(feedId, roundId, medianTemp, medianAlt);

        // Advance to next round
        currentRounds[feedId] = roundId + 1;
    }

    /**
     * @notice Configure oracle consensus parameters.
     */
    function setParameters(uint256 _requiredSubmissions, int256 _maxAllowedDeviationTemp) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_requiredSubmissions > 0, "Invalid count");
        requiredSubmissions = _requiredSubmissions;
        maxAllowedDeviationTemp = _maxAllowedDeviationTemp;
    }

    // --- Array Sorting Helpers for Median ---

    function _sortInt(int256[] memory arr) internal pure {
        uint256 l = arr.length;
        for (uint256 i = 0; i < l; i++) {
            for (uint256 j = i + 1; j < l; j++) {
                if (arr[i] > arr[j]) {
                    int256 temp = arr[i];
                    arr[i] = arr[j];
                    arr[j] = temp;
                }
            }
        }
    }

    function _sortUint(uint256[] memory arr) internal pure {
        uint256 l = arr.length;
        for (uint256 i = 0; i < l; i++) {
            for (uint256 j = i + 1; j < l; j++) {
                if (arr[i] > arr[j]) {
                    uint256 temp = arr[i];
                    arr[i] = arr[j];
                    arr[j] = temp;
                }
            }
        }
    }
}
