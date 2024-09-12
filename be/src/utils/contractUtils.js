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
        return JSON.parse(addressesJson);
    } catch (error) {
        console.error("Error reading contract addresses:", error);
        throw error;
    }
}

async function getContractABIs() {
    const abis = {};
    const contractNames = ["TokenA", "NFTB", "Staking"];

    for (const name of contractNames) {
        const abiPath = path.join(__dirname, "..", "contracts", `${name}.json`);
        try {
            const abiJson = await fs.readFile(abiPath, "utf-8");
            abis[name] = JSON.parse(abiJson).abi;
        } catch (error) {
            console.error(`Error reading ABI for ${name}:`, error);
            throw error;
        }
    }

    return abis;
}

module.exports = {
    getContractAddresses,
    getContractABIs,
};