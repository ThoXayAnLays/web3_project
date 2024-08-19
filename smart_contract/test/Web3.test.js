const { expect } = require("chai");
const { ethers } = require("hardhat");

xdescribe("TokenAAndNFTB", function () {
    let TokenAAndNFTB, tokenAAndNFTB, owner, addr1, addr2;
    const MINUTE = 60;
    const DAY = 86400;

    beforeEach(async function () {
        // Deploy a new TokenAAndNFTB contract before each test
        TokenAAndNFTB = await ethers.getContractFactory("TokenAAndNFTB");
        [owner, addr1, addr2] = await ethers.getSigners();
        tokenAAndNFTB = await TokenAAndNFTB.deploy();
        await tokenAAndNFTB.deployed();
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await tokenAAndNFTB.owner()).to.equal(owner.address);
        });

        it("Should have correct name and symbol for ERC20 token", async function () {
            expect(await tokenAAndNFTB.name()).to.equal("Token A");
            expect(await tokenAAndNFTB.symbol()).to.equal("TKA");
        });

        it("Should have correct name and symbol for ERC721 token", async function () {
            expect(await tokenAAndNFTB.name()).to.equal("NFT B");
            expect(await tokenAAndNFTB.symbol()).to.equal("NFTB");
        });
    });

    describe("Minting Token A", function () {
        it("Should allow owner to mint tokens", async function () {
            await tokenAAndNFTB.mintTokenA(addr1.address, ethers.utils.parseEther("100"));
            expect(await tokenAAndNFTB.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("100"));
        });

        it("Should not allow non-owner to mint tokens", async function () {
            await expect(
                tokenAAndNFTB.connect(addr1).mintTokenA(addr2.address, ethers.utils.parseEther("100"))
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    describe("Depositing Token A", function () {
        beforeEach(async function () {
            // Mint some tokens to addr1 before each test in this block
            await tokenAAndNFTB.mintTokenA(addr1.address, ethers.utils.parseEther("1000000"));
        });

        it("Should allow users to deposit tokens", async function () {
            await tokenAAndNFTB.connect(addr1).depositTokenA(ethers.utils.parseEther("100"));
            const deposit = await tokenAAndNFTB.deposits(addr1.address);
            expect(deposit.amount).to.equal(ethers.utils.parseEther("100"));
        });

        it("Should mint NFT when deposit reaches 1 million tokens", async function () {
            await tokenAAndNFTB.connect(addr1).depositTokenA(ethers.utils.parseEther("1000000"));
            expect(await tokenAAndNFTB.balanceOf(addr1.address, 1)).to.equal(1);
        });

        it("Should not allow deposit of 0 tokens", async function () {
            await expect(
                tokenAAndNFTB.connect(addr1).depositTokenA(0)
            ).to.be.revertedWith("Amount must be greater than 0");
        });

        it("Should not allow deposit of more tokens than balance", async function () {
            await expect(
                tokenAAndNFTB.connect(addr1).depositTokenA(ethers.utils.parseEther("1000001"))
            ).to.be.revertedWith("Insufficient balance");
        });
    });

    describe("Withdrawing and Claiming Rewards", function () {
        beforeEach(async function () {
            await tokenAAndNFTB.mintTokenA(addr1.address, ethers.utils.parseEther("1000000"));
            await tokenAAndNFTB.connect(addr1).depositTokenA(ethers.utils.parseEther("1000000"));
        });

        it("Should not allow withdrawal before lock period", async function () {
            await expect(
                tokenAAndNFTB.connect(addr1).withdraw(false)
            ).to.be.revertedWith("Tokens are still locked");
        });

        it("Should allow withdrawal after lock period", async function () {
            // Fast forward time by 6 minutes
            await ethers.provider.send("evm_increaseTime", [6 * MINUTE]);
            await ethers.provider.send("evm_mine");

            await tokenAAndNFTB.connect(addr1).withdraw(false);
            expect(await tokenAAndNFTB.balanceOf(addr1.address)).to.be.gt(ethers.utils.parseEther("1000000"));
        });

        it("Should allow claiming rewards without withdrawing", async function () {
            // Fast forward time by 1 day
            await ethers.provider.send("evm_increaseTime", [DAY]);
            await ethers.provider.send("evm_mine");

            const initialBalance = await tokenAAndNFTB.balanceOf(addr1.address);
            await tokenAAndNFTB.connect(addr1).withdraw(true);
            const finalBalance = await tokenAAndNFTB.balanceOf(addr1.address);
            expect(finalBalance).to.be.gt(initialBalance);
        });
    });

    describe("Reward Calculation", function () {
        beforeEach(async function () {
            await tokenAAndNFTB.mintTokenA(addr1.address, ethers.utils.parseEther("1000000"));
            await tokenAAndNFTB.connect(addr1).depositTokenA(ethers.utils.parseEther("1000000"));
        });

        it("Should calculate correct reward with NFT boost", async function () {
            // Fast forward time by 1 day
            await ethers.provider.send("evm_increaseTime", [DAY]);
            await ethers.provider.send("evm_mine");

            const reward = await tokenAAndNFTB.calculateReward(addr1.address);
            // Expected reward: 1000000 * 10% * 1/365 = 273.97 tokens
            expect(reward).to.be.closeTo(ethers.utils.parseEther("273.97"), ethers.utils.parseEther("0.01"));
        });
    });

    describe("Updating APR", function () {
        it("Should allow owner to update base APR", async function () {
            await tokenAAndNFTB.updateBaseAPR(1000); // 10%
            expect(await tokenAAndNFTB.baseAPR()).to.equal(1000);
        });

        it("Should not allow non-owner to update base APR", async function () {
            await expect(
                tokenAAndNFTB.connect(addr1).updateBaseAPR(1000)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });
});