// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract UpgradeableNFTB is Initializable, ERC721Upgradeable, OwnableUpgradeable, UUPSUpgradeable {
    uint256 private _tokenIdCounter;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __ERC721_init("NFT B", "NFTB");
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        _tokenIdCounter = 0;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function safeMint(address to) public returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _safeMint(to, tokenId);
        _tokenIdCounter++;
        return tokenId;
    }
}