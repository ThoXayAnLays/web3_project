import { ethers } from 'ethers'
import UpgradeableTokenAJson from '../contracts/UpgradeableTokenA.json'
import UpgradeableNFTBJson from '../contracts/UpgradeableNFTB.json'
import UpgradeableStakingJson from '../contracts/UpgradeableStaking.json'
import contractAddresses from '../contracts/contract-address.json'

export const getContracts = (signer) => {
    const tokenA = new ethers.Contract(contractAddresses.UpgradeableTokenA, UpgradeableTokenAJson.abi, signer)
    const nftB = new ethers.Contract(contractAddresses.UpgradeableNFTB, UpgradeableNFTBJson.abi, signer)
    const staking = new ethers.Contract(contractAddresses.UpgradeableStaking, UpgradeableStakingJson.abi, signer)

    return { tokenA, nftB, staking }
}

export const formatEther = (amount) => {
    return ethers.utils.formatEther(amount)
}

export const parseEther = (amount) => {
    return ethers.utils.parseEther(amount)
} 