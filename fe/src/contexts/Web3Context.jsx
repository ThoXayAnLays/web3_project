import React, { createContext, useContext, useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { toast } from 'react-toastify'
import TokenAJson from '../contracts/TokenA.json'
import NFTBJson from '../contracts/NFTB.json'
import StakingJson from '../contracts/Staking.json'
import contractAddresses from '../contracts/contract-address.json'

const Web3Context = createContext()

export const useWeb3 = () => useContext(Web3Context)

export const Web3Provider = ({ children }) => {
    const [provider, setProvider] = useState(null)
    const [signer, setSigner] = useState(null)
    const [address, setAddress] = useState(null)
    const [isAdmin, setIsAdmin] = useState(false)
    const [tokenAContract, setTokenAContract] = useState(null)
    const [nftBContract, setNFTBContract] = useState(null)
    const [stakingContract, setStakingContract] = useState(null)
    const [tokenABalance, setTokenABalance] = useState('0')
    const [nftBBalance, setNFTBBalance] = useState('0')
    const [baseAPR, setBaseAPR] = useState(null)

    useEffect(() => {
        if (window.ethereum) {
            const provider = new ethers.providers.Web3Provider(window.ethereum)
            setProvider(provider)

            window.ethereum.on('accountsChanged', handleAccountsChanged)
            window.ethereum.on('chainChanged', () => window.location.reload())

            // Auto-connect on page load
            connectWallet(provider)
        } else {
            toast.error('Please install MetaMask to use this dApp')
        }

        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
            }
        }
    }, [])

    const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
            setAddress(null)
            setSigner(null)
            setIsAdmin(false)
        } else if (accounts[0] !== address) {
            connectWallet(provider)
        }
    }

    const connectWallet = async (provider) => {
        if (provider) {
            try {
                const accounts = await provider.listAccounts()
                if (accounts.length > 0) {
                    const signer = provider.getSigner()
                    const address = await signer.getAddress()
                    setSigner(signer)
                    setAddress(address)
                    setIsAdmin(address.toLowerCase() === import.meta.env.VITE_ADMIN_ADDRESS.toLowerCase())

                    const tokenA = new ethers.Contract(contractAddresses.TokenA, TokenAJson.abi, signer)
                    const nftB = new ethers.Contract(contractAddresses.NFTB, NFTBJson.abi, signer)
                    const staking = new ethers.Contract(contractAddresses.Staking, StakingJson.abi, signer)

                    setTokenAContract(tokenA)
                    setNFTBContract(nftB)
                    setStakingContract(staking)

                    await updateBalances(address, tokenA, nftB)
                    await updateBaseAPR(staking)

                    // Check network
                    const network = await provider.getNetwork()
                    if (network.chainId !== parseInt(import.meta.env.VITE_TESTNET_CHAIN_ID)) {
                        toast.error('Please connect to Linea Sepolia Testnet')
                    }
                }
            } catch (error) {
                console.error('Error connecting wallet:', error)
                toast.error('Failed to connect wallet')
            }
        }
    }

    const updateBalances = async (address, tokenA, nftB) => {
        const tokenABalance = await tokenA.balanceOf(address)
        setTokenABalance(ethers.utils.formatEther(tokenABalance))

        const nftBBalance = await nftB.balanceOf(address)
        setNFTBBalance(nftBBalance.toString())
    }

    const updateBaseAPR = async (staking) => {
        try {
            const apr = await staking.baseAPR()
            setBaseAPR(apr.toNumber() / 100) // Convert from basis points to percentage
        } catch (error) {
            console.error('Error fetching base APR:', error)
        }
    }

    const value = {
        provider,
        signer,
        address,
        isAdmin,
        tokenAContract,
        nftBContract,
        stakingContract,
        tokenABalance,
        nftBBalance,
        baseAPR,
        connectWallet,
        updateBalances,
        updateBaseAPR,
    }

    return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>
}