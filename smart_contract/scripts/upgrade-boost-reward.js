const { ethers, upgrades } = require("hardhat");

async function main() {
    const proxyAddress = "0x49A000155e24188696C58Ce7939a324528c79ACc";
    console.log("Starting upgrade process...");
    console.log("Proxy address:", proxyAddress);

    try {
        // Ensure this name matches exactly with your contract file and declaration
        const UpgradeableStakingV2 = await ethers.getContractFactory("UpgradeableStakingV2");

        console.log("Upgrading proxy...");
        const upgradedContract = await upgrades.upgradeProxy(proxyAddress, UpgradeableStakingV2, {
            gasLimit: 5000000
        });
        
        await upgradedContract.deployed();
        console.log("Proxy upgraded successfully");

        // Initialize V2 if needed
        console.log("Initializing V2...");
        await upgradedContract.initializeV2();
        console.log("V2 initialized successfully");

        // Verify the upgrade
        const newImplementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
        console.log("New implementation address:", newImplementationAddress);

        // Additional verification
        const boostRewardPercentage = await upgradedContract.boostRewardPercentage();
        console.log("Boost reward percentage:", boostRewardPercentage.toString());

    } catch (error) {
        console.error("Error during upgrade:", error);
        if (error.message) console.error("Error message:", error.message);
        if (error.stack) console.error("Error stack:", error.stack);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Unhandled error during upgrade process:", error);
        process.exit(1);
    });