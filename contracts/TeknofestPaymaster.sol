// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./common/Ownable.sol";
import "./common/Pausable.sol";
import "./common/ReentrancyGuard.sol";
import "./common/AccessControl.sol";

/**
 * @title TeknofestPaymaster
 * @author Bahattin Yunus Çetin (IT Architect)
 * @notice ERC-4337 Account Abstraction & Gas Sponsorship Paymaster for TEKNOFEST student teams.
 * @dev Subsidizes transaction gas fees for whitelisted student teams, avionic IoT devices, and jury nodes.
 */
contract TeknofestPaymaster is Ownable, Pausable, ReentrancyGuard, AccessControl {

    bytes32 public constant SPONSOR_ADMIN_ROLE = keccak256("SPONSOR_ADMIN_ROLE");

    struct TeamQuota {
        bool isWhitelisted;
        uint256 dailyLimit;
        uint256 usedToday;
        uint256 lastResetTimestamp;
        uint256 totalSponsoredGas;
    }

    // Whitelisted user/team => TeamQuota
    mapping(address => TeamQuota) public quotas;

    uint256 public totalGasSubsidized;
    uint256 public totalTransactionsSponsored;

    // --- Events ---
    event GasSubsidized(address indexed beneficiary, address indexed targetContract, uint256 gasUsed, uint256 feeWei);
    event TeamWhitelisted(address indexed team, uint256 dailyLimit);
    event TeamRevoked(address indexed team);
    event FundsDeposited(address indexed funder, uint256 amount);
    event FundsWithdrawn(address indexed recipient, uint256 amount);

    constructor() Ownable(msg.sender) payable {
        _setRoleAdmin(SPONSOR_ADMIN_ROLE, DEFAULT_ADMIN_ROLE);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(SPONSOR_ADMIN_ROLE, msg.sender);
    }

    receive() external payable {
        emit FundsDeposited(msg.sender, msg.value);
    }

    /**
     * @notice Whitelist a student team or IoT node for sponsored transactions.
     */
    function setTeamWhitelist(address team, bool status, uint256 dailyLimit) external onlyRole(SPONSOR_ADMIN_ROLE) {
        require(team != address(0), "Zero address");
        quotas[team].isWhitelisted = status;
        quotas[team].dailyLimit = dailyLimit;
        if (quotas[team].lastResetTimestamp == 0) {
            quotas[team].lastResetTimestamp = block.timestamp;
        }

        if (status) {
            emit TeamWhitelisted(team, dailyLimit);
        } else {
            emit TeamRevoked(team);
        }
    }

    /**
     * @notice Execute a meta-transaction with gas sponsored by the Paymaster.
     * @param beneficiary The student team or IoT device whose call is being sponsored
     * @param targetContract Destination smart contract (e.g. IdentityRegistry, SupplyChainTracker)
     * @param callData Encoded function payload
     */
    function executeSponsoredTransaction(
        address beneficiary,
        address targetContract,
        bytes calldata callData
    ) external onlyRole(SPONSOR_ADMIN_ROLE) whenNotPaused nonReentrant returns (bool, bytes memory) {
        TeamQuota storage q = quotas[beneficiary];
        require(q.isWhitelisted, "ERR: TEAM_NOT_WHITELISTED");

        // Daily quota reset check (24 hours)
        if (block.timestamp - q.lastResetTimestamp >= 1 days) {
            q.usedToday = 0;
            q.lastResetTimestamp = block.timestamp;
        }

        require(q.usedToday < q.dailyLimit, "ERR: DAILY_QUOTA_EXCEEDED");

        uint256 gasStart = gasleft();

        (bool success, bytes memory returnData) = targetContract.call(callData);

        uint256 gasUsed = gasStart - gasleft();
        q.usedToday++;
        q.totalSponsoredGas += gasUsed;
        totalGasSubsidized += gasUsed;
        totalTransactionsSponsored++;

        emit GasSubsidized(beneficiary, targetContract, gasUsed, 0);
        return (success, returnData);
    }

    /**
     * @notice Withdraw funds from paymaster pool.
     */
    function withdrawFunds(address payable recipient, uint256 amount) external onlyOwner {
        require(recipient != address(0), "Zero address");
        require(amount <= address(this).balance, "Insufficient balance");

        recipient.transfer(amount);
        emit FundsWithdrawn(recipient, amount);
    }

    function getPaymasterBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
