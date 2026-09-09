// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Test-only B20-shaped token. It is not issued by Coinbase and has no value.
contract MockB20 {
    string public constant name = "EquityKey Demo Apple";
    string public constant symbol = "demoAAPLc";
    uint8 public constant decimals = 18;
    uint256 public constant WAD_PRECISION = 1e18;
    uint256 public multiplier = 1e18;
    mapping(address => uint256) public balanceOf;
    mapping(address => bool) public demoClaimed;
    event Transfer(address indexed from, address indexed to, uint256 value);

    function scaledBalanceOf(address account) external view returns (uint256) { return balanceOf[account] * multiplier / WAD_PRECISION; }
    function toScaledBalance(uint256 raw) external view returns (uint256) { return raw * multiplier / WAD_PRECISION; }
    function claimDemoTokens() external {
        require(!demoClaimed[msg.sender], "Demo shares already claimed");
        demoClaimed[msg.sender] = true;
        balanceOf[msg.sender] += 1e18;
        emit Transfer(address(0), msg.sender, 1e18);
    }
}
