import React, { useContext, useState, useEffect } from "react";
import { Web3Context } from "../contexts/Web3Provider";
import {
    Typography,
    Box,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TablePagination,
    TextField,
} from "@mui/material";
import { toast } from "react-toastify";
import { BE_API } from "../config";

const UserTransactions = () => {
    const { account, isLoading } = useContext(Web3Context);
    const [transactions, setTransactions] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [sortBy, setSortBy] = useState("timestamp");
    const [sortOrder, setSortOrder] = useState("desc");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (account) {
            fetchTransactions();
        }
    }, [account, page, rowsPerPage, sortBy, sortOrder, searchQuery]);

    const fetchTransactions = async () => {
        try {
            const response = await fetch(
                `${BE_API}/transactions/user/${account}?page=${
                    page + 1
                }&limit=${rowsPerPage}&sortBy=${sortBy}&sortOrder=${sortOrder}&search=${searchQuery}`
            );
            const data = await response.json();
            setTransactions(data.docs);
            setTotalCount(data.totalDocs);
        } catch (error) {
            console.error("Error fetching transactions:", error);
            toast.error("Failed to fetch transactions");
        }
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleSort = (column) => {
        const isAsc = sortBy === column && sortOrder === "asc";
        setSortOrder(isAsc ? "desc" : "asc");
        setSortBy(column);
    };

    if (isLoading) {
        return <CircularProgress />;
    }

    if (!account) {
        return (
            <Typography>
                Please connect your wallet to view transactions.
            </Typography>
        );
    }

    return (
        <Box sx={{ maxWidth: 1200, margin: "auto", padding: 3 }}>
            <Typography variant="h4" gutterBottom>
                Your Transactions
            </Typography>
            <TextField
                label="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                fullWidth
                margin="normal"
            />
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell onClick={() => handleSort("eventType")}>
                                Event Type
                            </TableCell>
                            <TableCell onClick={() => handleSort("amount")}>
                                Amount
                            </TableCell>
                            <TableCell onClick={() => handleSort("timestamp")}>
                                Timestamp
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {transactions.map((transaction) => (
                            <TableRow key={transaction._id}>
                                <TableCell>{transaction.eventType}</TableCell>
                                <TableCell>{transaction.amount}</TableCell>
                                <TableCell>
                                    {new Date(
                                        transaction.timestamp
                                    ).toLocaleString()}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                component="div"
                count={totalCount}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
        </Box>
    );
};

export default UserTransactions;
