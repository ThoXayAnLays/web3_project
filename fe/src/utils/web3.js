import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import stakingAbi from '../contracts/Staking.json';
import tokenAAbi from '../contracts/TokenA.json';
import nftBAbi from '../contracts/NFTB.json';
import contractAddresses from '../contracts/contract-address.json';

let provider, signer, stakingContract, tokenAContract, nftBContract;

export const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            provider = new ethers.providers.Web3Provider(window.ethereum);
            signer = provider.getSigner();

            const network = await provider.getNetwork();
            if (network.chainId !== 97) { // BSC Testnet chain ID
                toast.error('Please connect to BSC Testnet');
                return false;
            }

            stakingContract = new ethers.Contract(contractAddresses.Staking, stakingAbi.abi, signer);
            tokenAContract = new ethers.Contract(contractAddresses.TokenA, tokenAAbi.abi, signer);
            nftBContract = new ethers.Contract(contractAddresses.NFTB, nftBAbi.abi, signer);

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

export const depositTokenA = async (amount) => {
    if (!stakingContract) {
        toast.error('Please connect your wallet first');
        return;
    }

    try {
        const tx = await stakingContract.depositTokenA(ethers.utils.parseEther(amount));
        await tx.wait();
        toast.success('Deposit successful');
    } catch (error) {
        console.error('Error depositing:', error);
        toast.error('Deposit failed');
    }
};

export const withdrawTokenA = async (claimOnly) => {
    if (!stakingContract) {
        toast.error('Please connect your wallet first');
        return;
    }

    try {
        const tx = await stakingContract.withdraw(claimOnly);
        await tx.wait();
        toast.success(claimOnly ? 'Reward claimed successfully' : 'Withdrawal successful');
    } catch (error) {
        console.error('Error withdrawing:', error);
        toast.error(claimOnly ? 'Claim failed' : 'Withdrawal failed');
    }
};

export const updateAPR = async (newAPR) => {
    if (!stakingContract) {
        toast.error('Please connect your wallet first');
        return;
    }

    try {
        const tx = await stakingContract.updateBaseAPR(newAPR);
        await tx.wait();
        toast.success('APR updated successfully');
    } catch (error) {
        console.error('Error updating APR:', error);
        toast.error('Failed to update APR');
    }
};