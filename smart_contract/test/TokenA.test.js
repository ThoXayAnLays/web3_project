const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TokenA", function () {
    let TokenA;
    let tokenA;
    let owner;
    let addr1;
    let addr2;

    beforeEach(async function () {
        TokenA = await ethers.getContractFactory("TokenA");
        [owner, addr1, addr2] = await ethers.getSigners();
        tokenA = await TokenA.deploy();
    });

    describe("Deployment", function () {
        it("Should set the right name and symbol", async function () {
            expect(await tokenA.name()).to.equal("Token A");
            expect(await tokenA.symbol()).to.equal("TKA");
        });
    });

    describe("Minting", function () {
        it("Should mint tokens to an address", async function () {
            await tokenA.mint(addr1.address, 100);
            expect(await tokenA.balanceOf(addr1.address)).to.equal(100);
        });

        it("Should emit Transfer event on minting", async function () {
            await expect(tokenA.mint(addr1.address, 100))
                .to.emit(tokenA, "Transfer")
                .withArgs(ethers.ZeroAddress, addr1.address, 100);
        });
    });

    describe("Transfers", function () {
        it("Should transfer tokens between accounts", async function () {
            await tokenA.mint(addr1.address, 100);
            await tokenA.connect(addr1).transfer(addr2.address, 50);
            expect(await tokenA.balanceOf(addr1.address)).to.equal(50);
            expect(await tokenA.balanceOf(addr2.address)).to.equal(50);
        });

        it("Should fail if sender doesn't have enough tokens", async function () {
            await tokenA.mint(addr1.address, 100);
            await expect(
                tokenA.connect(addr1).transfer(addr2.address, 101)
            ).to.be.revertedWithCustomError(tokenA, "ERC20InsufficientBalance");
        });
    });
});
