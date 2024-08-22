import React, { useContext, useState, useEffect } from 'react';
import { Web3Context } from '../contexts/Web3Provider';
import { Box, Button, TextField, Typography, CircularProgress } from '@mui/material';
import { toast } from 'react-toastify';

const Home = () => {
    const { web3, account, tokenAContract, nftBContract, stakingContract, isLoading } = useContext(Web3Context);
    const [depositAmount, setDepositAmount] = useState('');
    const [stakingInfo, setStakingInfo] = useState({
        currentAPR: '0',
        tokenADeposited: '0',
        nftBDeposited: '0',
        currentReward: '0',
        lockTimeRemaining: '0'
    });

    useEffect(() => {
        const fetchStakingInfo = async () => {
            if (!account || !stakingContract) return;
            try {
                const stake = await stakingContract.methods.stakes(account).call();
                const currentAPR = await stakingContract.methods.baseAPR().call();
                const reward = await stakingContract.methods.calculateReward(account).call();
                const lockPeriod = await stakingContract.methods.LOCK_PERIOD().call();
                const currentTime = Math.floor(Date.now() / 1000);
                const lockTimeRemaining = Math.max(0, parseInt(stake.timestamp) + parseInt(lockPeriod) - currentTime);

                setStakingInfo({
                    currentAPR: web3.utils.fromWei(currentAPR, 'ether'),
                    tokenADeposited: web3.utils.fromWei(stake.amount, 'ether'),
                    nftBDeposited: stake.nftCount,
                    currentReward: web3.utils.fromWei(reward, 'ether'),
                    lockTimeRemaining: lockTimeRemaining
                });
            } catch (error) {
                console.error('Error fetching staking info:', error);
            }
        };

        fetchStakingInfo();
        const interval = setInterval(fetchStakingInfo, 10000); // Update every 10 seconds
        return () => clearInterval(interval);
    }, [account, stakingContract, web3]);

    const handleDeposit = async () => {
        if (!account) {
            toast.error('Please connect your wallet');
            return;
        }
        try {
            const amount = web3.utils.toWei(depositAmount, 'ether');
            await tokenAContract.methods.approve(stakingContract.options.address, amount).send({ from: account });
            await stakingContract.methods.deposit(amount).send({ from: account });
            toast.success('Deposit successful');
        } catch (error) {
            toast.error('Deposit failed');
            console.error(error);
        }
    };

    const handleWithdraw = async () => {
        if (!account) {
            toast.error('Please connect your wallet');
            return;
        }
        try {
            await stakingContract.methods.withdraw().send({ from: account });
            toast.success('Withdrawal successful');
        } catch (error) {
            toast.error('Withdrawal failed');
            console.error(error);
        }
    };

    const handleClaimReward = async () => {
        if (!account) {
            toast.error('Please connect your wallet');
            return;
        }
        try {
            await stakingContract.methods.claimReward().send({ from: account });
            toast.success('Reward claimed successfully');
        } catch (error) {
            toast.error('Failed to claim reward');
            console.error(error);
        }
    };

    const handleGetTokenA = async () => {
        if (!account) {
            toast.error('Please connect your wallet');
            return;
        }
        try {
            const amount = web3.utils.toWei('1000', 'ether'); // Get 1000 Token A
            await tokenAContract.methods.transfer(account, amount).send({ from: account });
            toast.success('Received 1000 Token A');
        } catch (error) {
            toast.error('Failed to get Token A');
            console.error(error);
        }
    };

    const handleWithdrawAllNFTB = async () => {
        if (!account) {
            toast.error('Please connect your wallet');
            return;
        }
        try {
            const balance = await nftBContract.methods.balanceOf(account).call();
            for (let i = 0; i < balance; i++) {
                const tokenId = await nftBContract.methods.tokenOfOwnerByIndex(account, 0).call();
                await nftBContract.methods.transferFrom(account, stakingContract.options.address, tokenId).send({ from: account });
            }
            toast.success('All NFT B withdrawn');
        } catch (error) {
            toast.error('Failed to withdraw NFT B');
            console.error(error);
        }
    };

    if (isLoading) {
        return <CircularProgress />;
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Staking Dashboard</Typography>
            <Box sx={{ my: 2 }}>
                <Typography>Current APR: {stakingInfo.currentAPR}%</Typography>
                <Typography>Token A Deposited: {stakingInfo.tokenADeposited}</Typography>
                <Typography>NFT B Deposited: {stakingInfo.nftBDeposited}</Typography>
                <Typography>Current Reward: {stakingInfo.currentReward}</Typography>
                <Typography>Lock Time Remaining: {stakingInfo.lockTimeRemaining} seconds</Typography>
            </Box>
            <Box sx={{ my: 2 }}>
                <TextField
                    label="Deposit Amount"
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    sx={{ mr: 2 }}
                />
                <Button variant="contained" onClick={handleDeposit}>Deposit</Button>
            </Box>
            <Box sx={{ my: 2 }}>
                <Button variant="contained" onClick={handleWithdraw} sx={{ mr: 2 }}>Withdraw All</Button>
                <Button variant="contained" onClick={handleClaimReward} sx={{ mr: 2 }}>Claim Reward</Button>
                <Button variant="contained" onClick={handleGetTokenA} sx={{ mr: 2 }}>Get Token A</Button>
                <Button variant="contained" onClick={handleWithdrawAllNFTB}>Withdraw All NFT B</Button>
            </Box>
        </Box>
    );
};

export default Home;