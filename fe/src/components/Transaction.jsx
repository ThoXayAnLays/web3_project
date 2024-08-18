import React from 'react';

const TransactionList = ({ transactions, onSort, sortBy, sortOrder }) => {
    const renderSortIcon = (column) => {
        if (sortBy === column) {
            return sortOrder === 'ASC' ? '↑' : '↓';
        }
        return null;
    };

    return (
        <table>
            <thead>
                <tr>
                    <th onClick={() => onSort('from')}>From {renderSortIcon('from')}</th>
                    <th onClick={() => onSort('to')}>To {renderSortIcon('to')}</th>
                    <th onClick={() => onSort('value')}>Value {renderSortIcon('value')}</th>
                    <th onClick={() => onSort('hash')}>Hash {renderSortIcon('hash')}</th>
                    <th onClick={() => onSort('timestamp')}>Timestamp {renderSortIcon('timestamp')}</th>
                </tr>
            </thead>
            <tbody>
                {transactions.map((tx) => (
                    <tr key={tx.hash}>
                        <td>{tx.from}</td>
                        <td>{tx.to}</td>
                        <td>{tx.value}</td>
                        <td>{tx.hash}</td>
                        <td>{new Date(tx.timestamp * 1000).toLocaleString()}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default TransactionList;