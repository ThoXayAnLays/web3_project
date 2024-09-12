import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useWeb3 } from '../contexts/Web3Context'
import { Button, Typography, Menu, MenuItem } from '@mui/material'

const Header = () => {
    const { address, isAdmin, connectWallet, disconnectWallet, isConnected, tokenABalance, nftBBalance, baseAPR, stakingContract, updateBalances, tokenAContract, nftBContract } = useWeb3()
    const [anchorEl, setAnchorEl] = useState(null)
    const [localBaseAPR, setLocalBaseAPR] = useState(baseAPR)

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget)
    }

    const handleClose = () => {
        setAnchorEl(null)
    }

    const handleConnect = async (connectorType) => {
        handleClose()
        try {
            await connectWallet(connectorType)
        } catch (error) {
            console.error('Error connecting wallet:', error)
        }
    }

    const handleDisconnect = async () => {
        try {
            await disconnectWallet()
        } catch (error) {
            console.error('Error disconnecting wallet:', error)
        }
    }

    const fetchAPR = useCallback(async () => {
        if (stakingContract) {
            const apr = await stakingContract.baseAPR()
            setLocalBaseAPR(apr.toNumber() / 100)
        }
    }, [stakingContract])

    useEffect(() => {
        fetchAPR()
        const interval = setInterval(fetchAPR, 10000)

        return () => clearInterval(interval)
    }, [fetchAPR])

    useEffect(() => {
        if (isConnected && address) {
            updateBalances(address, tokenAContract, nftBContract)
        }
    }, [isConnected, address, updateBalances, tokenAContract, nftBContract])

    const formatTokenAmount = (amount) => {
        return parseFloat(amount).toFixed(2)
    }

    return (
        <header className="bg-gray-800 text-white p-4">
            <div className="container mx-auto flex justify-between items-center">
                <nav>
                    <ul className="flex space-x-4">
                        <li><Link to="/">Home</Link></li>
                        <li><Link to="/history">History</Link></li>
                    </ul>
                </nav>
                <div className="flex items-center space-x-4">
                    {localBaseAPR !== null && (
                        <Typography variant="body2" className="text-yellow-400">
                            Base APR: {localBaseAPR}%
                        </Typography>
                    )}
                    {isConnected ? (
                        <>
                            <span>TokenA: {formatTokenAmount(tokenABalance)}</span>
                            <span>NFTB: {nftBBalance}</span>
                            <span>{address.slice(0, 6)}...{address.slice(-4)}</span>
                            <Button variant="contained" color="secondary" onClick={handleDisconnect}>
                                Disconnect
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="contained" color="primary" onClick={handleClick}>
                                Connect Wallet
                            </Button>
                            <Menu
                                anchorEl={anchorEl}
                                open={Boolean(anchorEl)}
                                onClose={handleClose}
                            >
                                <MenuItem onClick={() => handleConnect('injected')}>MetaMask</MenuItem>
                                <MenuItem onClick={() => handleConnect('walletconnect')}>WalletConnect</MenuItem>
                            </Menu>
                        </>
                    )}
                </div>
            </div>
        </header>
    )
}

export default Header