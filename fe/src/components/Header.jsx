import React, { useContext } from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link } from 'react-router-dom';
import { Web3Context } from '../contexts/Web3Provider';

const Header = () => {
    const { account, tokenABalance, nftBBalance, baseAPR, connectWallet, disconnectWallet } = useContext(Web3Context);

    return (
        <AppBar position="static">
            <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    Web3 Project
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Button color="inherit" component={Link} to="/">Home</Button>
                    <Button color="inherit" component={Link} to="/transactions">Transactions</Button>
                    {account === import.meta.env.VITE_ADMIN_ADDRESS && (
                        <Button color="inherit" component={Link} to="/admin">Admin</Button>
                    )}
                    {account ? (
                        <>
                            <Typography variant="body2" sx={{ mx: 2 }}>
                                Token A: {tokenABalance}
                            </Typography>
                            <Typography variant="body2" sx={{ mx: 2 }}>
                                NFT B: {nftBBalance}
                            </Typography>
                            <Typography variant="body2" sx={{ mx: 2 }}>
                                Base APR: {baseAPR}%
                            </Typography>
                            <Typography variant="body2" sx={{ mx: 2 }}>
                                {account.slice(0, 6)}...{account.slice(-4)}
                            </Typography>
                            <Button color="inherit" onClick={disconnectWallet}>Disconnect</Button>
                        </>
                    ) : (
                        <Button color="inherit" onClick={connectWallet}>Connect Wallet</Button>
                    )}
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Header;