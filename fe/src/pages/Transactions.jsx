import React, { useContext, useEffect, useState } from "react";
import { Web3Context } from "../contexts/Web3Provider";
import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TextField,
    MenuItem,
    CircularProgress,
} from "@mui/material";
import axios from "axios";

const Transactions = () => {
    const { account, isLoading } = useContext(Web3Context);
    const [transactions, setTransactions] = useState([]);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [sortBy, setSortBy] = useState("timestamp");
    const [sortOrder, setSortOrder] = useState("desc");
    const [search, setSearch] = useState("");

    useEffect(() => {
        const fetchTransactions = async () => {
            if (!account) return;
            try {
                const response = await axios.get(
                    `${
                        import.meta.env.VITE_BE_API
                    }/transactions/user/${account}`,
                    {
                        params: { page, limit, sortBy, sortOrder, search },
                    }
                );
                setTransactions(response.data.docs);
            } catch (error) {
                console.error("Failed to fetch transactions:", error);
            }
        };

        fetchTransactions();
    }, [account, page, limit, sortBy, sortOrder, search]);

    if (isLoading) {
        return <CircularProgress />;
    }

    return (
        <Box sx={{ p: 3 }}>
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
                            <TableCell>Event Type</TableCell>
                            <TableCell>Amount</TableCell>
                            <TableCell>Timestamp</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {transactions.map((tx) => (
                            <TableRow key={tx._id}>
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

export default Transactions;
