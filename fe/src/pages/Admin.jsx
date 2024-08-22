import React, { useContext, useEffect, useState } from "react";
import { Web3Context } from "../contexts/Web3Provider";
import {
    Box,
    Button,
    TextField,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    MenuItem,
    CircularProgress,
} from "@mui/material";
import axios from "axios";
import { toast } from "react-toastify";

const Admin = () => {
    const { account, stakingContract, web3, isLoading } =
        useContext(Web3Context);
    const [newAPR, setNewAPR] = useState("");
    const [transactions, setTransactions] = useState([]);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [sortBy, setSortBy] = useState("timestamp");
    const [sortOrder, setSortOrder] = useState("desc");
    const [search, setSearch] = useState("");

    useEffect(() => {
        const fetchAllTransactions = async () => {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_BE_API}/transactions/all`,
                    {
                        params: { page, limit, sortBy, sortOrder, search },
                        headers: { "X-User-Address": account },
                    }
                );
                setTransactions(response.data.docs);
            } catch (error) {
                console.error("Failed to fetch all transactions:", error);
                toast.error("Failed to fetch transactions");
            }
        };

        if (account === import.meta.env.VITE_ADMIN_ADDRESS) {
            fetchAllTransactions();
        }
    }, [account, page, limit, sortBy, sortOrder, search]);

    const handleUpdateAPR = async () => {
        if (!account || account !== import.meta.env.VITE_ADMIN_ADDRESS) {
            toast.error("Not authorized");
            return;
        }
        try {
            const aprInBasisPoints = web3.utils.toBN(parseFloat(newAPR) * 100);
            await stakingContract.methods
                .updateBaseAPR(aprInBasisPoints)
                .send({ from: account });
            toast.success("APR updated successfully");
        } catch (error) {
            console.error("Failed to update APR:", error);
            toast.error("Failed to update APR");
        }
    };

    if (isLoading) {
        return <CircularProgress />;
    }

    if (account !== import.meta.env.VITE_ADMIN_ADDRESS) {
        return <Typography>Access denied. Admin only.</Typography>;
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Admin Dashboard
            </Typography>
            <Box sx={{ mb: 3 }}>
                <TextField
                    label="New APR (%)"
                    type="number"
                    value={newAPR}
                    onChange={(e) => setNewAPR(e.target.value)}
                    sx={{ mr: 2 }}
                />
                <Button variant="contained" onClick={handleUpdateAPR}>
                    Update APR
                </Button>
            </Box>
            <Typography variant="h5" gutterBottom>
                All Transactions
            </Typography>
            <Box sx={{ mb: 2 }}>
                <TextField
                    label="Search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{ mr: 2 }}
                />
                <TextField
                    select
                    label="Sort By"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    sx={{ mr: 2 }}
                >
                    <MenuItem value="timestamp">Timestamp</MenuItem>
                    <MenuItem value="eventType">Event Type</MenuItem>
                </TextField>
                <TextField
                    select
                    label="Sort Order"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                >
                    <MenuItem value="asc">Ascending</MenuItem>
                    <MenuItem value="desc">Descending</MenuItem>
                </TextField>
            </Box>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>From</TableCell>
                            <TableCell>To</TableCell>
                            <TableCell>Event Type</TableCell>
                            <TableCell>Amount</TableCell>
                            <TableCell>Timestamp</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {transactions.map((tx) => (
                            <TableRow key={tx._id}>
                                <TableCell>{tx.fromAddress}</TableCell>
                                <TableCell>{tx.toAddress}</TableCell>
                                <TableCell>{tx.eventType}</TableCell>
                                <TableCell>{tx.amount}</TableCell>
                                <TableCell>
                                    {new Date(tx.timestamp).toLocaleString()}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default Admin;
