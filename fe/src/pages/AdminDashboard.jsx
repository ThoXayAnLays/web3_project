import React, { useState, useEffect } from 'react'
import { useWeb3 } from '../contexts/Web3Context'
import { Button, TextField, CircularProgress, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material'
import { toast } from 'react-toastify'

const AdminDashboard = () => {
    const { stakingContract, isAdmin, updateBaseAPR, provider } = useWeb3()
    const [newAPR, setNewAPR] = useState('')
    const [loading, setLoading] = useState(false)
    const [jobStatus, setJobStatus] = useState([])

    const fixedGasLimit = 900000

    useEffect(() => {
        if (isAdmin) {
            fetchJobStatus()
        }
    }, [isAdmin])

    const fetchJobStatus = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BE_API}/jobs/status`, {
                headers: {
                    'X-User-Address': import.meta.env.VITE_ADMIN_ADDRESS,
                    // In a real-world scenario, you'd need to implement proper authentication
                    // 'X-Auth-Signature': signature,
                    // 'X-Auth-Nonce': nonce,
                }
            })
            const data = await response.json()
            setJobStatus(data)
        } catch (error) {
            console.error('Error fetching job status:', error)
            toast.error('Failed to fetch job status')
        }
    }

    const handleTransaction = async (transactionPromise, successMessage) => {
        setLoading(true)
        try {
            const tx = await transactionPromise
            const receipt = await tx.wait()

            if (receipt.status === 1) {
                toast.success(successMessage)
                updateBaseAPR()
            } else {
                toast.error('Transaction failed. Please try again.')
            }
        } catch (error) {
            console.error('Transaction error:', error)
            if (error.code === 'ACTION_REJECTED') {
                toast.error('Transaction was rejected by user')
            } else if (error.code === 'REPLACEMENT_UNDERPRICED') {
                toast.error('Transaction was replaced by a new one')
            } else if (error.code === 'TRANSACTION_REPLACED') {
                if (error.replacement && error.replacement.hash) {
                    const replacementReceipt = await provider.getTransactionReceipt(error.replacement.hash)
                    if (replacementReceipt.status === 1) {
                        toast.success(successMessage)
                    } else {
                        toast.error('Replacement transaction failed')
                    }
                } else {
                    toast.error('Transaction was replaced, but unable to determine outcome')
                }
            } else {
                toast.error(`Transaction failed: ${error.message}`)
            }
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateAPR = async () => {
        if (!newAPR || isNaN(newAPR)) {
            toast.error('Please enter a valid APR')
            return
        }

        await handleTransaction(
            stakingContract.updateBaseAPR(Math.floor(newAPR * 100), { gasLimit: fixedGasLimit }),
            'APR updated successfully'
        )
        setNewAPR('')
    }

    const handleRunJob = async (jobName) => {
        setLoading(true)
        try {
            const response = await fetch(`${import.meta.env.VITE_BE_API}/jobs/run`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Address': import.meta.env.VITE_ADMIN_ADDRESS,
                    // In a real-world scenario, you'd need to implement proper authentication
                    // 'X-Auth-Signature': signature,
                    // 'X-Auth-Nonce': nonce,
                },

                body: JSON.stringify({ jobName })
            })
            const data = await response.json()
            toast.success(data.message)
            fetchJobStatus()
        } catch (error) {
            console.error('Error running job:', error)
            toast.error('Failed to run job: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    if (!isAdmin) {
        return <Typography variant="h6">You do not have admin access.</Typography>
    }

    return (
        <div className="container mx-auto p-4">
            <Typography variant="h4" gutterBottom>Admin Dashboard</Typography>
            <div className="mb-4">
                <TextField
                    label="New APR (%)"
                    type="number"
                    value={newAPR}
                    onChange={(e) => setNewAPR(e.target.value)}
                    disabled={loading}
                />
                <Button variant="contained" color="primary" onClick={handleUpdateAPR} disabled={loading || !newAPR || isNaN(newAPR)}>
                    Update APR
                </Button>
            </div>
            <Typography variant="h5" gutterBottom>Job Status</Typography>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Job Name</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Last Run</TableCell>
                            <TableCell>Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {jobStatus.map((job) => (
                            <TableRow key={job.name}>
                                <TableCell>{job.name}</TableCell>
                                <TableCell>{job.status}</TableCell>
                                <TableCell>{job.lastRun ? new Date(job.lastRun).toLocaleString() : 'Never'}</TableCell>
                                <TableCell>
                                    <Button variant="contained" color="secondary" onClick={() => handleRunJob(job.name)} disabled={loading}>
                                        Run Now
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            {loading && <CircularProgress className="mt-4" />}
        </div>
    )
}

export default AdminDashboard