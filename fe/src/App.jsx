import React from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import Box from '@mui/material/Box'
import Header from './components/Header'
import UserDashboard from './pages/UserDashboard'
import TransactionHistory from './pages/TransactionHistory'
import { useWeb3 } from './contexts/Web3Context'
import { Alert } from '@mui/material'
import theme from './theme' // Import the custom theme

function App() {
    const { chainId } = useWeb3()

    const isCorrectNetwork = chainId === parseInt(import.meta.env.VITE_TESTNET_CHAIN_ID)

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Router>
                <Box sx={{ 
                    minHeight: '100vh', 
                    backgroundColor: 'background.default',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {!isCorrectNetwork && (
                        <Alert severity="error" style={{ position: 'sticky', top: 0, zIndex: 1000 }}>
                            Please connect to BSC Testnet
                        </Alert>
                    )}
                    <Header />
                    <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                        <Routes>
                            <Route path="/" element={<UserDashboard />} />
                            <Route path="/history" element={<TransactionHistory />} />
                        </Routes>
                    </Box>
                </Box>
            </Router>
        </ThemeProvider>
    )
}

export default App