// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenA is ERC20, Ownable {
    // constructor() ERC20("Token A", "TKA") {}

    // function mint(address to, uint256 amount) external {
    //     _mint(to, amount);
    // }

    constructor() ERC20("Token A", "TKA") Ownable(msg.sender) {
        _mint(owner(), 1000000000 * 10**decimals());
    }

    function transfer(address recipient, uint256 amount) public virtual override returns (bool) {
        return super.transfer(recipient, amount);
    }

    function transferFrom(address sender, address recipient, uint256 amount) public virtual override returns (bool) {
        return super.transferFrom(sender, recipient, amount);
    }
}