const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Staking Contract", function () {
    let TokenA, tokenA, NFTB, nftB, Staking, staking;
    let owner, user1, user2;
    const LOCK_PERIOD = 30; // seconds
    const NFT_THRESHOLD = ethers.utils.parseEther("1000000");
    const BASE_APR = 800; // 8%
    const NFT_BONUS_APR = 200; // 2%

    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();

        TokenA = await ethers.getContractFactory("TokenA");
        tokenA = await TokenA.deploy();
        await tokenA.deployed();

        NFTB = await ethers.getContractFactory("NFTB");
        nftB = await NFTB.deploy();
        await nftB.deployed();

        Staking = await ethers.getContractFactory("Staking");
        staking = await Staking.deploy(tokenA.address, nftB.address);
        await staking.deployed();

        await tokenA.setStakingContract(staking.address);

        // Give some tokens to users for testing
        await tokenA.faucet(ethers.utils.parseEther("5000000"));
        await tokenA.transfer(
            user1.address,
            ethers.utils.parseEther("2000000")
        );
        await tokenA.transfer(
            user2.address,
            ethers.utils.parseEther("2000000")
        );
    });

    describe("Deposit", function () {
        it("Should allow users to deposit tokens", async function () {
            const depositAmount = ethers.utils.parseEther("100000");
            await tokenA.connect(user1).approve(staking.address, depositAmount);
            await expect(staking.connect(user1).deposit(depositAmount))
                .to.emit(staking, "Deposited")
                .withArgs(user1.address, depositAmount);

            const stake = await staking.stakes(user1.address);
            expect(stake.amount).to.equal(depositAmount);
        });

        it("Should mint NFT when deposit reaches threshold", async function () {
            const depositAmount = NFT_THRESHOLD;
            await tokenA.connect(user1).approve(staking.address, depositAmount);
            await expect(staking.connect(user1).deposit(depositAmount)).to.emit(
                staking,
                "NFTMinted"
            );

            const nftCount = await nftB.balanceOf(user1.address);
            expect(nftCount).to.equal(1);
        });
    });

    describe("NFT Deposit", function () {
        it("Should allow users to deposit NFTs", async function () {
            // First, mint an NFT for the user
            await nftB.safeMint(user1.address);
            const tokenId = 0; // First minted NFT

            await nftB.connect(user1).approve(staking.address, tokenId);
            await expect(staking.connect(user1).depositNFT(tokenId))
                .to.emit(staking, "NFTDeposited")
                .withArgs(user1.address, tokenId);

            const stake = await staking.stakes(user1.address);
            expect(stake.nftCount).to.equal(1);
        });
    });

    describe("Withdraw", function () {
        it("Should not allow withdrawal before lock period", async function () {
            const depositAmount = ethers.utils.parseEther("100000");
            await tokenA.connect(user1).approve(staking.address, depositAmount);
            await staking.connect(user1).deposit(depositAmount);

            await expect(staking.connect(user1).withdraw()).to.be.revertedWith(
                "Tokens are still locked"
            );
        });

        it("Should allow withdrawal after lock period", async function () {
            const depositAmount = ethers.utils.parseEther("100000");
            await tokenA.connect(user1).approve(staking.address, depositAmount);
            await staking.connect(user1).deposit(depositAmount);

            // Fast forward time
            await ethers.provider.send("evm_increaseTime", [LOCK_PERIOD + 1]);
            await ethers.provider.send("evm_mine");

            await expect(staking.connect(user1).withdraw()).to.emit(
                staking,
                "Withdrawn"
            );

            const stake = await staking.stakes(user1.address);
            expect(stake.amount).to.equal(0);
        });
    });

    describe("Reward Calculation", function () {
        it("Should calculate correct reward", async function () {
            const depositAmount = ethers.utils.parseEther("100000");
            await tokenA.connect(user1).approve(staking.address, depositAmount);
            await staking.connect(user1).deposit(depositAmount);

            // Fast forward time (1 day)
            await ethers.provider.send("evm_increaseTime", [86400]);
            await ethers.provider.send("evm_mine");

            const reward = await staking.calculateReward(user1.address);
            const expectedReward = depositAmount
                .mul(BASE_APR)
                .mul(86400)
                .div(365 * 24 * 3600)
                .div(10000);
            expect(reward).to.be.closeTo(
                expectedReward,
                ethers.utils.parseEther("0.01")
            );
        });

        it("Should calculate correct reward with NFT bonus", async function () {
            const depositAmount = ethers.utils.parseEther("100000");
            await tokenA.connect(user1).approve(staking.address, depositAmount);
            await staking.connect(user1).deposit(depositAmount);

            // Mint and deposit an NFT
            await nftB.safeMint(user1.address);
            const tokenId = 0;
            await nftB.connect(user1).approve(staking.address, tokenId);
            await staking.connect(user1).depositNFT(tokenId);

            // Fast forward time (1 day)
            await ethers.provider.send("evm_increaseTime", [86400]);
            await ethers.provider.send("evm_mine");

            const reward = await staking.calculateReward(user1.address);
            const expectedReward = depositAmount
                .mul(BASE_APR + NFT_BONUS_APR)
                .mul(86400)
                .div(365 * 24 * 3600)
                .div(10000);
            expect(reward).to.be.closeTo(
                expectedReward,
                ethers.utils.parseEther("0.01")
            );
        });
    });

    describe("APR Update", function () {
        it("Should allow to update base APR", async function () {
            const newBaseAPR = 1000; // 10%
            await expect(staking.connect(owner).updateBaseAPR(newBaseAPR))
                .to.emit(staking, "APRUpdated")
                .withArgs(newBaseAPR);

            const currentAPR = await staking.getCurrentAPR(user1.address);
            expect(currentAPR).to.equal(newBaseAPR);
        });
    });

    describe("Complex Staking Scenarios", function () {
        it("Should calculate correct reward after multiple deposits", async function () {
            const initialDeposit = ethers.utils.parseEther("500000");
            const additionalDeposit = ethers.utils.parseEther("300000");

            await tokenA
                .connect(user1)
                .approve(
                    staking.address,
                    initialDeposit.add(additionalDeposit)
                );
            await staking.connect(user1).deposit(initialDeposit);

            await ethers.provider.send("evm_increaseTime", [86400]);
            await ethers.provider.send("evm_mine");

            await staking.connect(user1).deposit(additionalDeposit);

            await ethers.provider.send("evm_increaseTime", [86400]);
            await ethers.provider.send("evm_mine");

            const stake = await staking.stakes(user1.address);
            const calculatedReward = await staking.calculateReward(
                user1.address
            );
            const totalReward = stake.pendingReward.add(calculatedReward);

            const rewardDay1 = initialDeposit
                .mul(BASE_APR)
                .mul(86400)
                .div(365 * 24 * 3600)
                .div(10000);
            const rewardDay2 = initialDeposit
                .add(additionalDeposit)
                .mul(BASE_APR)
                .mul(86400)
                .div(365 * 24 * 3600)
                .div(10000);
            const expectedReward = rewardDay1.add(rewardDay2);

            expect(totalReward).to.be.closeTo(
                expectedReward,
                ethers.utils.parseEther("0.1")
            );
        });

        it("Should calculate correct reward after depositing multiple NFTs", async function () {
            const depositAmount = ethers.utils.parseEther("1000000");
            await tokenA.connect(user1).approve(staking.address, depositAmount);
            await staking.connect(user1).deposit(depositAmount);

            await nftB.safeMint(user1.address);
            const tokenId1 = 0;
            await nftB.connect(user1).approve(staking.address, tokenId1);
            await staking.connect(user1).depositNFT(tokenId1);

            await ethers.provider.send("evm_increaseTime", [86400]);
            await ethers.provider.send("evm_mine");

            await nftB.safeMint(user1.address);
            const tokenId2 = 1;
            await nftB.connect(user1).approve(staking.address, tokenId2);
            await staking.connect(user1).depositNFT(tokenId2);

            await ethers.provider.send("evm_increaseTime", [86400]);
            await ethers.provider.send("evm_mine");

            const stake = await staking.stakes(user1.address);
            const calculatedReward = await staking.calculateReward(
                user1.address
            );
            const totalReward = stake.pendingReward.add(calculatedReward);

            const rewardDay1 = depositAmount
                .mul(BASE_APR + NFT_BONUS_APR)
                .mul(86400)
                .div(365 * 24 * 3600)
                .div(10000);
            const rewardDay2 = depositAmount
                .mul(BASE_APR + 2 * NFT_BONUS_APR)
                .mul(86400)
                .div(365 * 24 * 3600)
                .div(10000);
            const expectedReward = rewardDay1.add(rewardDay2);

            expect(totalReward).to.be.closeTo(
                expectedReward,
                ethers.utils.parseEther("0.1")
            );
        });

        it("Should calculate correct reward after withdrawing NFTs", async function () {
            const depositAmount = ethers.utils.parseEther("1000000");
            await tokenA.connect(user1).approve(staking.address, depositAmount);
            await staking.connect(user1).deposit(depositAmount);

            await nftB.safeMint(user1.address);
            await nftB.safeMint(user1.address);
            const tokenId1 = 0;
            const tokenId2 = 1;
            await nftB.connect(user1).approve(staking.address, tokenId1);
            await nftB.connect(user1).approve(staking.address, tokenId2);
            await staking.connect(user1).depositNFT(tokenId1);
            await staking.connect(user1).depositNFT(tokenId2);

            await ethers.provider.send("evm_increaseTime", [86400]);
            await ethers.provider.send("evm_mine");

            await staking.connect(user1).withdrawNFTs([tokenId1]);

            await ethers.provider.send("evm_increaseTime", [86400]);
            await ethers.provider.send("evm_mine");

            const stake = await staking.stakes(user1.address);
            const calculatedReward = await staking.calculateReward(
                user1.address
            );
            const totalReward = stake.pendingReward.add(calculatedReward);

            const rewardDay1 = depositAmount
                .mul(BASE_APR + 2 * NFT_BONUS_APR)
                .mul(86400)
                .div(365 * 24 * 3600)
                .div(10000);
            const rewardDay2 = depositAmount
                .mul(BASE_APR + NFT_BONUS_APR)
                .mul(86400)
                .div(365 * 24 * 3600)
                .div(10000);
            const expectedReward = rewardDay1.add(rewardDay2);

            expect(totalReward).to.be.closeTo(
                expectedReward,
                ethers.utils.parseEther("0.1")
            );
            expect(stake.nftCount).to.equal(1);
        });

        it("Should handle reward calculation correctly when depositing tokens after NFTs", async function () {
            const initialDeposit = ethers.utils.parseEther("500000");
            const additionalDeposit = ethers.utils.parseEther("300000");

            await tokenA
                .connect(user1)
                .approve(
                    staking.address,
                    initialDeposit.add(additionalDeposit)
                );
            await staking.connect(user1).deposit(initialDeposit);

            await nftB.safeMint(user1.address);
            const tokenId = 0;
            await nftB.connect(user1).approve(staking.address, tokenId);
            await staking.connect(user1).depositNFT(tokenId);

            await ethers.provider.send("evm_increaseTime", [86400]);
            await ethers.provider.send("evm_mine");

            await staking.connect(user1).deposit(additionalDeposit);

            await ethers.provider.send("evm_increaseTime", [86400]);
            await ethers.provider.send("evm_mine");

            const stake = await staking.stakes(user1.address);
            const calculatedReward = await staking.calculateReward(
                user1.address
            );
            const totalReward = stake.pendingReward.add(calculatedReward);

            const rewardDay1 = initialDeposit
                .mul(BASE_APR + NFT_BONUS_APR)
                .mul(86400)
                .div(365 * 24 * 3600)
                .div(10000);
            const rewardDay2 = initialDeposit
                .add(additionalDeposit)
                .mul(BASE_APR + NFT_BONUS_APR)
                .mul(86400)
                .div(365 * 24 * 3600)
                .div(10000);
            const expectedReward = rewardDay1.add(rewardDay2);

            expect(totalReward).to.be.closeTo(
                expectedReward,
                ethers.utils.parseEther("0.1")
            );
        });
    });
});
