const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    try {
        // Deploy UpgradeableTokenA
        console.log("Deploying UpgradeableTokenA...");
        const UpgradeableTokenA = await hre.ethers.getContractFactory(
            "UpgradeableTokenA"
        );
        const upgradeableTokenA = await hre.upgrades.deployProxy(
            UpgradeableTokenA,
            [],
            { initializer: "initialize" }
        );
        await upgradeableTokenA.deployed();
        console.log(
            "UpgradeableTokenA proxy address:",
            upgradeableTokenA.address
        );

        const tokenAImplementationAddress =
            await hre.upgrades.erc1967.getImplementationAddress(
                upgradeableTokenA.address
            );
        console.log(
            "UpgradeableTokenA implementation address:",
            tokenAImplementationAddress
        );

        // Deploy UpgradeableNFTB
        console.log("Deploying UpgradeableNFTB...");
        const UpgradeableNFTB = await hre.ethers.getContractFactory(
            "UpgradeableNFTB"
        );
        const upgradeableNFTB = await hre.upgrades.deployProxy(
            UpgradeableNFTB,
            [],
            { initializer: "initialize" }
        );
        await upgradeableNFTB.deployed();
        console.log("UpgradeableNFTB proxy address:", upgradeableNFTB.address);

        const nftBImplementationAddress =
            await hre.upgrades.erc1967.getImplementationAddress(
                upgradeableNFTB.address
            );
        console.log(
            "UpgradeableNFTB implementation address:",
            nftBImplementationAddress
        );

        // Deploy UpgradeableStaking
        console.log("Deploying UpgradeableStaking...");
        const UpgradeableStaking = await hre.ethers.getContractFactory(
            "UpgradeableStaking"
        );
        const upgradeableStaking = await hre.upgrades.deployProxy(
            UpgradeableStaking,
            [upgradeableTokenA.address, upgradeableNFTB.address],
            { initializer: "initialize" }
        );
        await upgradeableStaking.deployed();
        console.log(
            "UpgradeableStaking proxy address:",
            upgradeableStaking.address
        );

        const stakingImplementationAddress =
            await hre.upgrades.erc1967.getImplementationAddress(
                upgradeableStaking.address
            );
        console.log(
            "UpgradeableStaking implementation address:",
            stakingImplementationAddress
        );

        // Set staking contract in TokenA
        await upgradeableTokenA.setStakingContract(upgradeableStaking.address);
        console.log("Staking contract set in TokenA");

        // Get the current block number
        const currentBlock = await hre.ethers.provider.getBlockNumber();
        console.log("Current block number:", currentBlock);

        // Save frontend files
        console.log("Saving files to BE and FE...");
        await saveFrontendFiles({
            UpgradeableTokenA: upgradeableTokenA.address,
            UpgradeableTokenAImplementation: tokenAImplementationAddress,
            UpgradeableNFTB: upgradeableNFTB.address,
            UpgradeableNFTBImplementation: nftBImplementationAddress,
            UpgradeableStaking: upgradeableStaking.address,
            UpgradeableStakingImplementation: stakingImplementationAddress,
        });

        // Update backend configuration with the current block number
        updateBackendConfig(currentBlock);

        console.log("Deployment completed successfully.");
    } catch (error) {
        console.error("Error during deployment:", error);
        process.exit(1);
    }
}

async function saveFrontendFiles(addresses) {
    const contractsDir = path.join(
        __dirname,
        "..",
        "..",
        "fe",
        "src",
        "contracts"
    );

    if (!fs.existsSync(contractsDir)) {
        fs.mkdirSync(contractsDir, { recursive: true });
    }

    fs.writeFileSync(
        path.join(contractsDir, "contract-address.json"),
        JSON.stringify(addresses, undefined, 2)
    );

    const beContractDir = path.join(
        __dirname,
        "..",
        "..",
        "be",
        "src",
        "contracts"
    );

    if (!fs.existsSync(beContractDir)) {
        fs.mkdirSync(beContractDir, { recursive: true });
    }

    fs.writeFileSync(
        path.join(beContractDir, "contract-address.json"),
        JSON.stringify(addresses, undefined, 2)
    );

    const artifacts = [
        "UpgradeableTokenA",
        "UpgradeableNFTB",
        "UpgradeableStaking",
    ];

    for (const artifact of artifacts) {
        const Artifact = await hre.artifacts.readArtifact(artifact);
        fs.writeFileSync(
            path.join(contractsDir, `${artifact}.json`),
            JSON.stringify(Artifact, null, 2)
        );
        fs.writeFileSync(
            path.join(beContractDir, `${artifact}.json`),
            JSON.stringify(Artifact, null, 2)
        );
    }
}

function updateBackendConfig(deploymentBlockNumber) {
    const configPath = path.join(
        __dirname,
        "..",
        "..",
        "be",
        "src",
        "config.js"
    );

    let configContent = fs.readFileSync(configPath, "utf8");

    // Parse the existing config
    const configMatch = configContent.match(
        /module\.exports\s*=\s*({[\s\S]*?});/
    );
    if (configMatch) {
        let config = eval("(" + configMatch[1] + ")");

        // Update only the DEPLOYMENT_BLOCK
        config.DEPLOYMENT_BLOCK = deploymentBlockNumber;

        // Reconstruct the config string
        const updatedConfig = `module.exports = ${JSON.stringify(
            config,
            null,
            4
        )};`;

        // Replace the entire module.exports in the file
        configContent = configContent.replace(
            /module\.exports\s*=\s*{[\s\S]*?};/,
            updatedConfig
        );

        fs.writeFileSync(configPath, configContent);

        console.log(
            `Backend config updated with deployment block: ${deploymentBlockNumber}`
        );
    } else {
        console.error("Could not find module.exports in config file");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Unhandled error during deployment:", error);
        process.exit(1);
    });
