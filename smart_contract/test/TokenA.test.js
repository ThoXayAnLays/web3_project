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
        it("Should set the right owner", async function () {
            expect(await tokenA.owner()).to.equal(owner.address);
        });

        it("Should assign the total supply of tokens to the contract", async function () {
            const totalSupply = await tokenA.totalSupply();
            expect(await tokenA.balanceOf(tokenA.getAddress())).to.equal(
                totalSupply
            );
        });
    });

    describe("Transactions", function () {
        it("Should transfer tokens between accounts", async function () {
            // Transfer 50 tokens from owner to addr1
            await tokenA.transfer(addr1.address, 50);
            expect(await tokenA.balanceOf(addr1.address)).to.equal(50);

            // Transfer 50 tokens from addr1 to addr2
            await tokenA.connect(addr1).transfer(addr2.address, 50);
            expect(await tokenA.balanceOf(addr2.address)).to.equal(50);
        });

        it("Should fail if sender doesn't have enough tokens", async function () {
            const initialOwnerBalance = await tokenA.balanceOf(owner.address);

            // Try to send 1 token from addr1 (0 tokens) to owner
            await expect(
                tokenA.connect(addr1).transfer(owner.address, 1)
            ).to.be.revertedWith("ERC20: transfer amount exceeds balance");

            // Owner balance shouldn't have changed
            expect(await tokenA.balanceOf(owner.address)).to.equal(
                initialOwnerBalance
            );
        });
    });
});
