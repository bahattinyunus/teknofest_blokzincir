// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./common/IERC20.sol";
import "./common/Ownable.sol";
import "./common/Pausable.sol";
import "./common/ReentrancyGuard.sol";

/**
 * @title TeknofestToken (TKF)
 * @author Bahattin Yunus Çetin (IT Architect)
 * @notice Native utility, governance and node staking token for the Block-Architect ecosystem.
 * @dev ERC-20 compliant with built-in validator staking, slashing, and faucet mechanics.
 */
contract TeknofestToken is IERC20, Ownable, Pausable, ReentrancyGuard {

    string public constant name = "Teknofest Architect Token";
    string public constant symbol = "TKF";
    uint8 public constant decimals = 18;

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    // --- Staking System ---
    struct StakeInfo {
        uint256 amount;
        uint256 stakedAt;
        uint256 rewardDebt;
    }

    mapping(address => StakeInfo) public stakes;
    uint256 public totalStaked;
    uint256 public rewardRateAnnualPercent = 12; // 12% APY
    uint256 public constant FAUCET_AMOUNT = 100 * 10**18; // 100 TKF
    mapping(address => uint256) public lastFaucetClaim;
    uint256 public constant FAUCET_COOLDOWN = 1 hours;

    // --- Events ---
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount, uint256 reward);
    event Slashed(address indexed validator, uint256 penaltyAmount, string reason);
    event FaucetDrawn(address indexed recipient, uint256 amount);

    constructor(uint256 initialSupply) Ownable(msg.sender) {
        // Mint initial supply to owner (e.g. 10,000,000 TKF)
        _mint(msg.sender, initialSupply * 10**decimals);
    }

    // --- Standard ERC-20 Functions ---

    function totalSupply() external view override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view override returns (uint256) {
        return _balances[account];
    }

    function transfer(address to, uint256 amount) external override whenNotPaused returns (bool) {
        _transfer(_msgSender(), to, amount);
        return true;
    }

    function allowance(address owner, address spender) external view override returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) external override returns (bool) {
        _approve(_msgSender(), spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external override whenNotPaused returns (bool) {
        uint256 currentAllowance = _allowances[from][_msgSender()];
        require(currentAllowance >= amount, "ERC20: insufficient allowance");
        unchecked {
            _approve(from, _msgSender(), currentAllowance - amount);
        }
        _transfer(from, to, amount);
        return true;
    }

    // --- Staking Mechanics ---

    /**
     * @notice Stake TKF tokens to secure the network or earn rewards.
     */
    function stake(uint256 amount) external whenNotPaused nonReentrant {
        require(amount > 0, "Cannot stake 0");
        require(_balances[_msgSender()] >= amount, "Insufficient balance");

        // Calculate pending rewards if already staked
        StakeInfo storage info = stakes[_msgSender()];
        uint256 pending = 0;
        if (info.amount > 0) {
            pending = calculateReward(_msgSender());
        }

        _balances[_msgSender()] -= amount;
        totalStaked += amount;

        info.amount += amount + pending;
        info.stakedAt = block.timestamp;

        emit Staked(_msgSender(), amount);
    }

    /**
     * @notice Unstake tokens and claim accrued rewards.
     */
    function unstake(uint256 amount) external nonReentrant {
        StakeInfo storage info = stakes[_msgSender()];
        require(info.amount >= amount, "Cannot unstake more than staked");

        uint256 pending = calculateReward(_msgSender());
        uint256 totalPayout = amount + pending;

        info.amount -= amount;
        info.stakedAt = block.timestamp;
        totalStaked -= amount;

        _mint(_msgSender(), pending);
        _balances[_msgSender()] += amount;

        emit Unstaked(_msgSender(), amount, pending);
        emit Transfer(address(this), _msgSender(), totalPayout);
    }

    /**
     * @notice Calculate accrued staking reward.
     */
    function calculateReward(address account) public view returns (uint256) {
        StakeInfo memory info = stakes[account];
        if (info.amount == 0) return 0;
        uint256 duration = block.timestamp - info.stakedAt;
        return (info.amount * rewardRateAnnualPercent * duration) / (365 days * 100);
    }

    /**
     * @notice Slash a malicious validator node.
     */
    function slash(address validator, uint256 penaltyAmount, string calldata reason) external onlyOwner {
        StakeInfo storage info = stakes[validator];
        require(info.amount >= penaltyAmount, "Penalty exceeds staked amount");

        info.amount -= penaltyAmount;
        totalStaked -= penaltyAmount;

        // Burn the slashed tokens
        _totalSupply -= penaltyAmount;

        emit Slashed(validator, penaltyAmount, reason);
    }

    /**
     * @notice Faucet for testnet testers and hackathon evaluation.
     */
    function requestFaucet() external whenNotPaused {
        require(block.timestamp - lastFaucetClaim[_msgSender()] >= FAUCET_COOLDOWN, "Faucet cooldown active");
        lastFaucetClaim[_msgSender()] = block.timestamp;

        _mint(_msgSender(), FAUCET_AMOUNT);
        emit FaucetDrawn(_msgSender(), FAUCET_AMOUNT);
    }

    // --- Mint & Burn ---

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function burn(uint256 amount) external {
        _burn(_msgSender(), amount);
    }

    // --- Internal Helpers ---

    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0), "ERC20: transfer from zero");
        require(to != address(0), "ERC20: transfer to zero");
        require(_balances[from] >= amount, "ERC20: transfer exceeds balance");

        _balances[from] -= amount;
        _balances[to] += amount;
        emit Transfer(from, to, amount);
    }

    function _mint(address to, uint256 amount) internal {
        require(to != address(0), "ERC20: mint to zero");
        _totalSupply += amount;
        _balances[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function _burn(address from, uint256 amount) internal {
        require(from != address(0), "ERC20: burn from zero");
        require(_balances[from] >= amount, "ERC20: burn exceeds balance");

        _balances[from] -= amount;
        _totalSupply -= amount;
        emit Transfer(from, address(0), amount);
    }

    function _approve(address owner, address spender, uint256 amount) internal {
        require(owner != address(0), "ERC20: approve from zero");
        require(spender != address(0), "ERC20: approve to zero");

        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }
}
