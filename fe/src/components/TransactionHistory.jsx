import React, { useState, useEffect, useContext } from 'react';
import { Web3Context } from '../context/Web3Context';
import axios from 'axios';

const TransactionHistory = ({ isAdmin = false }) => {
    const { account } = useContext(Web3Context);
    const [transactions, setTransactions] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [sortBy, setSortBy] = useState('timestamp');
    const [sortOrder, setSortOrder] = useState('desc');
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchTransactions();
    }, [account, currentPage, sortBy, sortOrder, search]);

    const fetchTransactions = async () => {
        try {
            const endpoint = isAdmin
                ? `${import.meta.env.VITE_BE_API}/transactions`
                : `${import.meta.env.VITE_BE_API}/transactions/user/${account}`;

            const response = await axios.get(endpoint, {
                params: { page: currentPage, sortBy, order: sortOrder, search },
                headers: isAdmin ? { 'X-User-Address': account } : {}
            });

            setTransactions(response.data.transactions);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    };

    const handleSort = (field) => {
        if (field === sortBy) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    return (
        <div className="container mx-auto mt-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Transaction History</h2>
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search transactions"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="border rounded px-2 py-1 text-gray-700"
                />
            </div>
            <table className="min-w-full bg-white">
                <thead>
                    <tr>
                        <th className="py-2 px-4 border-b cursor-pointer text-gray-700" onClick={() => handleSort('senderAddress')}>Sender</th>
                        <th className="py-2 px-4 border-b cursor-pointer text-gray-700" onClick={() => handleSort('receiverAddress')}>Receiver</th>
                        <th className="py-2 px-4 border-b cursor-pointer text-gray-700" onClick={() => handleSort('amount')}>Amount</th>
                        <th className="py-2 px-4 border-b cursor-pointer text-gray-700" onClick={() => handleSort('timestamp')}>Timestamp</th>
                        <th className="py-2 px-4 border-b cursor-pointer text-gray-700" onClick={() => handleSort('eventType')}>Event Type</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map((tx) => (
                        <tr key={tx.transactionHash}>
                            <td className="py-2 px-4 border-b text-gray-700">{tx.senderAddress}</td>
                            <td className="py-2 px-4 border-b text-gray-700">{tx.receiverAddress}</td>
                            <td className="py-2 px-4 border-b text-gray-700">{tx.amount}</td>
                            <td className="py-2 px-4 border-b text-gray-700">{new Date(tx.timestamp).toLocaleString()}</td>
                            <td className="py-2 px-4 border-b text-gray-700">{tx.eventType}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="mt-4 flex justify-between items-center">
                <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
                >
                    Previous
                </button>
                <span className="text-gray-700">Page {currentPage} of {totalPages}</span>
                <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default TransactionHistory;