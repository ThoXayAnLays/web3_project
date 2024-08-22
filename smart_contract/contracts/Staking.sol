// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./TokenA.sol";
import "./NFTB.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract Staking is Ownable {
    TokenA public tokenA;
    NFTB public nftB;

    uint256 public constant LOCK_PERIOD = 5 minutes;
    uint256 public constant NFT_THRESHOLD = 1000000 * 10 ** 18;
    uint256 public baseAPR = 800; // 8% in basis points
    uint256 public nftBonusAPR = 200; // 2% in basis points

    struct Stake {
        uint256 amount;
        uint256 timestamp;
        uint256 nftDepositTime;
        uint256 nftCount;
    }

    mapping(address => Stake) public stakes;
    mapping(address => uint256[]) public stakedNFTs;

    event Deposited(address indexed user, uint256 amount);
    event NFTDeposited(address indexed user, uint256 tokenId);
    event Withdrawn(address indexed user, uint256 amount, uint256 reward);
    event RewardClaimed(address indexed user, uint256 reward);
    event APRUpdated(uint256 newBaseAPR);
    event NFTMinted(address indexed user, uint256 tokenId);
    event NFTWithdrawn(address indexed user, uint256 tokenId);

    constructor(address _tokenA, address _nftB) Ownable(msg.sender) {
        tokenA = TokenA(_tokenA);
        nftB = NFTB(_nftB);
    }

     function deposit(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(tokenA.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        Stake storage stake = stakes[msg.sender];
        if (stake.amount > 0) {
            uint256 reward = calculateReward(msg.sender);
            stake.amount += reward;
        }

        stake.amount += amount;
        stake.timestamp = block.timestamp;

        if (stake.amount >= NFT_THRESHOLD) {
            uint256 tokenId = nftB.safeMint(msg.sender);
            emit NFTMinted(msg.sender, tokenId);
        }

        emit Deposited(msg.sender, amount);
    }

    function depositNFT(uint256 tokenId) external {
        require(nftB.ownerOf(tokenId) == msg.sender, "You don't own this NFT");
        nftB.transferFrom(msg.sender, address(this), tokenId);

        Stake storage stake = stakes[msg.sender];
        if (stake.nftDepositTime == 0) {
            stake.nftDepositTime = block.timestamp;
        }
        stake.nftCount++;
        stakedNFTs[msg.sender].push(tokenId);

        emit NFTDeposited(msg.sender, tokenId);
    }

    function withdraw() external {
        Stake storage stake = stakes[msg.sender];
        require(stake.amount > 0, "No stake to withdraw");
        require(
            block.timestamp >= stake.timestamp + LOCK_PERIOD,
            "Tokens are still locked"
        );

        uint256 reward = calculateReward(msg.sender);
        uint256 totalAmount = stake.amount + reward;

        require(tokenA.transfer(msg.sender, totalAmount), "Transfer failed");

        emit Withdrawn(msg.sender, stake.amount, reward);

        delete stakes[msg.sender];
    }

    function withdrawNFTs() external {
        Stake storage stake = stakes[msg.sender];
        require(stake.nftCount > 0, "No NFTs to withdraw");

        uint256 reward = calculateReward(msg.sender);
        require(tokenA.transfer(msg.sender, reward), "Reward transfer failed");

        uint256[] storage userNFTs = stakedNFTs[msg.sender];
        for (uint256 i = 0; i < userNFTs.length; i++) {
            nftB.transferFrom(address(this), msg.sender, userNFTs[i]);
            emit NFTWithdrawn(msg.sender, userNFTs[i]);
        }

        stake.nftCount = 0;
        stake.nftDepositTime = 0;
        delete stakedNFTs[msg.sender];

        stake.timestamp = block.timestamp;

        emit RewardClaimed(msg.sender, reward);
    }

    function claimReward() external {
        uint256 reward = calculateReward(msg.sender);
        require(reward > 0, "No reward to claim");

        require(tokenA.transfer(msg.sender, reward), "Transfer failed");

        Stake storage stake = stakes[msg.sender];
        stake.timestamp = block.timestamp;
        if (stake.nftDepositTime > 0) {
            stake.nftDepositTime = block.timestamp;
        }

        emit RewardClaimed(msg.sender, reward);
    }

    function calculateReward(address user) public view returns (uint256) {
        Stake storage stake = stakes[user];
        if (stake.amount == 0) return 0;

        uint256 duration = block.timestamp - stake.timestamp;
        uint256 reward;

        if (stake.nftDepositTime > 0) {
            uint256 baseReward = (stake.amount *
                baseAPR *
                (stake.nftDepositTime - stake.timestamp)) / (365 days * 10000);
            uint256 bonusReward = (stake.amount *
                (baseAPR + nftBonusAPR * stake.nftCount) *
                (block.timestamp - stake.nftDepositTime)) / (365 days * 10000);
            reward = baseReward + bonusReward;
        } else {
            reward = (stake.amount * baseAPR * duration) / (365 days * 10000);
        }

        return reward;
    }

    function getCurrentAPR(address user) public view returns (uint256) {
        Stake storage stake = stakes[user];
        if (stake.nftCount == 0) {
            return baseAPR;
        } else {
            return baseAPR + nftBonusAPR * stake.nftCount;
        }
    }

    function updateBaseAPR(uint256 newBaseAPR) external onlyOwner {
        baseAPR = newBaseAPR;
        emit APRUpdated(newBaseAPR);
    }
}
