import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import TransactionHistory from './pages/TransactionHistory';
import { useWeb3 } from './context/Web3Context';

const ProtectedRoute = ({ children }) => {
  const { isConnected, isAdmin } = useWeb3();
  if (!isConnected || !isAdmin) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <div>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/user" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/transactions" element={<TransactionHistory />} />
      </Routes>
      <Footer />
    </div>
  );
}

export default App;