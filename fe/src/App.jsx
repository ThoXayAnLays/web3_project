import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Web3Provider } from "./contexts/Web3Provider";
import theme from "./theme";
import Header from "./components/Header";
import Home from "./pages/Home";
import Transactions from "./pages/Transactions";
import Admin from "./pages/Admin";

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Web3Provider>
                <Router>
                    <Header />
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route
                            path="/transactions"
                            element={<Transactions />}
                        />
                        <Route path="/admin" element={<Admin />} />
                    </Routes>
                </Router>
                <ToastContainer position="bottom-right" />
            </Web3Provider>
        </ThemeProvider>
    );
}

export default App;
