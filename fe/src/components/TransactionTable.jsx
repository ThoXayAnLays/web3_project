import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

const TransactionTable = ({ transactions }) => {
    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>User Address</TableCell>
                        <TableCell>Event Type</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Timestamp</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {transactions.map((tx, index) => (
                        <TableRow key={index}>
                            <TableCell>{tx.user_address}</TableCell>
                            <TableCell>{tx.event_type}</TableCell>
                            <TableCell>{tx.amount}</TableCell>
                            <TableCell>{new Date(tx.timestamp).toLocaleString()}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default TransactionTable;