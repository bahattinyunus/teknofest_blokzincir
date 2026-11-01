// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IStakableToken {
    function stake(uint256 amount) external;
    function unstake(uint256 amount) external;
}

/**
 * @title ReentrancyAttacker
 * @author Bahattin Yunus Çetin (IT Architect)
 * @notice Exploit simulation contract designed to audit and verify ReentrancyGuard resilience.
 */
contract ReentrancyAttacker {
    IStakableToken public target;
    uint256 public attackCount;
    bool public attackSucceeded;

    constructor(address _target) {
        target = IStakableToken(_target);
    }

    // Malicious fallback attempting recursive entry
    receive() external payable {
        if (attackCount < 3) {
            attackCount++;
            target.unstake(1);
        }
    }

    function attack() external {
        attackCount = 0;
        attackSucceeded = false;
        target.unstake(1);
        attackSucceeded = true;
    }
}
