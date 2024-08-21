import React, { useContext, useState } from 'react';
import { Web3Context } from '../context/Web3Context';
import TransactionHistory from '../components/TransactionHistory';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
    const { account, stakingContract } = useContext(Web3Context);
    const [newAPR, setNewAPR] = useState('');

    if (account !== import.meta.env.VITE_ADMIN_ADDRESS) {
        return <div className="container mx-auto mt-8 text-red-600">Access denied. Admin only.</div>;
    }

    const handleUpdateAPR = async (e) => {
        e.preventDefault();
        if (!newAPR || isNaN(newAPR) || parseFloat(newAPR) < 0) {
            toast.error('Please enter a valid APR');
            return;
        }

        try {
            const aprBasisPoints = Math.floor(parseFloat(newAPR) * 100);
            await stakingContract.methods.updateBaseAPR(aprBasisPoints).send({ from: account });
            toast.success('APR updated successfully');
            setNewAPR('');
        } catch (error) {
            toast.error('Error updating APR');
            console.error(error);
        }
    };

    return (
        <div className="container mx-auto mt-8">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">Admin Dashboard</h1>
            <form onSubmit={handleUpdateAPR} className="mb-8">
                <div className="flex items-center">
                    <input
                        type="text"
                        placeholder="New APR (%)"
                        value={newAPR}
                        onChange={(e) => setNewAPR(e.target.value)}
                        className="border rounded px-2 py-1 mr-2 text-gray-700"
                    />
                    <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                        Update APR
                    </button>
                </div>
            </form>
            <TransactionHistory isAdmin={true} />
        </div>
    );
};

export default AdminDashboard;