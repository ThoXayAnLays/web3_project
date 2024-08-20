import React, { useState, useEffect } from 'react';
import { Container, Typography, TextField, Button, CircularProgress } from '@mui/material';
import TransactionTable from '../components/TransactionTable';
import { getTransactions } from '../utils/api';
import { toast } from 'react-toastify';

const TransactionHistory = () => {
    const [transactions, setTransactions] = useState([]);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchTransactions();
    }, [page]);

    const fetchTransactions = async () => {
        setIsLoading(true);
        try {
            const data = await getTransactions(page, 10, 'timestamp', 'DESC', search);
            setTransactions(prevTransactions => [...prevTransactions, ...data]);
        } catch (error) {
            console.error('Error fetching transactions:', error);
            toast.error('Failed to fetch transactions: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = () => {
        setPage(1);
        setTransactions([]);
        fetchTransactions();
    };

    return (
        <Container>
            <Typography variant="h4" component="h1" gutterBottom>
                Transaction History
            </Typography>
            <TextField
                label="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                fullWidth
                margin="normal"
            />
            <Button variant="contained" onClick={handleSearch} fullWidth disabled={isLoading}>
                Search
            </Button>
            <TransactionTable transactions={transactions} />
            <Button onClick={() => setPage(page + 1)} fullWidth sx={{ mt: 2 }} disabled={isLoading}>
                {isLoading ? <CircularProgress size={24} /> : 'Load More'}
            </Button>
        </Container>
    );
};

export default TransactionHistory;