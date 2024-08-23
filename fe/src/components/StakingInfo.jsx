import React, { useState, useEffect } from "react";
import { useWeb3 } from "../contexts/Web3Context";
import { ethers } from "ethers";
import { Card, CardContent, Typography, CircularProgress } from "@mui/material";

const StakingInfo = () => {
    const { address, stakingContract } = useWeb3();
    const [stakingInfo, setStakingInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [remainingLockTime, setRemainingLockTime] = useState(0);

    useEffect(() => {
        let intervalId;

        const fetchStakingInfo = async () => {
            if (stakingContract && address) {
                try {
                    const stake = await stakingContract.stakes(address);
                    const APR = await stakingContract.getCurrentAPR(address);
                    const currentAPR = APR.toNumber() / 100;
                    const reward = await stakingContract.calculateReward(
                        address
                    );
                    const lockTime = await stakingContract.getRemainingLockTime(
                        address
                    );

                    setStakingInfo({
                        stakedAmount: ethers.utils.formatEther(stake.amount),
                        nftCount: stake.nftCount.toString(),
                        currentAPR: currentAPR.toString(),
                        reward: ethers.utils.formatEther(reward),
                    });
                    setRemainingLockTime(lockTime.toNumber());

                    // Start the countdown timer
                    clearInterval(intervalId);
                    intervalId = setInterval(() => {
                        setRemainingLockTime((prevTime) => {
                            if (prevTime <= 0) {
                                clearInterval(intervalId);
                                return 0;
                            }
                            return prevTime - 1;
                        });
                    }, 1000);
                } catch (error) {
                    console.error("Error fetching staking info:", error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchStakingInfo();
        const fetchInterval = setInterval(fetchStakingInfo, 30000); // Refresh staking info every 30 seconds

        return () => {
            clearInterval(fetchInterval);
            clearInterval(intervalId);
        };
    }, [stakingContract, address]);

    const formatTime = (seconds) => {
        if (seconds <= 0) return "Unlocked";
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds.toString().padStart(2, "0")}s`;
    };

    if (loading) {
        return <CircularProgress />;
    }

    return (
        <Card>
            <CardContent>
                <Typography variant="h5" component="div">
                    Staking Information
                </Typography>
                <Typography>
                    Staked Amount: {stakingInfo?.stakedAmount || "0"} TokenA
                </Typography>
                <Typography>
                    NFTs Deposited: {stakingInfo?.nftCount || "0"}
                </Typography>
                <Typography>
                    Current APR: {stakingInfo?.currentAPR || "0"}%
                </Typography>
                <Typography>
                    Reward: {stakingInfo?.reward || "0"} TokenA
                </Typography>
                <Typography>
                    Lock Time: {formatTime(remainingLockTime)}
                </Typography>
            </CardContent>
        </Card>
    );
};

export default StakingInfo;
