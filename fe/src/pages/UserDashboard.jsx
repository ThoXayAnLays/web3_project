import React, { useState } from 'react';
import { Container, Typography, TextField, Button, Grid, CircularProgress } from '@mui/material';
import { depositTokenA, withdrawTokenA } from '../utils/web3';
import { useWeb3 } from '../context/Web3Context';
import { toast } from 'react-toastify';

const UserDashboard = () => {
    const [depositAmount, setDepositAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { isConnected } = useWeb3();

    const handleDeposit = async () => {
        if (!isConnected) {
            toast.error('Please connect your wallet first');
            return;
        }
        setIsLoading(true);
        try {
            await depositTokenA(depositAmount);
            setDepositAmount('');
            toast.success('Deposit successful');
        } catch (error) {
            toast.error('Deposit failed: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleWithdraw = async (claimOnly) => {
        if (!isConnected) {
            toast.error('Please connect your wallet first');
            return;
        }
        setIsLoading(true);
        try {
            await withdrawTokenA(claimOnly);
            toast.success(claimOnly ? 'Reward claimed successfully' : 'Withdrawal successful');
        } catch (error) {
            toast.error((claimOnly ? 'Claim' : 'Withdrawal') + ' failed: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container>
            <Typography variant="h4" component="h1" gutterBottom>
                User Dashboard
            </Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <TextField
                        label="Deposit Amount"
                        type="number"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        fullWidth
                        margin="normal"
                        disabled={isLoading}
                    />
                    <Button
                        variant="contained"
                        onClick={handleDeposit}
                        fullWidth
                        disabled={isLoading || !depositAmount}
                    >
                        {isLoading ? <CircularProgress size={24} /> : 'Deposit Token A'}
                    </Button>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Button
                        variant="contained"
                        onClick={() => handleWithdraw(false)}
                        fullWidth
                        disabled={isLoading}
                    >
                        {isLoading ? <CircularProgress size={24} /> : 'Withdraw + Claim Reward'}
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => handleWithdraw(true)}
                        fullWidth
                        sx={{ mt: 2 }}
                        disabled={isLoading}
                    >
                        {isLoading ? <CircularProgress size={24} /> : 'Claim Reward Only'}
                    </Button>
                </Grid>
            </Grid>
        </Container>
    );
};

export default UserDashboard;