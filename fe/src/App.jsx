import React from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import Header from './components/Header'
import UserDashboard from './pages/UserDashboard'
import TransactionHistory from './pages/TransactionHistory'
import { useWeb3 } from './contexts/Web3Context'
import { Alert } from '@mui/material'

function App() {
    const { chainId } = useWeb3()

    const isCorrectNetwork = chainId === parseInt(import.meta.env.VITE_TESTNET_CHAIN_ID)

    return (
        <Router>
            <div className="App">
                {!isCorrectNetwork && (
                    <Alert severity="error" style={{ position: 'sticky', top: 0, zIndex: 1000 }}>
                        Please connect to BSC Testnet
                    </Alert>
                )}
                <Header />
                <Routes>
                    <Route path="/" element={<UserDashboard />} />
                    <Route path="/history" element={<TransactionHistory />} />
                </Routes>
            </div>
        </Router>
    )
}

export default App