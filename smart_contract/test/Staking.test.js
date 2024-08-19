const { expect } = require("chai");
const { ethers } = require("hardhat");

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

        // Deploy TokenA
        TokenA = await ethers.getContractFactory("TokenA");
        tokenA = await TokenA.deploy();

        // Deploy NFTB
        NFTB = await ethers.getContractFactory("NFTB");
        nftB = await NFTB.deploy();

        // Deploy Staking
        Staking = await ethers.getContractFactory("Staking");
        staking = await Staking.deploy(
            await tokenA.getAddress(),
            await nftB.getAddress()
        );

        // Mint some tokens for testing
        await tokenA.mint(addr1.address, ethers.parseEther("2000000"));
        await tokenA.mint(addr2.address, ethers.parseEther("2000000"));

        // Approve staking contract to spend tokens
        await tokenA
            .connect(addr1)
            .approve(await staking.getAddress(), ethers.MaxUint256);
        await tokenA
            .connect(addr2)
            .approve(await staking.getAddress(), ethers.MaxUint256);
    });

    describe("Deployment", function () {
        it("Should set the correct TokenA and NFTB addresses", async function () {
            expect(await staking.tokenA()).to.equal(await tokenA.getAddress());
            expect(await staking.nftB()).to.equal(await nftB.getAddress());
        });

        it("Should set the correct owner", async function () {
            expect(await staking.owner()).to.equal(owner.address);
        });
    });

    describe("Depositing", function () {
        it("Should allow users to deposit TokenA", async function () {
            await staking
                .connect(addr1)
                .depositTokenA(ethers.parseEther("1000000"));
            const deposit = await staking.deposits(addr1.address);
            expect(deposit.amount).to.equal(ethers.parseEther("1000000"));
        });

        it("Should mint NFTB when depositing over the minimum amount", async function () {
            await staking
                .connect(addr1)
                .depositTokenA(ethers.parseEther("1000000"));
            const deposit = await staking.deposits(addr1.address);
            expect(deposit.hasNFT).to.be.true;
        });

        it("Should not mint NFTB when depositing under the minimum amount", async function () {
            await staking
                .connect(addr1)
                .depositTokenA(ethers.parseEther("500000"));
            const deposit = await staking.deposits(addr1.address);
            expect(deposit.hasNFT).to.be.false;
        });
    });

    describe("Withdrawing", function () {
        beforeEach(async function () {
            await staking
                .connect(addr1)
                .depositTokenA(ethers.parseEther("1000000"));
            await ethers.provider.send("evm_increaseTime", [300]); // 5 minutes
            await ethers.provider.send("evm_mine");
        });

        it("Should allow users to withdraw their tokens after the lock period", async function () {
            await staking.connect(addr1).withdraw(false);
            expect(await tokenA.balanceOf(addr1.address)).to.be.above(
                ethers.parseEther("1000000")
            );
        });

        it("Should allow users to claim rewards without withdrawing principal", async function () {
            const initialBalance = await tokenA.balanceOf(addr1.address);
            await staking.connect(addr1).withdraw(true);
            expect(await tokenA.balanceOf(addr1.address)).to.be.above(
                initialBalance
            );
        });
    });

    describe("Reward Calculation", function () {
        it("Should calculate rewards correctly", async function () {
            await staking
                .connect(addr1)
                .depositTokenA(ethers.parseEther("1000000"));
            await ethers.provider.send("evm_increaseTime", [
                365 * 24 * 60 * 60,
            ]); // 1 year
            await ethers.provider.send("evm_mine");
            const reward = await staking.calculateReward(addr1.address);
            expect(reward).to.be.closeTo(
                ethers.parseEther("100000"),
                ethers.parseEther("1")
            ); // 10% APR (8% base + 2% NFT)
        });
    });

    describe("APR Updates", function () {
        it("Should allow the owner to update the base APR", async function () {
            await staking.connect(owner).updateBaseAPR(1000); // 10%
            expect(await staking.baseAPR()).to.equal(1000);
        });

        it("Should not allow non-owners to update the base APR", async function () {
            await expect(
                staking.connect(addr1).updateBaseAPR(1000)
            ).to.be.revertedWithCustomError(
                staking,
                "OwnableUnauthorizedAccount"
            );
        });
    });
});
