// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract NFTB is ERC721 {
    uint256 private _tokenIdCounter;

    constructor() ERC721("NFT B", "NFTB") {}

    function safeMint(address to) public returns (uint256) {
        uint256 tokenId =  _tokenIdCounter;
        _safeMint(to, tokenId);
        _tokenIdCounter++;
        return tokenId;
    }
}