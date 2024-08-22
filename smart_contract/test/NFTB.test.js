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
        it("Should deploy successfully", async function () {
            expect(await nftB.name()).to.equal("NFT B");
            expect(await nftB.symbol()).to.equal("NFTB");
        });
    });

    describe("Minting", function () {
        it("Should allow anyone to mint NFTs", async function () {
            await nftB.connect(addr1).safeMint(addr1.address);
            expect(await nftB.balanceOf(addr1.address)).to.equal(1);

            await nftB.connect(addr2).safeMint(addr2.address);
            expect(await nftB.balanceOf(addr2.address)).to.equal(1);
        });

        it("Should generate unique token IDs", async function () {
            const tx1 = await nftB.safeMint(addr1.address);
            const tx2 = await nftB.safeMint(addr2.address);

            const receipt1 = await tx1.wait();
            const receipt2 = await tx2.wait();

            const tokenId1 = receipt1.logs[0].args[2];
            const tokenId2 = receipt2.logs[0].args[2];

            expect(tokenId1).to.not.equal(tokenId2);
        });
    });

    describe("Transfers", function () {
        it("Should allow token transfers", async function () {
            const tx = await nftB.connect(addr1).safeMint(addr1.address);
            const receipt = await tx.wait();
            const tokenId = receipt.logs[0].args[2];

            await nftB
                .connect(addr1)
                .transferFrom(addr1.address, addr2.address, tokenId);
            expect(await nftB.ownerOf(tokenId)).to.equal(addr2.address);
        });
    });
});
