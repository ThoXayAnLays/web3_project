import React, { useContext, useState, useEffect } from 'react';
import { Web3Context } from '../context/Web3Context';
import axios from 'axios';
import { toast } from 'react-toastify';

const CronJobManager = () => {
    const { account } = useContext(Web3Context);
    const [jobs, setJobs] = useState([]);

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_BE_API}/jobs`, {
                headers: { 'X-User-Address': account }
            });
            setJobs(response.data);
        } catch (error) {
            console.error('Error fetching jobs:', error);
            toast.error('Failed to fetch jobs');
        }
    };

    const handleJobAction = async (jobName, action) => {
        try {
            await axios.post(`${import.meta.env.VITE_BE_API}/jobs/${jobName}/${action}`, {}, {
                headers: { 'X-User-Address': account }
            });
            toast.success(`Job ${action}ed successfully`);
            fetchJobs();
        } catch (error) {
            console.error(`Error ${action}ing job:`, error);
            toast.error(`Failed to ${action} job`);
        }
    };

    if (account !== import.meta.env.VITE_ADMIN_ADDRESS) {
        return <div className="container mx-auto mt-8">Access denied. Admin only.</div>;
    }

    return (
        <div className="container mx-auto mt-8">
            <h1 className="text-3xl font-bold mb-8">Cron Job Manager</h1>
            <table className="min-w-full bg-white">
                <thead>
                    <tr>
                        <th className="py-2 px-4 border-b">Job Name</th>
                        <th className="py-2 px-4 border-b">Next Invocation</th>
                        <th className="py-2 px-4 border-b">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {jobs.map((job) => (
                        <tr key={job.name}>
                            <td className="py-2 px-4 border-b">{job.name}</td>
                            <td className="py-2 px-4 border-b">{new Date(job.nextInvocation).toLocaleString()}</td>
                            <td className="py-2 px-4 border-b">
                                <button
                                    onClick={() => handleJobAction(job.name, 'pause')}
                                    className="bg-yellow-500 text-white px-2 py-1 rounded mr-2"
                                >
                                    Pause
                                </button>
                                <button
                                    onClick={() => handleJobAction(job.name, 'resume')}
                                    className="bg-green-500 text-white px-2 py-1 rounded"
                                >
                                    Resume
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default CronJobManager;