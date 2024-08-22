// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenA is ERC20, Ownable {
    uint256 public constant TOTAL_SUPPLY = 1000000000 * 10**18;
    uint256 public constant MAX_FAUCET_AMOUNT = 5000000 * 10**18; // 1000000 tokens

    constructor() ERC20("Token A", "TKA") Ownable(msg.sender) {
        _mint(address(this), TOTAL_SUPPLY);
    }

    function faucet(uint256 amount) public {
        require(amount <= MAX_FAUCET_AMOUNT, "Faucet: Amount exceeds maximum allowed");
        require(balanceOf(address(this)) >= amount, "Faucet: Insufficient balance in contract");
        _transfer(address(this), msg.sender, amount);
    }
}