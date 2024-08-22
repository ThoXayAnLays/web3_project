import React, { useState, useEffect } from 'react'
import { useWeb3 } from '../contexts/Web3Context'
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, TextField, Button, CircularProgress } from '@mui/material'
import { toast } from 'react-toastify'

const TransactionHistory = () => {
    const { address, isAdmin } = useWeb3()
    const [transactions, setTransactions] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(10)
    const [totalPages, setTotalPages] = useState(1)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        if (address) {
            fetchTransactions()
        }
    }, [address, isAdmin, page, limit])

    const fetchTransactions = async () => {
        setLoading(true)
        setError(null)
        try {
            let url
            if (isAdmin) {
                url = `${import.meta.env.VITE_BE_API}/transactions/all?page=${page}&limit=${limit}`
            } else {
                url = `${import.meta.env.VITE_BE_API}/transactions/user/${address}?page=${page}&limit=${limit}`
            }
            if (searchQuery) {
                url += `&query=${searchQuery}`
            }
            const response = await fetch(url)
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            const text = await response.text()
            let data
            try {
                data = JSON.parse(text)
            } catch (e) {
                console.error('Server response:', text)
                throw new Error('The server response was not valid JSON')
            }
            setTransactions(data.docs)
            setTotalPages(data.totalPages)
        } catch (error) {
            console.error('Error fetching transactions:', error)
            setError(error.message)
            toast.error(`Failed to fetch transactions: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = () => {
        setPage(1)
        fetchTransactions()
    }

    return (
        <div className="container mx-auto bg-white-800 p-4">
            <Typography variant="h4" gutterBottom>Transaction History</Typography>
            <div className="mb-4">
                <TextField
                    label="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button variant="contained" color="primary" onClick={handleSearch}>
                    Search
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
                                    <TableCell>{new Date(tx.timestamp).toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
            <div className="mt-4">
                <Button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                >
                    Previous
                </Button>
                <span className="mx-2">Page {page} of {totalPages}</span>
                <Button
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                >
                    Next
                </Button>
            </div>
        </div>
    )
}

export default TransactionHistory