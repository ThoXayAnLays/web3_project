// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract TokenA is ERC20, Ownable, ReentrancyGuard {
    uint256 public constant TOTAL_SUPPLY = 1000000000 * 10**18;
    uint256 public constant MAX_FAUCET_AMOUNT = 5000000 * 10**18;
    uint256 public constant MAX_REWARD_AMOUNT = 1000000 * 10**18; 
    address public stakingContract;

    constructor() ERC20("Token A", "TKA") Ownable(msg.sender) {
        _mint(address(this), TOTAL_SUPPLY);
    }

    function setStakingContract(address _stakingContract) external onlyOwner {
        stakingContract = _stakingContract;
    }

    function transferReward(address to, uint256 amount) external nonReentrant returns (bool) {
        require(amount <= MAX_REWARD_AMOUNT, "Staking: Amount exceeds maximum allowed");
        require(balanceOf(address(this)) >= amount, "Faucet: Insufficient balance in contract");
        require(msg.sender == stakingContract, "Only staking contract can transferReward");
        _transfer(address(this), to, amount);
        return true;
    }

    function faucet(uint256 amount) public nonReentrant {
        require(amount <= MAX_FAUCET_AMOUNT, "Faucet: Amount exceeds maximum allowed");
        require(balanceOf(address(this)) >= amount, "Faucet: Insufficient balance in contract");
        _transfer(address(this), msg.sender, amount);
    }
}