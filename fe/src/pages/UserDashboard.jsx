import React, { useState, useEffect } from 'react'
import { useWeb3 } from '../contexts/Web3Context'
import StakingInfo from '../components/StakingInfo'
import { Button, TextField, CircularProgress, Select, MenuItem, FormControl, InputLabel, Typography, Checkbox, ListItemText } from '@mui/material'
import { ethers } from 'ethers'
import { toast } from 'react-toastify'

const UserDashboard = () => {
    const { address, tokenAContract, nftBContract, stakingContract, updateBalances, provider } = useWeb3()
    const [amount, setAmount] = useState('')
    const [loading, setLoading] = useState(false)
    const [ownedNFTs, setOwnedNFTs] = useState([])
    const [stakedNFTs, setStakedNFTs] = useState([])
    const [selectedNFTs, setSelectedNFTs] = useState([])
    const [tokenABalance, setTokenABalance] = useState('0')
    const [stakedAmount, setStakedAmount] = useState('0')
    const [reward, setReward] = useState('0')

    const fixedGasLimit = 900000

    useEffect(() => {
        if (address && tokenAContract && nftBContract && stakingContract) {
            fetchOwnedNFTs()
            fetchStakedNFTs()
            fetchTokenABalance()
            fetchStakedAmount()
            fetchReward()
        }
    }, [address, tokenAContract, nftBContract, stakingContract])

    const fetchOwnedNFTs = async () => {
        try {
            const filter = nftBContract.filters.Transfer(null, address, null)
            const events = await nftBContract.queryFilter(filter, 0, 'latest')

            const ownedNFTs = new Set()
            for (const event of events) {
                const tokenId = event.args.tokenId.toString()
                try {
                    const owner = await nftBContract.ownerOf(tokenId)
                    if (owner.toLowerCase() === address.toLowerCase()) {
                        ownedNFTs.add(tokenId)
                    }
                } catch (error) {
                    // NFT has been transferred or burned, ignore it
                    continue
                }
            }

            setOwnedNFTs(Array.from(ownedNFTs))
        } catch (error) {
            console.error('Error fetching owned NFTs:', error)
            toast.error('Failed to fetch owned NFTs')
        }
    }

    const fetchStakedNFTs = async () => {
        try {
            const stake = await stakingContract.stakes(address)
            const nftCount = stake.nftCount.toNumber()
            const nfts = []
            for (let i = 0; i < nftCount; i++) {
                const tokenId = await stakingContract.stakedNFTs(address, i)
                nfts.push(tokenId.toString())
            }
            setStakedNFTs(nfts)
        } catch (error) {
            console.error('Error fetching staked NFTs:', error)
            toast.error('Failed to fetch staked NFTs')
        }
    }

    const fetchTokenABalance = async () => {
        try {
            const balance = await tokenAContract.balanceOf(address)
            setTokenABalance(ethers.utils.formatEther(balance))
        } catch (error) {
            console.error('Error fetching Token A balance:', error)
        }
    }

    const fetchStakedAmount = async () => {
        try {
            const stake = await stakingContract.stakes(address)
            setStakedAmount(ethers.utils.formatEther(stake.amount))
        } catch (error) {
            console.error('Error fetching staked amount:', error)
        }
    }

    const fetchReward = async () => {
        try {
            const rewardAmount = await stakingContract.calculateReward(address)
            setReward(ethers.utils.formatEther(rewardAmount))
        } catch (error) {
            console.error('Error fetching reward:', error)
        }
    }

    const handleTransaction = async (transactionPromise, successMessage) => {
        setLoading(true)
        try {
            const tx = await transactionPromise
            const receipt = await tx.wait()

            if (receipt.status === 1) {
                toast.success(successMessage)
                updateBalances(address, tokenAContract, nftBContract)
                fetchTokenABalance()
                fetchStakedAmount()
                fetchReward()
                fetchOwnedNFTs()
                fetchStakedNFTs()
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

    const handleDeposit = async () => {
        if (!amount || isNaN(amount) || Number(amount) <= 0 || Number(amount) > Number(tokenABalance)) {
            toast.error('Please enter a valid amount')
            return
        }

        const amountWei = ethers.utils.parseEther(amount)
        const allowance = await tokenAContract.allowance(address, stakingContract.address)

        if (allowance.lt(amountWei)) {
            await handleTransaction(
                tokenAContract.approve(stakingContract.address, amountWei, { gasLimit: fixedGasLimit }),
                'Approval successful'
            )
        }

        await handleTransaction(
            stakingContract.deposit(amountWei, { gasLimit: fixedGasLimit }),
            'Deposit successful'
        )
        setAmount('')
    }

    const handleDepositNFTs = async () => {
        if (selectedNFTs.length === 0) {
            toast.error('Please select at least one NFT to deposit')
            return
        }

        for (const nftId of selectedNFTs) {
            const approvedAddress = await nftBContract.getApproved(nftId)
            if (approvedAddress !== stakingContract.address) {
                await handleTransaction(
                    nftBContract.approve(stakingContract.address, nftId, { gasLimit: fixedGasLimit }),
                    `NFT #${nftId} approval successful`
                )
            }

            await handleTransaction(
                stakingContract.depositNFT(nftId, { gasLimit: fixedGasLimit }),
                `NFT #${nftId} deposited successfully`
            )
        }
        setSelectedNFTs([])
    }

    const handleWithdraw = () => handleTransaction(
        stakingContract.withdraw({ gasLimit: fixedGasLimit }),
        'Withdrawal successful'
    )

    const handleWithdrawNFTs = () => handleTransaction(
        stakingContract.withdrawNFTs({ gasLimit: fixedGasLimit }),
        'NFTs withdrawn successfully'
    )

    const handleClaimReward = () => handleTransaction(
        stakingContract.claimReward({ gasLimit: fixedGasLimit }),
        'Reward claimed successfully'
    )

    const handleGetTokenA = () => handleTransaction(
        tokenAContract.faucet(ethers.utils.parseEther('1000000'), { gasLimit: fixedGasLimit }),
        'Received 1,000,000 TokenA'
    )

    return (
        <div className="container mx-auto p-4">
            <Typography variant="h4" gutterBottom>User Dashboard</Typography>
            <StakingInfo />
            <div className="mt-4 space-y-4">
                <div>
                    <TextField
                        label="Amount to Deposit"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        disabled={loading}
                    />
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleDeposit}
                        disabled={loading || !amount || Number(amount) <= 0 || Number(amount) > Number(tokenABalance)}
                    >
                        Deposit
                    </Button>
                </div>
                <div>
                    <FormControl fullWidth>
                        <InputLabel>Select NFTs to Deposit</InputLabel>
                        <Select
                            multiple
                            value={selectedNFTs}
                            onChange={(e) => setSelectedNFTs(e.target.value)}
                            renderValue={(selected) => selected.join(', ')}
                            disabled={loading || ownedNFTs.length === 0}
                        >
                            {ownedNFTs.map((nftId) => (
                                <MenuItem key={nftId} value={nftId}>
                                    <Checkbox checked={selectedNFTs.indexOf(nftId) > -1} />
                                    <ListItemText primary={`NFT #${nftId}`} />
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={handleDepositNFTs}
                        disabled={loading || selectedNFTs.length === 0}
                    >
                        Deposit Selected NFTs
                    </Button>
                </div>
                <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleWithdraw}
                    disabled={loading || Number(stakedAmount) <= 0}
                >
                    Withdraw Tokens
                </Button>
                <Button
                    variant="contained"
                    color="success"
                    onClick={handleClaimReward}
                    disabled={loading || Number(reward) <= 0}
                >
                    Claim Reward
                </Button>
                <Button variant="contained" color="info" onClick={handleGetTokenA} disabled={loading}>
                    Faucet 1M TokenA
                </Button>
                <div>
                    <Typography variant="h6" gutterBottom>Staked NFTs</Typography>
                    {stakedNFTs.length > 0 ? (
                        <>
                            <ul>
                                {stakedNFTs.map((nftId) => (
                                    <li key={nftId}>NFT #{nftId}</li>
                                ))}
                            </ul>
                            <Button
                                variant="contained"
                                color="warning"
                                onClick={handleWithdrawNFTs}
                                disabled={loading || stakedNFTs.length === 0}
                            >
                                Withdraw All NFTs
                            </Button>
                        </>
                    ) : (
                        <Typography>No staked NFTs</Typography>
                    )}
                </div>
            </div>
            {loading && <CircularProgress className="mt-4" />}
        </div>
    )
}

export default UserDashboard