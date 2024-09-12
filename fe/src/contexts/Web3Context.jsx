import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { ethers } from 'ethers'
import EthereumProvider from '@walletconnect/ethereum-provider'
import { toast } from 'react-toastify'
import TokenAJson from '../contracts/TokenA.json'
import NFTBJson from '../contracts/NFTB.json'
import StakingJson from '../contracts/Staking.json'
import contractAddresses from '../contracts/contract-address.json'

const Web3Context = createContext()

export const useWeb3 = () => useContext(Web3Context)

const NETWORK_ID = parseInt(import.meta.env.VITE_TESTNET_CHAIN_ID)

export const Web3Provider = ({ children }) => {
    const [provider, setProvider] = useState(null)
    const [wcProvider, setWcProvider] = useState(null)
    const [address, setAddress] = useState(null)
    const [isAdmin, setIsAdmin] = useState(false)
    const [tokenAContract, setTokenAContract] = useState(null)
    const [nftBContract, setNFTBContract] = useState(null)
    const [stakingContract, setStakingContract] = useState(null)
    const [tokenABalance, setTokenABalance] = useState('0')
    const [nftBBalance, setNFTBBalance] = useState('0')
    const [baseAPR, setBaseAPR] = useState(null)
    const [isCorrectNetwork, setIsCorrectNetwork] = useState(true)
    const [chainId, setChainId] = useState(null)

    const connectWallet = async (connectorType) => {
        if (address) {
            console.log('Wallet already connected')
            return
        }
        try {
            let ethersProvider;
            if (connectorType === 'injected') {
                if (typeof window.ethereum !== 'undefined') {
                    await window.ethereum.request({ method: 'eth_requestAccounts' });
                    ethersProvider = new ethers.providers.Web3Provider(window.ethereum);
                } else {
                    throw new Error("MetaMask not detected");
                }
            } else if (connectorType === 'walletconnect') {
                const wcProviderInstance = await EthereumProvider.init({
                    projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID,
                    chains: [NETWORK_ID],
                    showQrModal: true,
                    qrModalOptions: { themeMode: "dark" }
                });

                await wcProviderInstance.enable();
                ethersProvider = new ethers.providers.Web3Provider(wcProviderInstance);
                setWcProvider(wcProviderInstance);

                wcProviderInstance.on('disconnect', () => {
                    resetState();
                });
            } else {
                throw new Error("Invalid connector type");
            }

            setProvider(ethersProvider);

            const signer = ethersProvider.getSigner();
            const connectedAddress = await signer.getAddress();
            setAddress(connectedAddress);

            const network = await ethersProvider.getNetwork();
            setChainId(network.chainId);
            setIsCorrectNetwork(network.chainId === NETWORK_ID);

            setIsAdmin(connectedAddress.toLowerCase() === import.meta.env.VITE_ADMIN_ADDRESS.toLowerCase());

            await initializeContracts(signer);

            localStorage.setItem('walletConnected', 'true');
            localStorage.setItem('connectorType', connectorType);

            toast.success('Wallet connected successfully');
        } catch (error) {
            console.error('Error connecting wallet:', error);
            toast.error('Failed to connect wallet: ' + error.message);
        }
    }

    const initializeContracts = useCallback(async (signer) => {
        if (contractAddresses.TokenA && contractAddresses.NFTB && contractAddresses.Staking) {
            const tokenA = new ethers.Contract(contractAddresses.TokenA, TokenAJson.abi, signer)
            const nftB = new ethers.Contract(contractAddresses.NFTB, NFTBJson.abi, signer)
            const staking = new ethers.Contract(contractAddresses.Staking, StakingJson.abi, signer)

            setTokenAContract(tokenA)
            setNFTBContract(nftB)
            setStakingContract(staking)

            const signerAddress = await signer.getAddress()
            await updateBalances(signerAddress, tokenA, nftB)
            await updateBaseAPR(staking)
        } else {
            console.error('Contract addresses are not properly defined')
            toast.error('Contract addresses are missing. Please check your configuration.')
        }
    }, [])

    const disconnectWallet = async () => {
        if (wcProvider) {
            try {
                await wcProvider.disconnect();
            } catch (error) {
                console.error('Error disconnecting WalletConnect:', error);
            }
        }
        resetState();
        localStorage.removeItem('walletConnected');
        localStorage.removeItem('connectorType');
        toast.success('Wallet disconnected');
    }

    const resetState = () => {
        setProvider(null);
        setWcProvider(null);
        setAddress(null);
        setIsAdmin(false);
        setTokenAContract(null);
        setNFTBContract(null);
        setStakingContract(null);
        setTokenABalance('0');
        setNFTBBalance('0');
        setBaseAPR(null);
        setChainId(null);
        setIsCorrectNetwork(true);
    }

    const updateBalances = useCallback(async (address, tokenA, nftB) => {
        try {
            if (tokenA && nftB && address) {
                const tokenABalance = await tokenA.balanceOf(address)
                setTokenABalance(ethers.utils.formatEther(tokenABalance))

                const nftBBalance = await nftB.balanceOf(address)
                setNFTBBalance(nftBBalance.toString())
            }
        } catch (error) {
            console.error('Error updating balances:', error)
        }
    }, [])

    const updateBaseAPR = useCallback(async (staking) => {
        try {
            if (staking) {
                const apr = await staking.baseAPR()
                setBaseAPR(apr.toNumber() / 100)
            }
        } catch (error) {
            console.error('Error fetching base APR:', error)
        }
    }, [])

    useEffect(() => {
        const handleAccountsChanged = async (accounts) => {
            if (accounts.length > 0) {
                const newAddress = accounts[0]
                setAddress(newAddress)
                setIsAdmin(newAddress.toLowerCase() === import.meta.env.VITE_ADMIN_ADDRESS.toLowerCase())
                if (provider) {
                    const signer = provider.getSigner(newAddress)
                    await initializeContracts(signer)
                }
            } else {
                resetState()
            }
        }

        const handleChainChanged = () => {
            window.location.reload()
        }

        if (window.ethereum) {
            window.ethereum.on('accountsChanged', handleAccountsChanged)
            window.ethereum.on('chainChanged', handleChainChanged)
        }

        // Check if wallet was previously connected
        const checkPreviousConnection = async () => {
            const wasConnected = localStorage.getItem('walletConnected')
            const connectorType = localStorage.getItem('connectorType')
            if (wasConnected === 'true' && connectorType) {
                await connectWallet(connectorType)
            }
        }

        checkPreviousConnection()

        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
                window.ethereum.removeListener('chainChanged', handleChainChanged)
            }
        }
    }, [provider, initializeContracts])

    const value = useMemo(() => ({
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
        isConnected: !!address,
        connectWallet,
        disconnectWallet,
        updateBalances,
        updateBaseAPR,
        provider
    }), [address, isAdmin, tokenAContract, nftBContract, stakingContract, tokenABalance, nftBBalance, baseAPR, chainId, isCorrectNetwork, updateBalances, updateBaseAPR, provider]);

    return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}