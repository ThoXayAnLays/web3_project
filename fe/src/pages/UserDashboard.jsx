import React, { useContext, useState, useEffect } from 'react';
import { Web3Context } from '../context/Web3Context';
import StakingForm from '../components/StakingForm';
import TransactionHistory from '../components/TransactionHistory';
import Spinner from '../components/Spinner';
import { toast } from 'react-toastify';
import contractAddresses from '../contracts/contract-address.json';
import TokenFaucetABI from '../contracts/TokenFaucet.json';

const UserDashboard = () => {
    const { account, web3 } = useContext(Web3Context);
    const [loading, setLoading] = useState(true);
    const [tokenFaucetContract, setTokenFaucetContract] = useState(null);

    useEffect(() => {
        if (web3 && contractAddresses.TokenFaucet) {
            const faucetContract = new web3.eth.Contract(TokenFaucetABI.abi, contractAddresses.TokenFaucet);
            setTokenFaucetContract(faucetContract);
        }
        // Simulate data loading
        setTimeout(() => setLoading(false), 1000);
    }, [web3]);

    const requestTestTokens = async () => {
        if (!tokenFaucetContract) {
            toast.error('Token Faucet contract not initialized');
            return;
        }

        try {
            await tokenFaucetContract.methods.requestTokens().send({ from: account });
            toast.success('Test tokens received successfully');
        } catch (error) {
            console.error('Error requesting test tokens:', error);
            toast.error('Failed to request test tokens. You may need to wait before requesting again.');
        }
    };

    if (!account) {
        return <div className="container mx-auto mt-8">Please connect your wallet to view the dashboard.</div>;
    }

    if (loading) {
        return <Spinner />;
    }

    return (
        <div className="container mx-auto mt-8">
            <h1 className="text-3xl font-bold mb-8">User Dashboard</h1>
            <button
                onClick={requestTestTokens}
                className="bg-green-500 text-white px-4 py-2 rounded mb-4"
            >
                Request Test Tokens
            </button>
            <StakingForm />
            <TransactionHistory />
        </div>
    );
};

export default UserDashboard;