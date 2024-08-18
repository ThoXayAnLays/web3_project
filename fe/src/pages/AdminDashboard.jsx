import React, { useState, useEffect } from 'react';
import TransactionList from '../components/TransactionList';
import Pagination from '../components/Pagination';
import web3Service from '../services/web3Service';
import apiService from '../services/apiService';

const AdminDashboard = () => {
    const [transactions, setTransactions] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [newAPR, setNewAPR] = useState('');

    useEffect(() => {
        fetchTransactions(currentPage);
    }, []);

    const fetchTransactions = async (page) => {
        const result = await apiService.getAllTransactions(page);
        setTransactions(result.transactions);
        setTotalPages(result.totalPages);
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
        fetchTransactions(page);
    };

    const handleAPRUpdate = async () => {
        await apiService.updateAPR(newAPR);
        alert('APR updated successfully');
    };

    return (
        <div>
            <h1>Admin Dashboard</h1>
            <div>
                <h2>Update APR</h2>
                <input
                    type="number"
                    value={newAPR}
                    onChange={(e) => setNewAPR(e.target.value)}
                    placeholder="New APR"
                />
                <button onClick={handleAPRUpdate}>Update APR</button>
            </div>
            <h2>All Transactions</h2>
            <TransactionList transactions={transactions} />
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
            />
        </div>
    );
};

export default AdminDashboard;