import React from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import Header from './components/Header'
import UserDashboard from './pages/UserDashboard'
import AdminDashboard from './pages/AdminDashboard'
import TransactionHistory from './pages/TransactionHistory'
import { useWeb3 } from './contexts/Web3Context'

function App() {
    const { isAdmin } = useWeb3()

    return (
        <Router>
            <div className="App">
                <Header />
                <Routes>
                    <Route path="/" element={<UserDashboard />} />
                    {isAdmin && <Route path="/admin" element={<AdminDashboard />} />}
                    <Route path="/history" element={<TransactionHistory />} />
                </Routes>
            </div>
        </Router>
    )
}

export default App