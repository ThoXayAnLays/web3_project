// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface INFTB is IERC721 {
    function mint(address to) external returns (uint256);
}