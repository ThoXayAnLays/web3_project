const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Staking", function () {
    let TokenA;
    let tokenA;
    let NFTB;
    let nftB;
    let Staking;
    let staking;
    let owner;
    let addr1;
    let addr2;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();

        TokenA = await ethers.getContractFactory("TokenA");
        tokenA = await TokenA.deploy();

        NFTB = await ethers.getContractFactory("NFTB");
        nftB = await NFTB.deploy();

        Staking = await ethers.getContractFactory("Staking");
        staking = await Staking.deploy(
            await tokenA.getAddress(),
            await nftB.getAddress()
        );

        // Transfer some tokens to addr1 for testing
        await tokenA.transfer(addr1.address, ethers.parseEther("10000000"));
        await tokenA
            .connect(addr1)
            .approve(staking.getAddress(), ethers.parseEther("10000000"));

        // Set approval for all for NFTB
        await nftB.connect(addr1).setApprovalForAll(staking.getAddress(), true);
    });

    describe("Deposit", function () {
        it("Should allow users to deposit tokens", async function () {
            await staking.connect(addr1).deposit(ethers.parseEther("1000"));
            const stake = await staking.stakes(addr1.address);
            expect(stake.amount).to.equal(ethers.parseEther("1000"));
        });

        it("Should mint NFT when deposit threshold is reached", async function () {
            await staking.connect(addr1).deposit(ethers.parseEther("1000000"));
            const stake = await staking.stakes(addr1.address);
            expect(stake.nftCount).to.equal(1);
        });
    });

    describe("NFT Deposit", function () {
        it("Should allow users to deposit NFTs", async function () {
            await staking.connect(addr1).deposit(ethers.parseEther("1000000"));
            const stake = await staking.stakes(addr1.address);
            const tokenId = stake.nftCount; // Assuming the first NFT has ID 1
            await nftB.connect(addr1).approve(staking.getAddress(), tokenId);
            await staking.connect(addr1).depositNFT(tokenId);
            const updatedStake = await staking.stakes(addr1.address);
            expect(updatedStake.nftCount).to.equal(2);
        });
    });

    describe("Reward Calculation", function () {
        it("Should calculate rewards correctly", async function () {
            await staking.connect(addr1).deposit(ethers.parseEther("1000"));
            await time.increase(365 * 24 * 60 * 60); // Increase time by 1 year
            const reward = await staking.calculateReward(addr1.address);
            expect(reward).to.be.closeTo(
                ethers.parseEther("80"),
                ethers.parseEther("1")
            ); // 8% APR
        });

        it("Should calculate rewards with NFT bonus correctly", async function () {
            await staking.connect(addr1).deposit(ethers.parseEther("1000000"));
            const stake = await staking.stakes(addr1.address);
            const tokenId = stake.nftCount; // Assuming the first NFT has ID 1
            await nftB.connect(addr1).approve(staking.getAddress(), tokenId);
            await staking.connect(addr1).depositNFT(tokenId);
            await time.increase(365 * 24 * 60 * 60); // Increase time by 1 year
            const reward = await staking.calculateReward(addr1.address);
            expect(reward).to.be.closeTo(
                ethers.parseEther("100000"),
                ethers.parseEther("1000")
            ); // 10% APR (8% base + 2% NFT bonus)
        });
    });

    describe("Withdraw", function () {
        it("Should allow users to withdraw after lock period", async function () {
            await staking.connect(addr1).deposit(ethers.parseEther("1000"));
            await time.increase(6 * 60); // Increase time by 6 minutes (past lock period)
            await staking.connect(addr1).withdraw();
            expect(await tokenA.balanceOf(addr1.address)).to.be.gt(
                ethers.parseEther("9000")
            );
        });

        it("Should not allow withdrawals during lock period", async function () {
            await staking.connect(addr1).deposit(ethers.parseEther("1000"));
            await expect(staking.connect(addr1).withdraw()).to.be.revertedWith(
                "Tokens are still locked"
            );
        });
    });

    describe("Claim Reward", function () {
        it("Should allow users to claim rewards", async function () {
            await staking.connect(addr1).deposit(ethers.parseEther("1000"));
            await time.increase(365 * 24 * 60 * 60); // Increase time by 1 year
            const initialBalance = await tokenA.balanceOf(addr1.address);
            await staking.connect(addr1).claimReward();
            const finalBalance = await tokenA.balanceOf(addr1.address);
            expect(finalBalance).to.be.gt(initialBalance);
        });
    });

    describe("Admin Functions", function () {
        it("Should allow owner to update base APR", async function () {
            await staking.connect(owner).updateBaseAPR(1000); // Set APR to 10%
            expect(await staking.baseAPR()).to.equal(1000);
        });

        it("Should not allow non-owners to update base APR", async function () {
            await expect(
                staking.connect(addr1).updateBaseAPR(1000)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    describe("Comprehensive Tests", function () {
        it("Should handle multiple deposits and NFT stakes correctly", async function () {
            // First deposit
            await staking.connect(addr1).deposit(ethers.parseEther("500000"));
            let stake = await staking.stakes(addr1.address);
            expect(stake.amount).to.equal(ethers.parseEther("500000"));
            expect(stake.nftCount).to.equal(0);

            // Second deposit, should mint NFT
            await staking.connect(addr1).deposit(ethers.parseEther("500000"));
            stake = await staking.stakes(addr1.address);
            expect(stake.amount).to.equal(ethers.parseEther("1000000"));
            expect(stake.nftCount).to.equal(1);

            // Deposit NFT
            const tokenId = 1; // Assuming the first NFT has ID 1
            await nftB.connect(addr1).approve(staking.getAddress(), tokenId);
            await staking.connect(addr1).depositNFT(tokenId);
            stake = await staking.stakes(addr1.address);
            expect(stake.nftCount).to.equal(2);

            // Third deposit, should not mint new NFT
            await staking.connect(addr1).deposit(ethers.parseEther("500000"));
            stake = await staking.stakes(addr1.address);
            expect(stake.amount).to.equal(ethers.parseEther("1500000"));
            expect(stake.nftCount).to.equal(2);
        });

        it("Should calculate rewards correctly with multiple deposits and NFT stakes", async function () {
            // Initial deposit
            await staking.connect(addr1).deposit(ethers.parseEther("1000000"));
            await time.increase(180 * 24 * 60 * 60); // Increase time by 180 days

            // Second deposit
            await staking.connect(addr1).deposit(ethers.parseEther("500000"));
            await time.increase(90 * 24 * 60 * 60); // Increase time by 90 days

            // Deposit NFT
            const tokenId = 1; // Assuming the first NFT has ID 1
            await nftB.connect(addr1).approve(staking.getAddress(), tokenId);
            await staking.connect(addr1).depositNFT(tokenId);
            await time.increase(95 * 24 * 60 * 60); // Increase time by 95 days

            const reward = await staking.calculateReward(addr1.address);

            // Expected reward calculation:
            // 1000000 * 8% * (180/365) + 1500000 * 8% * (90/365) + 1500000 * 10% * (95/365) ≈ 39452.05479452054794520547945205479
            expect(reward).to.be.closeTo(
                ethers.parseEther("39452"),
                ethers.parseEther("1")
            );
        });

        it("Should handle withdraw and claim reward correctly", async function () {
            await staking.connect(addr1).deposit(ethers.parseEther("1000000"));
            await time.increase(365 * 24 * 60 * 60); // Increase time by 1 year

            const initialBalance = await tokenA.balanceOf(addr1.address);
            await staking.connect(addr1).withdraw();
            const finalBalance = await tokenA.balanceOf(addr1.address);

            // Expected balance increase: 1000000 + (1000000 * 8%) = 1080000
            expect(finalBalance.sub(initialBalance)).to.be.closeTo(
                ethers.parseEther("1080000"),
                ethers.parseEther("1")
            );

            // Stake should be cleared
            const stake = await staking.stakes(addr1.address);
            expect(stake.amount).to.equal(0);
            expect(stake.nftCount).to.equal(0);
        });

        it("Should handle APR updates correctly", async function () {
            await staking.connect(addr1).deposit(ethers.parseEther("1000000"));
            await time.increase(180 * 24 * 60 * 60); // Increase time by 180 days

            // Update APR
            await staking.connect(owner).updateBaseAPR(1000); // Set APR to 10%
            await time.increase(185 * 24 * 60 * 60); // Increase time by 185 days

            const reward = await staking.calculateReward(addr1.address);

            // Expected reward calculation:
            // 1000000 * 8% * (180/365) + 1000000 * 10% * (185/365) ≈ 89589.041095890410958904109589041096
            expect(reward).to.be.closeTo(
                ethers.parseEther("89589"),
                ethers.parseEther("1")
            );
        });
    });
});
