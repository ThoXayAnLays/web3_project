import React from 'react';
import { Link } from 'react-router-dom';

const Header = ({ isAdmin }) => {
    return (
        <header>
            <nav>
                <ul>
                    <li><Link to="/">Home</Link></li>
                    <li><Link to="/dashboard">Dashboard</Link></li>
                    {isAdmin && (
                        <>
                            <li><Link to="/admin">Admin Dashboard</Link></li>
                            <li><Link to="/admin/jobs">Job Management</Link></li>
                        </>
                    )}
                </ul>
            </nav>
        </header>
    );
};

export default Header;