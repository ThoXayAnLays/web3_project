// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./ITokenA.sol";
import "./INFTB.sol";

contract Staking is Ownable {
    using Math for uint256;

    ITokenA public tokenA;
    INFTB public nftB;
    
    // Struct to store deposit information
    struct Deposit {
        uint256 amount;
        uint256 depositTime;
        uint256 nftDepositTime;
        bool hasNFT;
    }

    // Mapping to store user deposits
    mapping(address => Deposit) public deposits;

    uint256 public baseAPR = 800; // 8% * 100 for precision
    uint256 public nftAPR = 200; // 2% * 100 for precision
    uint256 public constant LOCK_PERIOD = 5 minutes;
    uint256 public constant MIN_AMOUNT_FOR_NFT = 1_000_000 * 10**18; // Assuming 18 decimals

    event Deposited(address indexed user, uint256 amount);
    event NFTMinted(address indexed user, uint256 tokenId);
    event Withdrawn(address indexed user, uint256 amount, uint256 reward);
    event RewardClaimed(address indexed user, uint256 reward);
    event APRUpdated(uint256 newBaseAPR);

    constructor(address _tokenA, address _nftB) Ownable(msg.sender) {
        tokenA = ITokenA(_tokenA);
        nftB = INFTB(_nftB);
    }

    function depositTokenA(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(tokenA.balanceOf(msg.sender) >= amount, "Insufficient balance");

        // Transfer tokens from user to contract
        tokenA.transferFrom(msg.sender, address(this), amount);

        // Update or create deposit
        Deposit storage deposit = deposits[msg.sender];
        if (deposit.amount == 0) {
            deposit.amount = amount;
            deposit.depositTime = block.timestamp;
        } else {
            // If there's an existing deposit, calculate and add reward first
            uint256 reward = calculateReward(msg.sender);
            deposit.amount = deposit.amount + amount + reward;
            deposit.depositTime = block.timestamp;
        }

        // Mint NFT if eligible
        if (deposit.amount >= MIN_AMOUNT_FOR_NFT && !deposit.hasNFT) {
            uint256 tokenId = nftB.mint(msg.sender);
            deposit.hasNFT = true;
            deposit.nftDepositTime = block.timestamp;
            emit NFTMinted(msg.sender, tokenId);
        }

        emit Deposited(msg.sender, amount);
    }

    function withdraw(bool claimOnly) external {
        Deposit storage deposit = deposits[msg.sender];
        require(deposit.amount > 0, "No deposit found");
        require(block.timestamp >= deposit.depositTime + LOCK_PERIOD, "Tokens are still locked");

        uint256 reward = calculateReward(msg.sender);
        uint256 amountToWithdraw = claimOnly ? 0 : deposit.amount;

        if (claimOnly) {
            tokenA.mint(msg.sender, reward);
            emit RewardClaimed(msg.sender, reward);
        } else {
            //uint256 totalAmount = amountToWithdraw + reward;
            tokenA.transfer(msg.sender, amountToWithdraw);
            tokenA.mint(msg.sender, reward);
            delete deposits[msg.sender];
            emit Withdrawn(msg.sender, amountToWithdraw, reward);
        }
    }

    function calculateReward(address user) public view returns (uint256) {
        Deposit storage deposit = deposits[user];
        if (deposit.amount == 0) return 0;

        uint256 duration;
        uint256 rate;
        uint256 reward;

        if (deposit.hasNFT) {
            // Calculate reward for the period before NFT deposit
            duration = deposit.nftDepositTime - deposit.depositTime;
            rate = baseAPR;
            reward = (deposit.amount * rate * duration) / (10000 * 365 days);

            // Calculate reward for the period after NFT deposit
            duration = block.timestamp - deposit.nftDepositTime;
            rate = baseAPR + nftAPR;
            reward += (deposit.amount * rate * duration) / (10000 * 365 days);
        } else {
            duration = block.timestamp - deposit.depositTime;
            rate = baseAPR;
            reward = (deposit.amount * rate * duration) / (10000 * 365 days);
        }

        return reward;
    }

    // Function for admin to update base APR
    function updateBaseAPR(uint256 newBaseAPR) external onlyOwner {
        baseAPR = newBaseAPR;
        emit APRUpdated(newBaseAPR);
    }
}
