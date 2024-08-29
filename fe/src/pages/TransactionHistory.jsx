import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "../contexts/Web3Context";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    TextField,
    Button,
    CircularProgress,
    Select,
    MenuItem,
} from "@mui/material";
import { toast } from "react-toastify";

const TransactionHistory = () => {
    const { address, isAdmin, stakingContract, updateBaseAPR } = useWeb3();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("timestamp");
    const [sortOrder, setSortOrder] = useState("desc");
    const [newAPR, setNewAPR] = useState("");

    useEffect(() => {
        if (address) {
            fetchTransactions();
        }
    }, [address, isAdmin, page, limit, sortBy, sortOrder]);

    const fetchTransactions = async () => {
        setLoading(true);
        setError(null);
        try {
            const baseUrl = `${import.meta.env.VITE_BE_API}/transactions`;
            const url = isAdmin
                ? `${baseUrl}/all`
                : `${baseUrl}/user/${address}`;

            const queryParams = new URLSearchParams({
                page,
                limit,
                sortBy,
                sortOrder,
                search: searchQuery,
            }).toString();

            const response = await fetch(`${url}?${queryParams}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setTransactions(data.docs);
            setTotalPages(data.totalPages);
        } catch (error) {
            console.error("Error fetching transactions:", error);
            setError(error.message);
            toast.error(`Failed to fetch transactions: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setPage(1);
        fetchTransactions();
    };

    const handleSortChange = (event) => {
        setSortBy(event.target.value);
    };

    const handleSortOrderChange = () => {
        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    };

    const handleUpdateAPR = async () => {
        if (!newAPR || isNaN(newAPR)) {
            toast.error("Please enter a valid APR");
            return;
        }

        setLoading(true);
        try {
            const tx = await stakingContract.updateBaseAPR(
                Math.floor(newAPR * 100),
                { gasLimit: 900000 }
            );
            const receipt = await tx.wait();

            if (receipt.status === 1) {
                toast.success("APR updated successfully");
                updateBaseAPR();
                setNewAPR("");
            } else {
                toast.error("Transaction failed. Please try again.");
            }
        } catch (error) {
            console.error("Transaction error:", error);
            toast.error(`Transaction failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (!isAdmin && !address) {
        return (
            <Typography>
                Please connect your wallet to view transactions.
            </Typography>
        );
    }

    return (
        <div className="container mx-auto bg-white-800 p-4">
            <Typography variant="h4" gutterBottom>
                {isAdmin ? "All Transactions" : "Your Transactions"}
            </Typography>
            {isAdmin && (
                <div className="mb-4">
                    <TextField
                        label="New APR (%)"
                        type="number"
                        value={newAPR}
                        onChange={(e) => setNewAPR(e.target.value)}
                        disabled={loading}
                    />
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleUpdateAPR}
                        disabled={loading || !newAPR || isNaN(newAPR)}
                    >
                        Update APR
                    </Button>
                </div>
            )}
            <div className="mb-4 flex items-center space-x-2">
                <TextField
                    label="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSearch}
                >
                    Search
                </Button>
                <Select value={sortBy} onChange={handleSortChange}>
                    <MenuItem value="timestamp">Timestamp</MenuItem>
                    <MenuItem value="eventType">Event Type</MenuItem>
                    <MenuItem value="amount">Amount</MenuItem>
                </Select>
                <Button variant="outlined" onClick={handleSortOrderChange}>
                    {sortOrder === "asc" ? "Ascending" : "Descending"}
                </Button>
            </div>
            {loading ? (
                <CircularProgress />
            ) : error ? (
                <Typography color="error">{error}</Typography>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>From</TableCell>
                                <TableCell>To</TableCell>
                                <TableCell>Event Type</TableCell>
                                <TableCell>Amount (ETH)</TableCell>
                                <TableCell>Gas Used (ETH)</TableCell>
                                <TableCell>Timestamp</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {transactions.map((tx) => (
                                <TableRow key={tx._id}>
                                    <TableCell>{tx.fromAddress}</TableCell>
                                    <TableCell>{tx.toAddress}</TableCell>
                                    <TableCell>{tx.eventType}</TableCell>
                                    <TableCell>
                                        {ethers.utils.formatEther(tx.amount)}
                                    </TableCell>
                                    <TableCell>
                                        {ethers.utils.formatEther(tx.gasUsed)}
                                    </TableCell>
                                    <TableCell>
                                        {new Date(
                                            tx.timestamp
                                        ).toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
            <div className="mt-4 flex justify-between items-center">
                <div>
                    <Button
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                    >
                        Previous
                    </Button>
                    <span className="mx-2">
                        Page {page} of {totalPages}
                    </span>
                    <Button
                        disabled={page === totalPages}
                        onClick={() => setPage(page + 1)}
                    >
                        Next
                    </Button>
                </div>
                <Select
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                >
                    <MenuItem value={10}>10 per page</MenuItem>
                    <MenuItem value={25}>25 per page</MenuItem>
                    <MenuItem value={50}>50 per page</MenuItem>
                </Select>
            </div>
        </div>
    );
};

export default TransactionHistory;
