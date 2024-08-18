import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import web3Service from '../services/web3Service';

const Home = () => {
    const [account, setAccount] = useState('');

    useEffect(() => {
        const connectWallet = async () => {
            const account = await web3Service.connectWallet();
            setAccount(account);
        };
        connectWallet();
    }, []);

    return (
        <div>
            <h1>Welcome to Web3 Project</h1>
            {account ? (
                <p>Connected account: {account}</p>
            ) : (
                <button onClick={web3Service.connectWallet}>Connect Wallet</button>
            )}
        </div>
    );
};

export default Home;