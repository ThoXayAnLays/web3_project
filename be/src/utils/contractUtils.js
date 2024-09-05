const fs = require("fs").promises;
const path = require("path");

async function getContractAddresses() {
    const addressesPath = path.join(
        __dirname,
        "..",
        "contracts",
        "contract-address.json"
    );
    try {
        const addressesJson = await fs.readFile(addressesPath, "utf-8");
        const addresses = JSON.parse(addressesJson);
        return {
            TokenA: addresses.UpgradeableTokenA,
            NFTB: addresses.UpgradeableNFTB,
            Staking: addresses.UpgradeableStaking
        };
    } catch (error) {
        console.error("Error reading contract addresses:", error);
        throw error;
    }
}

async function getContractABIs() {
    const abis = {};
    const contractNames = ["UpgradeableTokenA", "UpgradeableNFTB", "UpgradeableStaking"];

    for (const name of contractNames) {
        const abiPath = path.join(__dirname, "..", "contracts", `${name}.json`);
        try {
            const abiJson = await fs.readFile(abiPath, "utf-8");
            abis[name.replace("Upgradeable", "")] = JSON.parse(abiJson).abi;
        } catch (error) {
            console.error(`Error reading ABI for ${name}:`, error);
            throw error;
        }
    }

    return abis;
}

async function getDeploymentBlocks() {
    const configPath = path.join(__dirname, "..", "config.js");
    try {
        const config = require(configPath);
        return {
            tokenA: config.DEPLOYMENT_BLOCK,
            nftB: config.DEPLOYMENT_BLOCK,
            staking: config.DEPLOYMENT_BLOCK,
        };
    } catch (error) {
        console.error("Error reading deployment blocks:", error);
        throw error;
    }
}

module.exports = {
    getContractAddresses,
    getContractABIs,
    getDeploymentBlocks,
};