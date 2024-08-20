import React from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';

const Header = () => {
    const { isConnected, userAddress, connectWallet } = useWeb3();

    const handleConnect = async () => {
        await connectWallet();
    };

    return (
        <AppBar position="static">
            <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>DeFi Project</Link>
                </Typography>
                <Button color="inherit" component={Link} to="/user">User Dashboard</Button>
                <Button color="inherit" component={Link} to="/admin">Admin Dashboard</Button>
                <Button color="inherit" component={Link} to="/transactions">Transactions</Button>
                {isConnected ? (
                    <Typography variant="body2" sx={{ ml: 2 }}>
                        {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                    </Typography>
                ) : (
                    <Button color="inherit" onClick={handleConnect}>Connect Wallet</Button>
                )}
            </Toolbar>
        </AppBar>
    );
};

export default Header;