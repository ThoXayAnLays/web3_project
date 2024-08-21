import React, { createContext, useState, useEffect, useCallback } from 'react';
import Web3 from 'web3';
import { toast } from 'react-toastify';
import contractAddresses from '../contracts/contract-address.json';
import TokenAABI from '../contracts/TokenA.json';
import NFTBABI from '../contracts/NFTB.json';
import StakingABI from '../contracts/Staking.json';

export const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
    const [web3, setWeb3] = useState(null);
    const [account, setAccount] = useState(null);
    const [tokenAContract, setTokenAContract] = useState(null);
    const [nftBContract, setNFTBContract] = useState(null);
    const [stakingContract, setStakingContract] = useState(null);
    const [balance, setBalance] = useState('0');

    const connectWallet = useCallback(async () => {
        if (window.ethereum) {
            try {
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                const web3Instance = new Web3(window.ethereum);
                setWeb3(web3Instance);

                const accounts = await web3Instance.eth.getAccounts();
                setAccount(accounts[0]);

                const chainId = await web3Instance.eth.getChainId();
                const chainIdAsNumber = Number(chainId);
                console.log("ChainId:", chainIdAsNumber);

                if (chainIdAsNumber !== parseInt(import.meta.env.VITE_TESTNET_CHAIN_ID)) {
                    toast.error('Please connect to BSC Testnet');
                    return;
                }

                const tokenA = new web3Instance.eth.Contract(TokenAABI.abi, contractAddresses.TokenA);
                const nftB = new web3Instance.eth.Contract(NFTBABI.abi, contractAddresses.NFTB);
                const staking = new web3Instance.eth.Contract(StakingABI.abi, contractAddresses.Staking);

                setTokenAContract(tokenA);
                setNFTBContract(nftB);
                setStakingContract(staking);

                const balance = await tokenA.methods.balanceOf(accounts[0]).call();
                setBalance(web3Instance.utils.fromWei(balance, 'ether'));

                localStorage.setItem('walletConnected', 'true');
                toast.success('Connected to wallet');
            } catch (error) {
                toast.error('Failed to connect to wallet');
                console.error(error);
            }
        } else {
            toast.error('Please install MetaMask');
        }
    }, []);

    const disconnectWallet = useCallback(() => {
        setWeb3(null);
        setAccount(null);
        setTokenAContract(null);
        setNFTBContract(null);
        setStakingContract(null);
        setBalance('0');
        localStorage.removeItem('walletConnected');
        toast.info('Disconnected from wallet');
    }, []);

    useEffect(() => {
        const connectWalletOnPageLoad = async () => {
            if (localStorage.getItem('walletConnected') === 'true') {
                await connectWallet();
            }
        };
        connectWalletOnPageLoad();
    }, [connectWallet]);

    useEffect(() => {
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                setAccount(accounts[0]);
                connectWallet();
            });

            window.ethereum.on('chainChanged', () => {
                window.location.reload();
            });
        }
    }, [connectWallet]);

    return (
        <Web3Context.Provider value={{ web3, account, tokenAContract, nftBContract, stakingContract, balance, connectWallet, disconnectWallet }}>
            {children}
        </Web3Context.Provider>
    );
};