// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
// import "@openzeppelin/contracts/access/Ownable.sol";
// import "@openzeppelin/contracts/utils/math/Math.sol";

// contract TokenAAndNFTB is ERC20, ERC721, Ownable {
//     using Math for uint256;

//     // Struct to store deposit information
//     struct Deposit {
//         uint256 amount;
//         uint256 depositTime;
//         uint256 nftDepositTime;
//         bool hasNFT;
//     }

//     // Mapping to store user deposits
//     mapping(address => Deposit) public deposits;

//     // Base APR (8%)
//     uint256 public baseAPR = 800; // 8% * 100 for precision

//     // Additional APR for NFT holders (2%)
//     uint256 public nftAPR = 200; // 2% * 100 for precision

//     // Lock period for deposits (5 minutes)
//     uint256 public constant LOCK_PERIOD = 5 minutes;

//     // Minimum amount to receive NFT (1 million tokens)
//     uint256 public constant MIN_AMOUNT_FOR_NFT = 1_000_000 * 10 ** 18; // Assuming 18 decimals

//     // NFT counter
//     uint256 private _nftCounter;

//     // Event declarations
//     event Deposited(address indexed user, uint256 amount);
//     event NFTMinted(address indexed user, uint256 tokenId);
//     event Withdrawn(address indexed user, uint256 amount, uint256 reward);
//     event RewardClaimed(address indexed user, uint256 reward);
//     event APRUpdated(uint256 newBaseAPR);

//     constructor() ERC20("Token A", "TKA") ERC721("NFT B", "NFTB") {
//         _nftCounter = 0;
//     }

//     // Function to mint Token A
//     function mintTokenA(address to, uint256 amount) external onlyOwner {
//         _mint(to, amount);
//     }

//     // Function to deposit Token A
//     function depositTokenA(uint256 amount) external {
//         require(amount > 0, "Amount must be greater than 0");
//         require(balanceOf(msg.sender) >= amount, "Insufficient balance");

//         // Transfer tokens from user to contract
//         _transfer(msg.sender, address(this), amount);

//         // Update or create deposit
//         Deposit storage deposit = deposits[msg.sender];
//         if (deposit.amount == 0) {
//             deposit.amount = amount;
//             deposit.depositTime = block.timestamp;
//         } else {
//             // If there's an existing deposit, calculate and add reward first
//             uint256 reward = calculateReward(msg.sender);
//             deposit.amount = deposit.amount.add(amount).add(reward);
//             deposit.depositTime = block.timestamp;
//         }

//         // Mint NFT if eligible
//         if (deposit.amount >= MIN_AMOUNT_FOR_NFT && !deposit.hasNFT) {
//             _mintNFT(msg.sender);
//             deposit.hasNFT = true;
//             deposit.nftDepositTime = block.timestamp;
//         }

//         emit Deposited(msg.sender, amount);
//     }

//     // Internal function to mint NFT
//     function _mintNFT(address to) internal {
//         _nftCounter = _nftCounter.add(1);
//         _safeMint(to, _nftCounter);
//         emit NFTMinted(to, _nftCounter);
//     }

//     // Function to withdraw tokens and claim reward
//     function withdraw(bool claimOnly) external {
//         Deposit storage deposit = deposits[msg.sender];
//         require(deposit.amount > 0, "No deposit found");
//         require(
//             block.timestamp >= deposit.depositTime.add(LOCK_PERIOD),
//             "Tokens are still locked"
//         );

//         uint256 reward = calculateReward(msg.sender);
//         uint256 amountToWithdraw = claimOnly ? 0 : deposit.amount;

//         if (claimOnly) {
//             _mint(msg.sender, reward);
//             emit RewardClaimed(msg.sender, reward);
//         } else {
//             uint256 totalAmount = amountToWithdraw.add(reward);
//             _transfer(address(this), msg.sender, amountToWithdraw);
//             _mint(msg.sender, reward);
//             delete deposits[msg.sender];
//             emit Withdrawn(msg.sender, amountToWithdraw, reward);
//         }
//     }

//     // Function to calculate reward
//     function calculateReward(address user) public view returns (uint256) {
//         Deposit storage deposit = deposits[user];
//         if (deposit.amount == 0) return 0;

//         uint256 duration;
//         uint256 rate;
//         uint256 reward;

//         if (deposit.hasNFT) {
//             // Calculate reward for the period before NFT deposit
//             duration = deposit.nftDepositTime.sub(deposit.depositTime);
//             rate = baseAPR;
//             reward = deposit.amount.mul(rate).mul(duration).div(10000).div(
//                 365 days
//             );

//             // Calculate reward for the period after NFT deposit
//             duration = block.timestamp.sub(deposit.nftDepositTime);
//             rate = baseAPR.add(nftAPR);
//             reward = reward.add(
//                 deposit.amount.mul(rate).mul(duration).div(10000).div(365 days)
//             );
//         } else {
//             duration = block.timestamp.sub(deposit.depositTime);
//             rate = baseAPR;
//             reward = deposit.amount.mul(rate).mul(duration).div(10000).div(
//                 365 days
//             );
//         }

//         return reward;
//     }

//     // Function for admin to update base APR
//     function updateBaseAPR(uint256 newBaseAPR) external onlyOwner {
//         baseAPR = newBaseAPR;
//         emit APRUpdated(newBaseAPR);
//     }
// }
