import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "../contexts/Web3Context";
import { useParams, useNavigate } from "react-router-dom";
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
    Link,
} from "@mui/material";
import { toast } from "react-toastify";

const TransactionHistory = () => {
    const {
        address: connectedAddress,
        isAdmin,
        stakingContract,
        updateBaseAPR,
    } = useWeb3();
    const { address } = useParams();
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalTransactions, setTotalTransactions] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("timestamp");
    const [sortOrder, setSortOrder] = useState("desc");
    const [lastCrawledBlock, setLastCrawledBlock] = useState(null);
    const [newAPR, setNewAPR] = useState("");

    useEffect(() => {
        if (isAdmin && !address) {
            fetchTransactions();
        } else if (address) {
            fetchTransactions(address);
        } else if (connectedAddress) {
            navigate(`/history/${connectedAddress}`);
        }
        fetchLastCrawledBlock();
        const intervalId = setInterval(() => {
            if (isAdmin && !address) {
                fetchTransactions();
            } else if (address) {
                fetchTransactions(address);
            }
            fetchLastCrawledBlock();
        }, 30000);
        return () => clearInterval(intervalId);
    }, [isAdmin, address, connectedAddress, page, limit, sortBy, sortOrder]);

    const fetchTransactions = async (userAddress = null) => {
        setLoading(true);
        setError(null);
        try {
            const baseUrl = `${import.meta.env.VITE_BE_API}/transactions`;
            const url =
                isAdmin && !userAddress
                    ? `${baseUrl}/all`
                    : `${baseUrl}/user/${userAddress || address}`;

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
            setTotalTransactions(data.totalDocs);
        } catch (error) {
            console.error("Error fetching transactions:", error);
            setError(error.message);
            toast.error(`Failed to fetch transactions: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const truncateAddress = (address) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const fetchLastCrawledBlock = async () => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_BE_API}/transactions/lastCrawledBlock`
            );
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setLastCrawledBlock(data.lastCrawledBlock);
        } catch (error) {
            console.error("Error fetching last crawled block:", error);
            toast.error("Failed to fetch last crawled block");
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

    const handleTransactionClick = (transactionHash) => {
        window.open(
            `https://testnet.bscscan.com/tx/${transactionHash}`,
            "_blank"
        );
    };

    const handleAddressClick = (address) => {
        window.open(`https://testnet.bscscan.com/address/${address}`, "_blank");
    };

    const handleBlockClick = (blockNumber) => {
        window.open(
            `https://testnet.bscscan.com/block/${blockNumber}`,
            "_blank"
        );
    };

    const formatTokenAmount = (amount) => {
        return parseFloat(parseFloat(amount).toFixed(2)).toString();
    };

    return (
        <div className="container mx-auto bg-white-800 p-4">
            <Typography variant="h4" gutterBottom>
                {isAdmin ? "All Transactions" : `Transactions for ${address}`}
            </Typography>
            <Typography variant="body1" gutterBottom>
                Total Transactions: {totalTransactions}
            </Typography>
            {lastCrawledBlock && (
                <Typography variant="body2" className="mb-2">
                    Last Crawled Block: {lastCrawledBlock}
                </Typography>
            )}
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
                    label="Search (Address/Block/Hash)"
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
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Transaction Hash</TableCell>
                            <TableCell>Event Type</TableCell>
                            <TableCell>Block</TableCell>
                            <TableCell>From</TableCell>
                            <TableCell>To</TableCell>
                            <TableCell>Amount (ETH)</TableCell>
                            <TableCell>Gas Used (Wei)</TableCell>
                            <TableCell>Timestamp</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {transactions.map((tx) => (
                            <TableRow key={tx._id}>
                                <TableCell>
                                    <Link
                                        component="button"
                                        variant="body2"
                                        onClick={() =>
                                            handleTransactionClick(
                                                tx.transactionHash
                                            )
                                        }
                                    >
                                        {tx.transactionHash.slice(0, 6)}...
                                        {tx.transactionHash.slice(-4)}
                                    </Link>
                                </TableCell>
                                <TableCell>{tx.eventType}</TableCell>
                                <TableCell>
                                    <Link
                                        component="button"
                                        variant="body2"
                                        onClick={() =>
                                            handleBlockClick(tx.blockNumber)
                                        }
                                    >
                                        {tx.blockNumber}
                                    </Link>
                                </TableCell>
                                <TableCell>
                                    <Link
                                        component="button"
                                        variant="body2"
                                        onClick={() =>
                                            handleAddressClick(tx.fromAddress)
                                        }
                                    >
                                        {truncateAddress(tx.fromAddress)}
                                    </Link>
                                </TableCell>
                                <TableCell>
                                    <Link
                                        component="button"
                                        variant="body2"
                                        onClick={() =>
                                            handleAddressClick(tx.toAddress)
                                        }
                                    >
                                        {truncateAddress(tx.toAddress)}
                                    </Link>
                                </TableCell>
                                <TableCell>
                                    {formatTokenAmount(
                                        ethers.utils.formatEther(tx.amount)
                                    )}
                                </TableCell>
                                <TableCell>{tx.gasUsed}</TableCell>
                                <TableCell>
                                    {new Date(tx.timestamp).toLocaleString()}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
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
