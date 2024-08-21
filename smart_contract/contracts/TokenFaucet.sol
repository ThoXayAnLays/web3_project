// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenFaucet is Ownable {
    IERC20 public tokenA;
    uint256 public amountPerRequest;
    mapping(address => uint256) public lastRequestTime;
    uint256 public cooldownPeriod;

    event TokensDistributed(address recipient, uint256 amount);

    constructor(
        address _tokenA,
        uint256 _amountPerRequest,
        uint256 _cooldownPeriod
    ) Ownable(msg.sender) {
        tokenA = IERC20(_tokenA);
        amountPerRequest = _amountPerRequest;
        cooldownPeriod = _cooldownPeriod;
    }

    function requestTokens() external {
        require(
            block.timestamp >= lastRequestTime[msg.sender] + cooldownPeriod,
            "Please wait before requesting again"
        );
        require(
            tokenA.balanceOf(address(this)) >= amountPerRequest,
            "Faucet is empty"
        );

        lastRequestTime[msg.sender] = block.timestamp;
        require(
            tokenA.transfer(msg.sender, amountPerRequest),
            "Token transfer failed"
        );

        emit TokensDistributed(msg.sender, amountPerRequest);
    }

    function withdrawTokens(uint256 amount) external onlyOwner {
        require(tokenA.transfer(owner(), amount), "Token withdrawal failed");
    }

    function setAmountPerRequest(uint256 _amountPerRequest) external onlyOwner {
        amountPerRequest = _amountPerRequest;
    }

    function setCooldownPeriod(uint256 _cooldownPeriod) external onlyOwner {
        cooldownPeriod = _cooldownPeriod;
    }
}
