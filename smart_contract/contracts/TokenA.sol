// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract UpgradeableTokenA is Initializable, ERC20Upgradeable, OwnableUpgradeable, UUPSUpgradeable {
    uint256 public constant TOTAL_SUPPLY = 1000000000 * 10**18;
    uint256 public constant MAX_FAUCET_AMOUNT = 5000000 * 10**18;
    uint256 public constant MAX_REWARD_AMOUNT = 1000000 * 10**18; 
    address public stakingContract;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __ERC20_init("Token A", "TKA");
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();

        _mint(address(this), TOTAL_SUPPLY);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function setStakingContract(address _stakingContract) external onlyOwner {
        stakingContract = _stakingContract;
    }

    function transferReward(address to, uint256 amount) external returns (bool) {
        require(amount <= MAX_REWARD_AMOUNT, "Staking: Amount exceeds maximum allowed");
        require(balanceOf(address(this)) >= amount, "Faucet: Insufficient balance in contract");
        require(msg.sender == stakingContract, "Only staking contract can transferReward");
        _transfer(address(this), to, amount);
        return true;
    }

    function faucet(uint256 amount) public {
        require(amount <= MAX_FAUCET_AMOUNT, "Faucet: Amount exceeds maximum allowed");
        require(balanceOf(address(this)) >= amount, "Faucet: Insufficient balance in contract");
        _transfer(address(this), msg.sender, amount);
    }
}