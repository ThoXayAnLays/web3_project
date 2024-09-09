import React, { useState, useEffect, useCallback } from "react";
import { useWeb3 } from "../contexts/Web3Context";
import { ethers } from "ethers";
import { Card, CardContent, Typography } from "@mui/material";

const StakingInfo = ({ updateTrigger }) => {
    const { address, stakingContract } = useWeb3();
    const [stakingInfo, setStakingInfo] = useState(null);
    const [error, setError] = useState(null);
    const [remainingLockTime, setRemainingLockTime] = useState(0);

    const formatTokenAmount = (amount) => {
        return parseFloat(parseFloat(amount).toFixed(2)).toString();
    };

    const fetchStakingInfo = useCallback(async () => {
        if (stakingContract && address) {
            try {
                setError(null);

                const stake = await stakingContract.stakes(address);
                const baseAPR = await stakingContract.baseAPR();
                const nftBonusAPR = await stakingContract.nftBonusAPR();
                const calculatedReward = await stakingContract.calculateReward(address);
                const effectiveAPR = baseAPR.add(nftBonusAPR.mul(stake.nftCount));
                const lockTime = await stakingContract.getRemainingLockTime(address);

                const pendingReward = stake.pendingReward;
                const totalReward = calculatedReward.add(pendingReward);

                setStakingInfo({
                    stakedAmount: formatTokenAmount(ethers.utils.formatEther(stake.amount)),
                    nftCount: stake.nftCount.toString(),
                    effectiveAPR: effectiveAPR.toNumber() / 100,
                    totalReward: formatTokenAmount(ethers.utils.formatEther(totalReward)),
                });
                setRemainingLockTime(lockTime.toNumber());
            } catch (error) {
                console.error("Error fetching staking info:", error);
                setError("Failed to fetch staking information. Please try again later.");
            }
        }
    }, [stakingContract, address]);

    useEffect(() => {
        fetchStakingInfo();
        const fetchInterval = setInterval(fetchStakingInfo, 1000); 

        return () => clearInterval(fetchInterval);
    }, [fetchStakingInfo, updateTrigger]);

    useEffect(() => {
        let intervalId;
        if (remainingLockTime > 0) {
            intervalId = setInterval(() => {
                setRemainingLockTime((prevTime) => Math.max(0, prevTime - 1));
            }, 1000);
        }
        return () => clearInterval(intervalId);
    }, [remainingLockTime]);

    const formatTime = (seconds) => {
        if (seconds <= 0) return "Unlocked";
        const days = Math.floor(seconds / (3600 * 24));
        const hours = Math.floor((seconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
        return `${days}d ${hours}h ${minutes}m ${remainingSeconds}s`;
    };

    if (error) {
        return (
            <Card>
                <CardContent>
                    <Typography color="error">{error}</Typography>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent>
                <Typography variant="h5" component="div" gutterBottom>
                    Staking Information
                </Typography>
                <Typography>
                    Staked Amount: {stakingInfo?.stakedAmount || "0.00"} TokenA
                </Typography>
                <Typography>
                    Staked NFTs: {stakingInfo?.nftCount || "0"}
                </Typography>
                <Typography>
                    Effective APR: {stakingInfo?.effectiveAPR || "0"}%
                </Typography>
                <Typography>
                    Total Reward: {stakingInfo?.totalReward || "0.00"} TokenA
                </Typography>
                <Typography>
                    Lock Time: {formatTime(remainingLockTime)}
                </Typography>
            </CardContent>
        </Card>
    );
};

export default StakingInfo;