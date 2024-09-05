import React from 'react'
import { Link } from 'react-router-dom'
import { useWeb3 } from '../contexts/Web3Context'
import { Button, Typography } from '@mui/material'

const Header = () => {
    const { address, isAdmin, connectWallet, provider, tokenABalance, nftBBalance, baseAPR } = useWeb3()

    const handleConnect = async () => {
        try {
            if (window.ethereum) {
                await connectWallet()
            } else {
                console.error('No Ethereum provider available')
            }
        } catch (error) {
            console.error('Error connecting wallet:', error)
        }
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
                    {baseAPR !== null && (
                        <Typography variant="body2" className="text-yellow-400">
                            Base APR: {baseAPR}%
                        </Typography>
                    )}
                    {address ? (
                        <>
                            <span>TokenA: {tokenABalance}</span>
                            <span>NFTB: {nftBBalance}</span>
                            <span>{address.slice(0, 6)}...{address.slice(-4)}</span>
                        </>
                    ) : (
                        <Button variant="contained" color="primary" onClick={handleConnect}>
                            Connect Wallet
                        </Button>
                    )}
                </div>
            </div>
        </header>
    )
}

export default Header