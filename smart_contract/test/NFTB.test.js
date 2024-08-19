const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFTB", function () {
    let NFTB;
    let nftB;
    let owner;
    let addr1;
    let addr2;

    beforeEach(async function () {
        NFTB = await ethers.getContractFactory("NFTB");
        [owner, addr1, addr2] = await ethers.getSigners();
        nftB = await NFTB.deploy();
    });

    describe("Deployment", function () {
        it("Should set the right name and symbol", async function () {
            expect(await nftB.name()).to.equal("NFT B");
            expect(await nftB.symbol()).to.equal("NFTB");
        });
    });

    describe("Minting", function () {
        it("Should mint a new token and assign it to the recipient", async function () {
            await nftB.mint(addr1.address);
            expect(await nftB.ownerOf(1)).to.equal(addr1.address);
        });

        it("Should increment the token counter correctly", async function () {
            await nftB.mint(addr1.address);
            await nftB.mint(addr2.address);
            expect(await nftB.ownerOf(2)).to.equal(addr2.address);
        });

        it("Should emit Transfer event on minting", async function () {
            await expect(nftB.mint(addr1.address))
                .to.emit(nftB, "Transfer")
                .withArgs(ethers.ZeroAddress, addr1.address, 1);
        });

        it("Should return the correct token ID", async function () {
            const tx = await nftB.mint(addr1.address);
            const receipt = await tx.wait();
            const transferEvent = receipt.logs.find(
                (log) => log.eventName === "Transfer"
            );
            expect(transferEvent.args.tokenId).to.equal(1);
        });
    });

    describe("Token Transfers", function () {
        beforeEach(async function () {
            await nftB.mint(addr1.address);
        });

        it("Should transfer tokens between accounts", async function () {
            await nftB
                .connect(addr1)
                .transferFrom(addr1.address, addr2.address, 1);
            expect(await nftB.ownerOf(1)).to.equal(addr2.address);
        });

        it("Should fail if the sender is not the owner", async function () {
            await expect(
                nftB
                    .connect(addr2)
                    .transferFrom(addr1.address, addr2.address, 1)
            ).to.be.revertedWithCustomError(nftB, "ERC721InsufficientApproval");
        });
    });
});
