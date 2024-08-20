import React, { useState } from 'react';
import { Container, Typography, TextField, Button, CircularProgress } from '@mui/material';
import { updateAPR } from '../utils/web3';
import { useWeb3 } from '../context/Web3Context';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
    const [newAPR, setNewAPR] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { isConnected } = useWeb3();

    const handleUpdateAPR = async () => {
        if (!isConnected) {
            toast.error('Please connect your wallet first');
            return;
        }
        setIsLoading(true);
        try {
            await updateAPR(newAPR);
            setNewAPR('');
            toast.success('APR updated successfully');
        } catch (error) {
            toast.error('Failed to update APR: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container>
            <Typography variant="h4" component="h1" gutterBottom>
                Admin Dashboard
            </Typography>
            <TextField
                label="New APR (%)"
                type="number"
                value={newAPR}
                onChange={(e) => setNewAPR(e.target.value)}
                fullWidth
                margin="normal"
                disabled={isLoading}
            />
            <Button
                variant="contained"
                onClick={handleUpdateAPR}
                fullWidth
                disabled={isLoading || !newAPR}
            >
                {isLoading ? <CircularProgress size={24} /> : 'Update APR'}
            </Button>
        </Container>
    );
};

export default AdminDashboard;