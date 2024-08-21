import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { Web3Context } from '../context/Web3Context';

const Header = () => {
    const { account, balance, connectWallet, disconnectWallet } = useContext(Web3Context);

    return (
        <header className="bg-blue-600 text-white p-4">
            <div className="container mx-auto flex justify-between items-center">
                <h1 className="text-2xl font-bold">Web3 Project</h1>
                <nav>
                    <ul className="flex space-x-4">
                        <li><Link to="/" className="hover:text-blue-200">Home</Link></li>
                        {account === import.meta.env.VITE_ADMIN_ADDRESS && (
                            <>
                                <li><Link to="/admin" className="hover:text-blue-200">Admin Dashboard</Link></li>
                                <li><Link to="/cron-jobs" className="hover:text-blue-200">Cron Jobs</Link></li>
                            </>
                        )}
                    </ul>
                </nav>
                <div>
                    {account ? (
                        <div className="text-sm">
                            <p>Connected: {account.slice(0, 6)}...{account.slice(-4)}</p>
                            <p>Balance: {parseFloat(balance).toFixed(4)} TKA</p>
                            <button onClick={disconnectWallet} className="bg-red-500 text-white px-4 py-2 rounded mt-2 hover:bg-red-600">
                                Disconnect
                            </button>
                        </div>
                    ) : (
                        <button onClick={connectWallet} className="bg-white text-blue-600 px-4 py-2 rounded hover:bg-blue-100">
                            Connect Wallet
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;