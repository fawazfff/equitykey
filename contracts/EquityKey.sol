// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IB20Balance { function scaledBalanceOf(address account) external view returns (uint256); }

/// @notice Non-custodial benefit eligibility and onchain claim receipts.
contract EquityKey {
    enum RuleType { SINGLE, ALL, ANY, BASKET }
    struct Benefit { address creator; RuleType ruleType; bool oneTime; bool active; uint256 basketThresholdWad; bytes32 ruleRef; string metadataURI; }
    address public immutable owner;
    uint256 public nextBenefitId = 1;
    mapping(address => bool) public acceptedToken;
    mapping(uint256 => Benefit) public benefits;
    mapping(uint256 => address[]) private benefitTokens;
    mapping(uint256 => uint256[]) private benefitMinimums;
    mapping(uint256 => mapping(address => bool)) public hasClaimed;
    mapping(uint256 => mapping(address => uint256)) public claimCount;
    event TokenAcceptanceSet(address indexed token, bool accepted);
    event BenefitCreated(uint256 indexed benefitId, address indexed creator, bytes32 indexed ruleRef, RuleType ruleType, bool oneTime, string metadataURI);
    event BenefitStatusChanged(uint256 indexed benefitId, bool active);
    event BenefitClaimed(uint256 indexed benefitId, address indexed account, bytes32 indexed ruleRef, uint256 claimNumber, uint256 timestamp);
    error NotOwner(); error NotCreator(); error InvalidRule(); error UnsupportedToken(address token); error Ineligible(); error AlreadyClaimed(); error BenefitInactive();

    constructor() { owner = msg.sender; }
    function setAcceptedToken(address token, bool accepted) external { if (msg.sender != owner) revert NotOwner(); acceptedToken[token] = accepted; emit TokenAcceptanceSet(token, accepted); }
    function createBenefit(RuleType ruleType, address[] calldata tokens, uint256[] calldata minimums, uint256 basketThresholdWad, bool oneTime, string calldata metadataURI) external returns (uint256 benefitId) {
        if (tokens.length == 0 || tokens.length != minimums.length) revert InvalidRule();
        if (ruleType == RuleType.SINGLE && tokens.length != 1) revert InvalidRule();
        if (ruleType == RuleType.BASKET && (basketThresholdWad == 0 || basketThresholdWad > tokens.length * 1e18)) revert InvalidRule();
        for (uint256 i; i < tokens.length; ++i) { if (!acceptedToken[tokens[i]]) revert UnsupportedToken(tokens[i]); if (minimums[i] == 0) revert InvalidRule(); }
        benefitId = nextBenefitId++;
        bytes32 ruleRef = keccak256(abi.encode(ruleType, tokens, minimums, basketThresholdWad, oneTime));
        benefits[benefitId] = Benefit(msg.sender, ruleType, oneTime, true, basketThresholdWad, ruleRef, metadataURI);
        benefitTokens[benefitId] = tokens; benefitMinimums[benefitId] = minimums;
        emit BenefitCreated(benefitId, msg.sender, ruleRef, ruleType, oneTime, metadataURI);
    }
    function setBenefitActive(uint256 benefitId, bool active) external { Benefit storage benefit = benefits[benefitId]; if (msg.sender != benefit.creator) revert NotCreator(); benefit.active = active; emit BenefitStatusChanged(benefitId, active); }
    function getRule(uint256 benefitId) external view returns (address[] memory tokens, uint256[] memory minimums) { return (benefitTokens[benefitId], benefitMinimums[benefitId]); }
    function isEligible(uint256 benefitId, address account) public view returns (bool) {
        Benefit storage benefit = benefits[benefitId]; if (!benefit.active) return false;
        address[] storage tokens = benefitTokens[benefitId]; uint256[] storage minimums = benefitMinimums[benefitId]; if (tokens.length == 0) return false;
        if (benefit.ruleType == RuleType.SINGLE) return _meets(tokens[0], minimums[0], account);
        if (benefit.ruleType == RuleType.ALL) { for (uint256 i; i < tokens.length; ++i) if (!_meets(tokens[i], minimums[i], account)) return false; return true; }
        if (benefit.ruleType == RuleType.ANY) { for (uint256 i; i < tokens.length; ++i) if (_meets(tokens[i], minimums[i], account)) return true; return false; }
        uint256 basketScoreWad;
        for (uint256 i; i < tokens.length; ++i) { uint256 balance = IB20Balance(tokens[i]).scaledBalanceOf(account); basketScoreWad += balance >= minimums[i] ? 1e18 : balance * 1e18 / minimums[i]; }
        return basketScoreWad >= benefit.basketThresholdWad;
    }
    function claim(uint256 benefitId) external {
        Benefit storage benefit = benefits[benefitId]; if (!benefit.active) revert BenefitInactive();
        if (benefit.oneTime && hasClaimed[benefitId][msg.sender]) revert AlreadyClaimed(); if (!isEligible(benefitId, msg.sender)) revert Ineligible();
        hasClaimed[benefitId][msg.sender] = true; uint256 count = ++claimCount[benefitId][msg.sender]; emit BenefitClaimed(benefitId, msg.sender, benefit.ruleRef, count, block.timestamp);
    }
    function _meets(address token, uint256 minimum, address account) private view returns (bool) { return IB20Balance(token).scaledBalanceOf(account) >= minimum; }
}
