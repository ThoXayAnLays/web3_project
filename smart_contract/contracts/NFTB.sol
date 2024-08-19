// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract NFTB is ERC721 {
    using Math for uint256;
    uint256 private _nftCounter;

    constructor() ERC721("NFT B", "NFTB") {
        _nftCounter = 0;
    }

    function mint(address to) external returns (uint256) {
        (bool success, uint256 result) = _nftCounter.tryAdd(1);
        require(success, "Addition overflow");
        _nftCounter = result;
        _safeMint(to, _nftCounter);
        return _nftCounter;
    }
}