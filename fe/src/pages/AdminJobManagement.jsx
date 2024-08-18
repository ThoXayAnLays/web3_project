import React, { useState, useEffect } from 'react';
import Pagination from '../components/Pagination';
import apiService from '../services/apiService';

const AdminJobManagement = () => {
    const [jobs, setJobs] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [sortBy, setSortBy] = useState('created_at');
    const [sortOrder, setSortOrder] = useState('DESC');
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchJobs(currentPage, sortBy, sortOrder, search);
    }, []);

    const fetchJobs = async (page, sortBy, sortOrder, search) => {
        const result = await apiService.getJobs(page, sortBy, sortOrder, search);
        setJobs(result.jobs);
        setTotalPages(result.totalPages);
    };

    const handleRetryJob = async (jobId) => {
        await apiService.retryJob(jobId);
        fetchJobs(currentPage, sortBy, sortOrder, search);
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
        fetchJobs(page, sortBy, sortOrder, search);
    };

    const handleSort = (newSortBy) => {
        const newSortOrder = sortBy === newSortBy && sortOrder === 'ASC' ? 'DESC' : 'ASC';
        setSortBy(newSortBy);
        setSortOrder(newSortOrder);
        fetchJobs(currentPage, newSortBy, newSortOrder, search);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchJobs(1, sortBy, sortOrder, search);
    };

    const renderSortIcon = (column) => {
        if (sortBy === column) {
            return sortOrder === 'ASC' ? '↑' : '↓';
        }
        return null;
    };

    return (
        <div>
            <h1>Job Management</h1>
            <form onSubmit={handleSearch}>
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search jobs"
                />
                <button type="submit">Search</button>
            </form>
            <table>
                <thead>
                    <tr>
                        <th onClick={() => handleSort('id')}>Job ID {renderSortIcon('id')}</th>
                        <th onClick={() => handleSort('type')}>Type {renderSortIcon('type')}</th>
                        <th onClick={() => handleSort('status')}>Status {renderSortIcon('status')}</th>
                        <th onClick={() => handleSort('created_at')}>Created At {renderSortIcon('created_at')}</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {jobs.map((job) => (
                        <tr key={job.id}>
                            <td>{job.id}</td>
                            <td>{job.type}</td>
                            <td>{job.status}</td>
                            <td>{new Date(job.created_at).toLocaleString()}</td>
                            <td>
                                {job.status === 'failed' && (
                                    <button onClick={() => handleRetryJob(job.id)}>Retry</button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
            />
        </div>
    );
};

export default AdminJobManagement;