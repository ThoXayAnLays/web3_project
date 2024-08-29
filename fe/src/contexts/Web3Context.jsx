import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
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
    const [isCorrectNetwork, setIsCorrectNetwork] = useState(true)
    const [isConnected, setIsConnected] = useState(false)
    const [chainId, setChainId] = useState(null)

    const connectWallet = useCallback(async () => {
        if (window.ethereum) {
            try {
                const provider = new ethers.providers.Web3Provider(window.ethereum)
                await provider.send('eth_requestAccounts', []);
                const signer = provider.getSigner()
                const address = await signer.getAddress()
                setProvider(provider)
                setSigner(signer)
                setAddress(address)
                setIsAdmin(address.toLowerCase() === import.meta.env.VITE_ADMIN_ADDRESS.toLowerCase())
                setIsConnected(true)

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
                console.log("ChainId: ", network.chainId);
                setChainId(network.chainId)
                const isCorrect = network.chainId === parseInt(import.meta.env.VITE_TESTNET_CHAIN_ID)
                setIsCorrectNetwork(isCorrect)
                if (!isCorrect) {
                    toast.error('Please connect to Linea Sepolia Testnet')
                }
            } catch (error) {
                console.error('Error connecting wallet:', error)
                toast.error('Failed to connect wallet')
                setIsConnected(false)
            }
        } else {
            toast.error('Please install MetaMask to use this dApp')
        }
    }, [])

    const updateBalances = async (address, tokenA, nftB) => {
        try {
            const tokenABalance = await tokenA.balanceOf(address)
            setTokenABalance(ethers.utils.formatEther(tokenABalance))

            const nftBBalance = await nftB.balanceOf(address)
            setNFTBBalance(nftBBalance.toString())
        } catch (error) {
            console.error('Error updating balances:', error)
        }
    }

    const updateBaseAPR = async (staking) => {
        try {
            const apr = await staking.baseAPR()
            setBaseAPR(apr.toNumber() / 100) // Convert from basis points to percentage
        } catch (error) {
            console.error('Error fetching base APR:', error)
        }
    }

    useEffect(() => {
        const handleAccountsChanged = async (accounts) => {
            if (accounts.length === 0) {
                setIsConnected(false)
                setAddress(null)
                setSigner(null)
                setIsAdmin(false)
                toast.info('Please connect your wallet')
            } else {
                await connectWallet()
            }
        }

        const handleChainChanged = () => {
            window.location.reload()
        }

        if (window.ethereum) {
            window.ethereum.on('accountsChanged', handleAccountsChanged)
            window.ethereum.on('chainChanged', handleChainChanged)

            // Check if already connected
            window.ethereum.request({ method: 'eth_accounts' })
                .then(accounts => {
                    if (accounts.length > 0) {
                        connectWallet()
                    }
                })
        }

        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
                window.ethereum.removeListener('chainChanged', handleChainChanged)
            }
        }
    }, [connectWallet, address])

    const checkIfWalletIsConnected = useCallback(async () => {
        if (window.ethereum) {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' })
            if (accounts.length > 0) {
                await connectWallet()
            }
        }
    }, [connectWallet])

    useEffect(() => {
        checkIfWalletIsConnected()
    }, [checkIfWalletIsConnected])

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
        chainId,
        isCorrectNetwork,
        isConnected,
        connectWallet,
        updateBalances,
        updateBaseAPR,
    }

    return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>
}