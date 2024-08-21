import React, { createContext, useState, useContext, useEffect } from 'react';
import { ethers } from "ethers";
import { toast } from 'react-toastify';

import stakingAbi from '../contracts/Staking.json';
import contractAddresses from '../contracts/contract-address.json';

const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [userAddress, setUserAddress] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [stakingContract, setStakingContract] = useState(null);

    const connectWallet = async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const signer = provider.getSigner();
                const address = await signer.getAddress();

                const network = await provider.getNetwork();
                if (network.chainId !== 97) { // BSC Testnet chain ID
                    toast.error('Please connect to BSC Testnet');
                    return false;
                }

                const stakeContract = new ethers.Contract(contractAddresses.Staking, stakingAbi.abi, signer);
                setStakingContract(stakeContract);

                setIsConnected(true);
                setUserAddress(address);

                const isAdminAddress = address.toLowerCase() === "0x35c0184f55bb4e99edfdc94e1067435991481ea3".toLowerCase();
                setIsAdmin(isAdminAddress);


                return true;
            } catch (error) {
                console.error('Error connecting to wallet:', error);
                toast.error('Failed to connect wallet');
                return false;
            }
        } else {
            toast.error('Please install MetaMask');
            return false;
        }
    };

    const checkIfAdmin = async (address) => {
        try {
            const response = await fetch(`${process.env.VITE_API_URL}/check-admin/${address}`);
            const data = await response.json();
            return data.isAdmin;
        } catch (error) {
            console.error('Error checking admin status:', error);
            return false;
        }
    };

    useEffect(() => {
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', () => {
                setIsConnected(false);
                setUserAddress('');
            });
            window.ethereum.on('chainChanged', () => {
                setIsConnected(false);
                setUserAddress('');
            });
        }
    }, []);

    return (
        <Web3Context.Provider value={{ isConnected, userAddress, isAdmin, connectWallet }}>
            {children}
        </Web3Context.Provider>
    );
};

export const useWeb3 = () => useContext(Web3Context);