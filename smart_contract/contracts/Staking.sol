// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./TokenA.sol";
import "./NFTB.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Staking is Ownable, ReentrancyGuard {
    TokenA public tokenA;
    NFTB public nftB;

    uint256 public constant LOCK_PERIOD = 30 seconds;
    uint256 public constant NFT_THRESHOLD = 1000000 * 10 ** 18;
    uint256 public baseAPR = 800;
    uint256 public nftBonusAPR = 200;

    struct Stake {
        uint256 amount;
        uint256 timestamp;
        uint256 nftDepositTime;
        uint256 nftCount;
        uint256 pendingReward;
        uint256 lockEndTime;
        uint256 mintedNFTCount;
        uint256 totalStakedAmount;
    }

    mapping(address => Stake) public stakes;
    mapping(address => uint256[]) public stakedNFTs;
    mapping(address => uint256) public mintedNFTs;

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

    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(
            tokenA.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );

        Stake storage stake = stakes[msg.sender];
        if (stake.amount > 0) {
            uint256 reward = calculateReward(msg.sender);
            stake.pendingReward += reward;
        }

        stake.amount += amount;
        stake.totalStakedAmount += amount;
        stake.timestamp = block.timestamp;
        stake.lockEndTime = block.timestamp + LOCK_PERIOD;

        if (stake.nftDepositTime > 0) {
            stake.nftDepositTime = block.timestamp;
        }

        uint256 totalNFTsEarned = stake.totalStakedAmount / NFT_THRESHOLD;
        uint256 nftsToMint = totalNFTsEarned > mintedNFTs[msg.sender] 
            ? totalNFTsEarned - mintedNFTs[msg.sender]
            : 0;

        for (uint256 i = 0; i < nftsToMint; i++) {
            uint256 tokenId = nftB.safeMint(msg.sender);
            emit NFTMinted(msg.sender, tokenId);
        }
        mintedNFTs[msg.sender] += nftsToMint;

        emit Deposited(msg.sender, amount);
    }

    function getOwnedNFTs(address user) external view returns (uint256[] memory) {
        uint256 balance = nftB.balanceOf(user);
        uint256[] memory ownedNFTs = new uint256[](balance);
        uint256 index = 0;
        uint256 tokenId = 0;

        while (index < balance) {
            if (nftB.ownerOf(tokenId) == user) {
                ownedNFTs[index] = tokenId;
                index++;
            }
            tokenId++;
        }

        return ownedNFTs;
    }

    function depositNFT(uint256 tokenId) external nonReentrant {
        require(nftB.ownerOf(tokenId) == msg.sender, "You don't own this NFT");
        nftB.transferFrom(msg.sender, address(this), tokenId);

        Stake storage stake = stakes[msg.sender];

        if (stake.amount > 0) {
            uint256 reward = calculateReward(msg.sender);
            stake.pendingReward += reward;
        }

        stake.nftDepositTime = block.timestamp;

        stake.nftCount++;
        stakedNFTs[msg.sender].push(tokenId);

        stake.timestamp = block.timestamp;

        emit NFTDeposited(msg.sender, tokenId);
    }

    function withdraw() external nonReentrant {
        Stake storage stake = stakes[msg.sender];
        require(stake.amount > 0, "No stake to withdraw");
        require(
            block.timestamp >= stake.lockEndTime,
            "Tokens are still locked"
        );

        uint256 reward = calculateReward(msg.sender) + stake.pendingReward;

        require(
            tokenA.transfer(msg.sender, stake.amount),
            "Staked amount transfer failed"
        );
        require(
            tokenA.transferReward(msg.sender, reward),
            "Reward transfer failed"
        );

        for (uint256 i = 0; i < stakedNFTs[msg.sender].length; i++) {
            uint256 tokenId = stakedNFTs[msg.sender][i];
            nftB.transferFrom(address(this), msg.sender, tokenId);
            emit NFTWithdrawn(msg.sender, tokenId);
        }

        emit Withdrawn(msg.sender, stake.amount, reward);
        emit RewardClaimed(msg.sender, reward);

        delete stakedNFTs[msg.sender];
        delete stakes[msg.sender];
    }

    function getStakeDetails(
        address user
    )
        public
        view
        returns (
            uint256 stakedAmount,
            uint256 pendingReward,
            uint256 calculatedReward,
            uint256 lockEndTime
        )
    {
        Stake storage stake = stakes[user];
        stakedAmount = stake.amount;
        pendingReward = stake.pendingReward;
        calculatedReward = calculateReward(user);
        lockEndTime = stake.lockEndTime;
    }

    function getContractBalance() public view returns (uint256) {
        return tokenA.balanceOf(address(this));
    }

    function getRemainingLockTime(address user) public view returns (uint256) {
        Stake storage stake = stakes[user];
        if (stake.amount == 0 || block.timestamp >= stake.lockEndTime) return 0;
        return stake.lockEndTime - block.timestamp;
    }

    function withdrawNFTs(uint256[] calldata tokenIds) external nonReentrant {
        Stake storage stake = stakes[msg.sender];
        require(stake.nftCount > 0, "No NFTs to withdraw");
        require(tokenIds.length > 0, "No NFTs selected for withdrawal");
        require(
            tokenIds.length <= stake.nftCount,
            "Attempting to withdraw more NFTs than staked"
        );

        uint256 reward = calculateReward(msg.sender);
        stake.pendingReward += reward;
        stake.timestamp = block.timestamp;

        uint256 withdrawnCount = 0;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            bool found = false;
            for (uint256 j = 0; j < stakedNFTs[msg.sender].length; j++) {
                if (stakedNFTs[msg.sender][j] == tokenId) {
                    nftB.transferFrom(address(this), msg.sender, tokenId);
                    stakedNFTs[msg.sender][j] = stakedNFTs[msg.sender][
                        stakedNFTs[msg.sender].length - 1
                    ];
                    stakedNFTs[msg.sender].pop();
                    emit NFTWithdrawn(msg.sender, tokenId);
                    withdrawnCount++;
                    found = true;
                    break;
                }
            }
            require(found, "NFT not found in staked NFTs");
        }

        stake.nftCount -= withdrawnCount;

        if (stake.nftDepositTime > 0) {
            stake.nftDepositTime = block.timestamp;
        }
    }

    function claimReward() external nonReentrant {
        Stake storage stake = stakes[msg.sender];
        require(stake.amount > 0, "No stake to claim reward from");

        uint256 reward = calculateReward(msg.sender) + stake.pendingReward;
        require(reward > 0, "No reward to claim");

        require(
            tokenA.transferReward(msg.sender, reward),
            "Reward transfer failed"
        );

        stake.pendingReward = 0;
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
            uint256 baseReward = Math.mulDiv(
                stake.amount * baseAPR * (stake.nftDepositTime - stake.timestamp),
                1,
                365 days * 10000
            );
            uint256 bonusReward = Math.mulDiv(
                stake.amount * (baseAPR + nftBonusAPR * stake.nftCount) * (block.timestamp - stake.nftDepositTime),
                1,
                365 days * 10000
            );
            reward = baseReward + bonusReward;
        } else {
            reward = Math.mulDiv(
                stake.amount * baseAPR * duration,
                1,
                365 days * 10000
            );
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

    function getMintedNFTCount(address user) external view returns (uint256) {
        return mintedNFTs[user];
    }

    function getStakedNFTCount(address user) external view returns (uint256) {
        return stakes[user].nftCount;
    }
}