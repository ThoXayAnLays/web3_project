import { ethers } from 'ethers'
import TokenAJson from '../contracts/TokenA.json'
import NFTBJson from '../contracts/NFTB.json'
import StakingJson from '../contracts/Staking.json'
import contractAddresses from '../contracts/contract-address.json'

export const getContracts = (signer) => {
    const tokenA = new ethers.Contract(contractAddresses.TokenA, TokenAJson.abi, signer)
    const nftB = new ethers.Contract(contractAddresses.NFTB, NFTBJson.abi, signer)
    const staking = new ethers.Contract(contractAddresses.Staking, StakingJson.abi, signer)

    return { tokenA, nftB, staking }
}

export const formatEther = (amount) => {
    return ethers.utils.formatEther(amount)
}

export const parseEther = (amount) => {
    return ethers.utils.parseEther(amount)
}