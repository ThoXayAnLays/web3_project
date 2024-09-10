import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Web3Provider as CustomWeb3Provider } from './contexts/Web3Context'
import { Web3ReactProvider } from '@web3-react/core'
import { ethers } from 'ethers'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

function getLibrary(provider) {
  const library = new ethers.providers.Web3Provider(provider)
  library.pollingInterval = 12000
  return library
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Web3ReactProvider getLibrary={getLibrary}>
      <CustomWeb3Provider>
        <App />
        <ToastContainer position="top-right" autoClose={5000} />
      </CustomWeb3Provider>
    </Web3ReactProvider>
  </React.StrictMode>,
)