import { ethers } from 'ethers';

const CONTRACT_ADDRESS = 'YOUR_CONTRACT_ADDRESS';
const CONTRACT_ABI = []; // Add your contract ABI here

const web3Service = {
    async connectWallet() {
        if (typeof window.ethereum !== 'undefined') {
            try {
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const signer = provider.getSigner();
                const address = await signer.getAddress();
                return address;
            } catch (error) {
                console.error('Failed to connect wallet:', error);
            }
        } else {
            console.error('MetaMask is not installed');
        }
    },

    async getContract() {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    },

    async deposit(amount) {
        const contract = await this.getContract();
        const tx = await contract.deposit(ethers.utils.parseEther(amount));
        await tx.wait();
    },

    async withdraw(amount) {
        const contract = await this.getContract();
        const tx = await contract.withdraw(ethers.utils.parseEther(amount));
        await tx.wait();
    },
};

export default web3Service;