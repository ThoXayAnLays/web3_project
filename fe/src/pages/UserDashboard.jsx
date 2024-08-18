import React, { useState, useEffect } from 'react';
import TransactionList from '../components/TransactionList';
import Pagination from '../components/Pagination';
import web3Service from '../services/web3Service';
import apiService from '../services/apiService';
import TokenForm from '../components/TokenForm';

const UserDashboard = () => {
    const [account, setAccount] = useState('');
    const [transactions, setTransactions] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [sortBy, setSortBy] = useState('timestamp');
    const [sortOrder, setSortOrder] = useState('DESC');
    const [search, setSearch] = useState('');
    const [amount, setAmount] = useState('');

    useEffect(() => {
        const init = async () => {
            const account = await web3Service.connectWallet();
            setAccount(account);
            fetchTransactions(account, currentPage, sortBy, sortOrder, search);
        };
        init();
    }, []);

    const fetchTransactions = async (account, page, sortBy, sortOrder, search) => {
        const result = await apiService.getUserTransactions(account, page, sortBy, sortOrder, search);
        setTransactions(result.transactions);
        setTotalPages(result.totalPages);
    };

    const handleDeposit = async (values, { setSubmitting }) => {
        try {
            await web3Service.deposit(values.amount);
            alert('Deposit successful');
            fetchTransactions(account, currentPage, sortBy, sortOrder, search);
        } catch (error) {
            alert('Deposit failed: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleWithdraw = async () => {
        try {
            await web3Service.withdraw(amount);
            alert('Withdrawal successful');
            fetchTransactions(account, currentPage, sortBy, sortOrder, search);
        } catch (error) {
            alert('Withdrawal failed: ' + error.message);
        }
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
        fetchTransactions(account, page, sortBy, sortOrder, search);
    };

    const handleSort = (newSortBy) => {
        const newSortOrder = sortBy === newSortBy && sortOrder === 'ASC' ? 'DESC' : 'ASC';
        setSortBy(newSortBy);
        setSortOrder(newSortOrder);
        fetchTransactions(account, currentPage, newSortBy, newSortOrder, search);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchTransactions(account, 1, sortBy, sortOrder, search);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-4">User Dashboard</h1>
            <p className="mb-4">Connected account: <span className="font-mono">{account}</span></p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <TokenForm onSubmit={handleDeposit} action="Deposit" />
                <TokenForm onSubmit={handleWithdraw} action="Withdraw" />
            </div>

            <h2 className="text-2xl font-bold mb-4">Transaction History</h2>

            <form onSubmit={handleSearch} className="mb-4">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search transactions"
                    className="p-2 border rounded mr-2"
                />
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Search</button>
            </form>

            <TransactionList
                transactions={transactions}
                onSort={handleSort}
                sortBy={sortBy}
                sortOrder={sortOrder}
            />

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
            />
        </div>
    );
};

export default UserDashboard;