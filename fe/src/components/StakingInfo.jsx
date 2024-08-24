import React, { useState, useEffect } from 'react'
import { useWeb3 } from '../contexts/Web3Context'
import { ethers } from 'ethers'
import { Card, CardContent, Typography, CircularProgress } from '@mui/material'

const StakingInfo = () => {
    const { address, stakingContract } = useWeb3()
    const [stakingInfo, setStakingInfo] = useState(null)
    const [loading, setLoading] = useState(true)
    const [remainingLockTime, setRemainingLockTime] = useState(0)
    const [contractBalance, setContractBalance] = useState('0')

    useEffect(() => {
        let intervalId;

        const fetchStakingInfo = async () => {
            if (stakingContract && address) {
                try {
                    const [stakedAmount, pendingReward, calculatedReward, lockEndTime] = await stakingContract.getStakeDetails(address)
                    const APR = await stakingContract.getCurrentAPR(address)
                    const currentAPR = (APR.toNumber() / 100)
                    const balance = await stakingContract.getContractBalance()

                    setStakingInfo({
                        stakedAmount: ethers.utils.formatEther(stakedAmount),
                        pendingReward: ethers.utils.formatEther(pendingReward),
                        calculatedReward: ethers.utils.formatEther(calculatedReward),
                        currentAPR: currentAPR.toString(),
                    })
                    setContractBalance(ethers.utils.formatEther(balance))
                    
                    const currentTime = Math.floor(Date.now() / 1000)
                    const remainingTime = Math.max(0, lockEndTime.toNumber() - currentTime)
                    setRemainingLockTime(remainingTime)

                    // Start the countdown timer
                    clearInterval(intervalId);
                    intervalId = setInterval(() => {
                        setRemainingLockTime(prevTime => {
                            if (prevTime <= 0) {
                                clearInterval(intervalId);
                                return 0;
                            }
                            return prevTime - 1;
                        });
                    }, 1000);

                } catch (error) {
                    console.error('Error fetching staking info:', error)
                } finally {
                    setLoading(false)
                }
            }
        }

        fetchStakingInfo()
        const fetchInterval = setInterval(fetchStakingInfo, 30000) // Refresh staking info every 30 seconds

        return () => {
            clearInterval(fetchInterval)
            clearInterval(intervalId)
        }
    }, [stakingContract, address])

    const formatTime = (seconds) => {
        if (seconds <= 0) return 'Unlocked'
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        return `${minutes}m ${remainingSeconds.toString().padStart(2, '0')}s`
    }

    if (loading) {
        return <CircularProgress />
    }

    return (
        <Card>
            <CardContent>
                <Typography variant="h5" component="div">Staking Information</Typography>
                <Typography>Staked Amount: {stakingInfo?.stakedAmount || '0'} TokenA</Typography>
                <Typography>Pending Reward: {stakingInfo?.pendingReward || '0'} TokenA</Typography>
                <Typography>Calculated Reward: {stakingInfo?.calculatedReward || '0'} TokenA</Typography>
                <Typography>Current APR: {stakingInfo?.currentAPR || '0'}%</Typography>
                <Typography>Lock Time: {formatTime(remainingLockTime)}</Typography>
                <Typography>Contract Balance: {contractBalance} TokenA</Typography>
            </CardContent>
        </Card>
    )
}

export default StakingInfo