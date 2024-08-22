import React, { useState, useEffect } from 'react'
import { useWeb3 } from '../contexts/Web3Context'
import { ethers } from 'ethers'
import { Card, CardContent, Typography, CircularProgress } from '@mui/material'

const StakingInfo = () => {
    const { address, stakingContract } = useWeb3()
    const [stakingInfo, setStakingInfo] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStakingInfo = async () => {
            if (stakingContract && address) {
                try {
                    const stake = await stakingContract.stakes(address)
                    const APR = await stakingContract.getCurrentAPR(address)
                    const currentAPR = (APR.toNumber() / 100)
                    const reward = await stakingContract.calculateReward(address)

                    setStakingInfo({
                        stakedAmount: ethers.utils.formatEther(stake.amount),
                        nftCount: stake.nftCount.toString(),
                        currentAPR: currentAPR.toString(),
                        reward: ethers.utils.formatEther(reward),
                        lockTime: new Date(stake.timestamp.toNumber() * 1000 + 5 * 60 * 1000),
                    })
                } catch (error) {
                    console.error('Error fetching staking info:', error)
                } finally {
                    setLoading(false)
                }
            }
        }

        fetchStakingInfo()
        const interval = setInterval(fetchStakingInfo, 30000) // Refresh every 30 seconds

        return () => clearInterval(interval)
    }, [stakingContract, address])

    if (loading) {
        return <CircularProgress />
    }

    return (
        <Card>
            <CardContent>
                <Typography variant="h5" component="div">Staking Information</Typography>
                <Typography>Staked Amount: {stakingInfo?.stakedAmount || '0'} TokenA</Typography>
                <Typography>NFTs Deposited: {stakingInfo?.nftCount || '0'}</Typography>
                <Typography>Current APR: {stakingInfo?.currentAPR || '0'}%</Typography>
                <Typography>Reward: {stakingInfo?.reward || '0'} TokenA</Typography>
                <Typography>Lock Time: {stakingInfo?.lockTime?.toLocaleString() || 'N/A'}</Typography>
            </CardContent>
        </Card>
    )
}

export default StakingInfo