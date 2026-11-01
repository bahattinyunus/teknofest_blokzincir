// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./common/Ownable.sol";
import "./common/Pausable.sol";
import "./common/AccessControl.sol";
import "./common/IERC721.sol";

/**
 * @title TeknofestBadgeNFT
 * @author Bahattin Yunus Çetin (IT Architect)
 * @notice Soulbound (EIP-5192) & Dynamic Achievement NFT for TEKNOFEST award winners, finalists, and accredited jury.
 * @dev Implements non-transferable soulbound credentials with on-chain metadata and tamper-evident cryptographic badges.
 */
contract TeknofestBadgeNFT is Ownable, Pausable, AccessControl, IERC721Metadata {

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    string private _name;
    string private _symbol;

    enum BadgeTier { Finalist, Bronze, Silver, Gold, Jury, GrandPrix }

    struct BadgeMetadata {
        string teamName;
        string projectTitle;
        BadgeTier tier;
        uint256 scoreScaled;   // e.g. 9850 for 98.50%
        uint256 issuedAt;
        bytes32 verificationProof;
        bool isSoulbound;
    }

    // Token ID counter
    uint256 public nextTokenId;

    // TokenId => Owner
    mapping(uint256 => address) private _owners;
    // Owner => Token Count
    mapping(address => uint256) private _balances;
    // TokenId => Approved Spender
    mapping(uint256 => address) private _tokenApprovals;
    // Owner => Operator => Approved
    mapping(address => mapping(address => bool)) private _operatorApprovals;
    // TokenId => Metadata
    mapping(uint256 => BadgeMetadata) public badges;

    // EIP-5192 Soulbound Events
    event Locked(uint256 tokenId);
    event Unlocked(uint256 tokenId);
    event BadgeMinted(uint256 indexed tokenId, address indexed recipient, BadgeTier tier, string teamName);

    constructor() Ownable(msg.sender) {
        _name = "TEKNOFEST Blockchain Achievement Badge";
        _symbol = "TKF-BADGE";

        _setRoleAdmin(MINTER_ROLE, DEFAULT_ADMIN_ROLE);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    // --- ERC-721 View Functions ---

    function name() external view override returns (string memory) {
        return _name;
    }

    function symbol() external view override returns (string memory) {
        return _symbol;
    }

    function balanceOf(address owner) public view override returns (uint256) {
        require(owner != address(0), "ERC721: zero address");
        return _balances[owner];
    }

    function ownerOf(uint256 tokenId) public view override returns (address) {
        address owner = _owners[tokenId];
        require(owner != address(0), "ERC721: non-existent token");
        return owner;
    }

    function isLocked(uint256 tokenId) public view returns (bool) {
        require(_owners[tokenId] != address(0), "ERC721: non-existent token");
        return badges[tokenId].isSoulbound;
    }

    function tokenURI(uint256 tokenId) external view override returns (string memory) {
        require(_owners[tokenId] != address(0), "ERC721: non-existent token");
        BadgeMetadata memory b = badges[tokenId];

        string memory tierStr = _getTierString(b.tier);
        return string(abi.encodePacked(
            "data:application/json;utf8,{\"name\":\"", _name, " #", _toString(tokenId),
            "\",\"description\":\"TEKNOFEST Resmi Basari Rozeti - ", b.teamName,
            "\",\"attributes\":[{\"trait_type\":\"Tier\",\"value\":\"", tierStr,
            "\"},{\"trait_type\":\"Team\",\"value\":\"", b.teamName,
            "\"},{\"trait_type\":\"Score\",\"value\":\"", _toString(b.scoreScaled),
            "\"},{\"trait_type\":\"Soulbound\",\"value\":\"", b.isSoulbound ? "True" : "False", "\"}]}"
        ));
    }

    // --- Minting Functions ---

    /**
     * @notice Mint an on-chain soulbound achievement badge to an awarded team or jury member.
     */
    function mintBadge(
        address recipient,
        string calldata teamName,
        string calldata projectTitle,
        BadgeTier tier,
        uint256 scoreScaled,
        bytes32 verificationProof,
        bool isSoulbound
    ) external onlyRole(MINTER_ROLE) whenNotPaused returns (uint256) {
        require(recipient != address(0), "ERC721: zero recipient");

        uint256 tokenId = ++nextTokenId;
        _owners[tokenId] = recipient;
        _balances[recipient] += 1;

        badges[tokenId] = BadgeMetadata({
            teamName: teamName,
            projectTitle: projectTitle,
            tier: tier,
            scoreScaled: scoreScaled,
            issuedAt: block.timestamp,
            verificationProof: verificationProof,
            isSoulbound: isSoulbound
        });

        emit Transfer(address(0), recipient, tokenId);
        emit BadgeMinted(tokenId, recipient, tier, teamName);

        if (isSoulbound) {
            emit Locked(tokenId);
        }

        return tokenId;
    }

    // --- ERC-721 Transfer & Soulbound Restrictions ---

    function transferFrom(address from, address to, uint256 tokenId) public override whenNotPaused {
        require(!badges[tokenId].isSoulbound, "EIP5192: token is soulbound and cannot be transferred");
        require(_isApprovedOrOwner(msg.sender, tokenId), "ERC721: caller not approved");
        _transfer(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) external override {
        transferFrom(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata) external override {
        transferFrom(from, to, tokenId);
    }

    function approve(address to, uint256 tokenId) external override {
        address owner = ownerOf(tokenId);
        require(to != owner, "ERC721: approval to current owner");
        require(msg.sender == owner || isApprovedForAll(owner, msg.sender), "ERC721: not authorized");
        _tokenApprovals[tokenId] = to;
        emit Approval(owner, to, tokenId);
    }

    function setApprovalForAll(address operator, bool approved) external override {
        require(operator != msg.sender, "ERC721: approve to caller");
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function getApproved(uint256 tokenId) public view override returns (address) {
        require(_owners[tokenId] != address(0), "ERC721: non-existent token");
        return _tokenApprovals[tokenId];
    }

    function isApprovedForAll(address owner, address operator) public view override returns (bool) {
        return _operatorApprovals[owner][operator];
    }

    // --- Internal Helpers ---

    function _transfer(address from, address to, uint256 tokenId) internal {
        require(ownerOf(tokenId) == from, "ERC721: transfer from incorrect owner");
        require(to != address(0), "ERC721: transfer to zero address");

        delete _tokenApprovals[tokenId];
        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;

        emit Transfer(from, to, tokenId);
    }

    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        address owner = ownerOf(tokenId);
        return (spender == owner || isApprovedForAll(owner, spender) || getApproved(tokenId) == spender);
    }

    function _getTierString(BadgeTier tier) internal pure returns (string memory) {
        if (tier == BadgeTier.GrandPrix) return "Grand Prix Sampiyon";
        if (tier == BadgeTier.Gold) return "Altin Madalya (1.lik)";
        if (tier == BadgeTier.Silver) return "Gumus Madalya (2.lik)";
        if (tier == BadgeTier.Bronze) return "Bronz Madalya (3.luk)";
        if (tier == BadgeTier.Jury) return "Akredite Juri";
        return "Finalist Sertifikasi";
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
