import React, { useState, useEffect, useCallback } from "react";
import { useWeb3 } from "../contexts/Web3Context";
import StakingInfo from "../components/StakingInfo";
import {
    Button,
    TextField,
    CircularProgress,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Typography,
    Checkbox,
    FormControlLabel,
    Grid,
    Paper,
    Box,
    Divider,
} from "@mui/material";
import { ethers } from "ethers";
import { toast } from "react-toastify";

const UserDashboard = () => {
    const {
        address,
        tokenAContract,
        nftBContract,
        stakingContract,
        updateBalances,
        isConnected,
        provider,
    } = useWeb3();
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [ownedNFTs, setOwnedNFTs] = useState([]);
    const [stakedNFTs, setStakedNFTs] = useState([]);
    const [tokenABalance, setTokenABalance] = useState("0");
    const [stakedAmount, setStakedAmount] = useState("0");
    const [reward, setReward] = useState("0");
    const [remainingLockTime, setRemainingLockTime] = useState(0);
    const [pendingReward, setPendingReward] = useState("0");
    const [selectedNFTsForDeposit, setSelectedNFTsForDeposit] = useState([]);
    const [selectedNFTsForWithdrawal, setSelectedNFTsForWithdrawal] = useState(
        []
    );
    const [totalReward, setTotalReward] = useState("0");
    const [updateTrigger, setUpdateTrigger] = useState(0);
    const [tokenARemaining, setTokenARemaining] = useState("0");

    const fixedGasLimit = 900000;

    const fetchRemainingLockTime = useCallback(async () => {
        if (address && stakingContract) {
            try {
                const lockTime = await stakingContract.getRemainingLockTime(address);
                setRemainingLockTime(lockTime.toNumber());
            } catch (error) {
                console.error("Error fetching remaining lock time:", error);
            }
        }
    }, [address, stakingContract]);

    const fetchTotalReward = useCallback(async () => {
        if (stakingContract && address) {
            try {
                const calculatedReward = await stakingContract.calculateReward(address);
                const stake = await stakingContract.stakes(address);
                const pendingReward = stake.pendingReward;
                const total = calculatedReward.add(pendingReward);
                setTotalReward(ethers.utils.formatEther(total));
            } catch (error) {
                console.error("Error fetching total reward:", error);
            }
        }
    }, [stakingContract, address]);

    useEffect(() => {
        if (address && stakingContract) {
            fetchRemainingLockTime();
            fetchTotalReward();
            const interval = setInterval(() => {
                fetchRemainingLockTime();
                fetchTotalReward();
            }, 30000);
            return () => clearInterval(interval);
        }
    }, [address, stakingContract, fetchRemainingLockTime, fetchTotalReward]);

    const formatTime = (seconds) => {
        const days = Math.floor(seconds / (3600 * 24));
        const hours = Math.floor((seconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${days}d ${hours}h ${minutes}m`;
    };

    const fetchTokenARemaining = useCallback(async () => {
        if (tokenAContract) {
            try {
                const contractBalance = await tokenAContract.balanceOf(tokenAContract.address);
                setTokenARemaining(ethers.utils.formatEther(contractBalance));
            } catch (error) {
                console.error("Error fetching Token A remaining balance:", error);
            }
        }
    }, [tokenAContract]);

    useEffect(() => {
        if (address && tokenAContract && nftBContract && stakingContract) {
            fetchOwnedNFTs();
            fetchStakedNFTs();
            fetchTokenABalance();
            fetchStakedAmount();
            fetchReward();
            fetchTokenARemaining();
        }
    }, [address, tokenAContract, nftBContract, stakingContract, fetchTokenARemaining]);

    const fetchOwnedNFTs = async () => {
        try {
            const ownedNFTs = await stakingContract.getOwnedNFTs(address);
            setOwnedNFTs(ownedNFTs.map((nft) => nft.toString()));
        } catch (error) {
            console.error("Error fetching owned NFTs:", error);
            toast.error("Failed to fetch owned NFTs");
        }
    };

    const fetchStakedNFTs = async () => {
        try {
            const stake = await stakingContract.stakes(address);
            const nftCount = stake.nftCount.toNumber();
            const nfts = [];
            for (let i = 0; i < nftCount; i++) {
                const tokenId = await stakingContract.stakedNFTs(address, i);
                console.log("Staked NFT:", tokenId.toString());
                nfts.push(tokenId.toString());
            }
            setStakedNFTs(nfts);
        } catch (error) {
            console.error("Error fetching staked NFTs:", error);
            toast.error("Failed to fetch staked NFTs");
        }
    };

    const fetchTokenABalance = async () => {
        try {
            const balance = await tokenAContract.balanceOf(address);
            setTokenABalance(ethers.utils.formatEther(balance));
        } catch (error) {
            console.error("Error fetching Token A balance:", error);
        }
    };

    const fetchStakedAmount = async () => {
        try {
            const stake = await stakingContract.stakes(address);
            setStakedAmount(ethers.utils.formatEther(stake.amount));
        } catch (error) {
            console.error("Error fetching staked amount:", error);
        }
    };

    const fetchReward = async () => {
        try {
            const rewardAmount = await stakingContract.calculateReward(address);
            setReward(ethers.utils.formatEther(rewardAmount));
            const stake = await stakingContract.stakes(address);
            setPendingReward(ethers.utils.formatEther(stake.pendingReward));
        } catch (error) {
            console.error("Error fetching reward:", error);
        }
    };

    const handleTransaction = async (transactionPromise, successMessage) => {
        setLoading(true);
        try {
            const tx = await transactionPromise;
            const receipt = await tx.wait();

            if (receipt.status === 1) {
                toast.success(successMessage);
                updateBalances(address, tokenAContract, nftBContract);
                fetchTokenABalance();
                fetchStakedAmount();
                fetchReward();
                fetchOwnedNFTs();
                fetchStakedNFTs();
                fetchRemainingLockTime();
                fetchTokenARemaining();
                setUpdateTrigger((prev) => prev + 1);
            } else {
                toast.error("Transaction failed. Please try again.");
            }
        } catch (error) {
            console.error("Transaction error:", error);
            if (error.code === "ACTION_REJECTED") {
                toast.error("Transaction was rejected by user");
            } else if (error.code === "REPLACEMENT_UNDERPRICED") {
                toast.error("Transaction was replaced by a new one");
            } else if (error.code === "TRANSACTION_REPLACED") {
                if (error.replacement && error.replacement.hash) {
                    const replacementReceipt =
                        await provider.getTransactionReceipt(
                            error.replacement.hash
                        );
                    if (replacementReceipt.status === 1) {
                        toast.success(successMessage);
                    } else {
                        toast.error("Replacement transaction failed");
                    }
                } else {
                    toast.error(
                        "Transaction was replaced, but unable to determine outcome"
                    );
                }
            } else {
                toast.error("Transaction failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const approveAllNFTs = async () => {
        try {
            const isApprovedForAll = await nftBContract.isApprovedForAll(
                address,
                stakingContract.address
            );
            if (!isApprovedForAll) {
                await handleTransaction(
                    nftBContract.setApprovalForAll(
                        stakingContract.address,
                        true
                    ),
                    "Approved all NFTs for staking"
                );
            }
        } catch (error) {
            console.error("Error approving all NFTs:", error);
            toast.error("Failed to approve all NFTs");
        }
    };

    const handleDeposit = async () => {
        if (
            !amount ||
            isNaN(amount) ||
            Number(amount) <= 0 ||
            Number(amount) > Number(tokenABalance)
        ) {
            toast.error("Please enter a valid amount");
            return;
        }

        const amountWei = ethers.utils.parseEther(amount);
        const allowance = await tokenAContract.allowance(
            address,
            stakingContract.address
        );

        if (allowance.lt(amountWei)) {
            await handleTransaction(
                tokenAContract.approve(stakingContract.address, amountWei, {
                    gasLimit: fixedGasLimit,
                }),
                "Approval successful"
            );
        }

        await handleTransaction(
            stakingContract.deposit(amountWei, { gasLimit: fixedGasLimit }),
            "Deposit successful"
        );
        setAmount("");
    };

    const handleNFTSelectionForDeposit = (tokenId) => {
        setSelectedNFTsForDeposit((prev) =>
            prev.includes(tokenId)
                ? prev.filter((id) => id !== tokenId)
                : [...prev, tokenId]
        );
    };

    const handleNFTSelectionForWithdrawal = (tokenId) => {
        setSelectedNFTsForWithdrawal((prev) =>
            prev.includes(tokenId)
                ? prev.filter((id) => id !== tokenId)
                : [...prev, tokenId]
        );
    };

    const handleDepositNFTs = async () => {
        if (selectedNFTsForDeposit.length === 0) {
            toast.error("Please select at least one NFT to deposit");
            return;
        }

        if (Number(stakedAmount) <= 0) {
            toast.error("You need to deposit Token A before depositing NFTs");
            return;
        }

        try {
            await approveAllNFTs();

            for (const nftId of selectedNFTsForDeposit) {
                await handleTransaction(
                    stakingContract.depositNFT(nftId, {
                        gasLimit: fixedGasLimit,
                    }),
                    `NFT #${nftId} deposited successfully`
                );
            }
            setSelectedNFTsForDeposit([]);
            fetchOwnedNFTs();
            fetchStakedNFTs();
        } catch (error) {
            console.error("Error depositing NFTs:", error);
            toast.error("Failed to deposit NFTs");
        }
    };

    const handleWithdrawNFTs = async () => {
        if (selectedNFTsForWithdrawal.length === 0) {
            toast.error("Please select NFTs to withdraw");
            return;
        }

        await handleTransaction(
            stakingContract.withdrawNFTs(selectedNFTsForWithdrawal, {
                gasLimit: fixedGasLimit,
            }),
            "NFTs withdrawn successfully"
        );
        setSelectedNFTsForWithdrawal([]);
        fetchOwnedNFTs();
        fetchStakedNFTs();
    };

    const handleWithdraw = async () => {
        if (remainingLockTime > 0) {
            toast.error(
                `Tokens are still locked for ${formatTime(remainingLockTime)}`
            );
            return;
        }

        await handleTransaction(
            stakingContract.withdraw({ gasLimit: fixedGasLimit }),
            "Withdrawal successful"
        );
    };

    const handleClaimReward = () =>
        handleTransaction(
            stakingContract.claimReward({ gasLimit: fixedGasLimit }),
            "Reward claimed successfully"
        );

    const handleGetTokenA = () =>
        handleTransaction(
            tokenAContract.faucet(ethers.utils.parseEther("2000000"), {
                gasLimit: fixedGasLimit,
            }),
            "Received 2,000,000 TokenA"
        );

    return (
        <Box sx={{ flexGrow: 1, p: 3 }}>
            <Typography variant="h4" gutterBottom>
                User Dashboard
            </Typography>
            <Typography variant="body1" gutterBottom sx={{ mt: 2 }}>
                Token A Remaining in Contract:{" "}
                {parseFloat(tokenARemaining).toLocaleString()} TokenA
            </Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} md={5}>
                    <Paper elevation={3} sx={{ p: 2, height: "100%" }}>
                        <StakingInfo
                            updateTrigger={updateTrigger}
                            isConnected={isConnected}
                        />
                        <Divider sx={{ my: 2 }} />
                        <Grid item xs={12}>
                            <Button
                                fullWidth
                                variant="contained"
                                color="secondary"
                                onClick={handleWithdraw}
                                disabled={
                                    loading ||
                                    !isConnected ||
                                    Number(stakedAmount) <= 0 ||
                                    remainingLockTime > 0
                                }
                            >
                                Withdraw Tokens
                            </Button>
                        </Grid>
                        <Grid item xs={12} sx={{ mt: 2 }}>
                            <Button
                                fullWidth
                                variant="contained"
                                color="success"
                                onClick={handleClaimReward}
                                disabled={
                                    loading || 
                                    !isConnected ||
                                    parseFloat(totalReward) <= 0
                                }
                            >
                                Claim Reward
                            </Button>
                        </Grid>
                        <Typography variant="h6" gutterBottom>
                            Staked NFTs
                        </Typography>
                        {stakedNFTs.length > 0 ? (
                            <Grid container spacing={1}>
                                {stakedNFTs.map((nftId) => (
                                    <Grid item xs={6} sm={4} key={nftId}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={selectedNFTsForWithdrawal.includes(
                                                        nftId
                                                    )}
                                                    onChange={() =>
                                                        handleNFTSelectionForWithdrawal(
                                                            nftId
                                                        )
                                                    }
                                                    size="small"
                                                />
                                            }
                                            label={`NFT #${nftId}`}
                                        />
                                    </Grid>
                                ))}
                            </Grid>
                        ) : (
                            <Typography>No staked NFTs</Typography>
                        )}
                        {stakedNFTs.length > 0 && (
                            <Grid item xs={12}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    color="warning"
                                    onClick={handleWithdrawNFTs}
                                    disabled={
                                        loading ||
                                        !isConnected ||
                                        selectedNFTsForWithdrawal.length === 0
                                    }
                                >
                                    Withdraw Selected NFTs
                                </Button>
                            </Grid>
                        )}
                    </Paper>
                </Grid>

                <Grid item xs={12} md={7}>
                    <Paper elevation={3} sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Staking Actions
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Amount to Deposit"
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    disabled={loading}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    color="primary"
                                    onClick={handleDeposit}
                                    disabled={
                                        loading ||
                                        !amount ||
                                        !isConnected ||
                                        Number(amount) <= 0 ||
                                        Number(amount) > Number(tokenABalance)
                                    }
                                >
                                    Deposit
                                </Button>
                            </Grid>
                            <Grid item xs={12}>
                                <FormControl fullWidth>
                                    <InputLabel>
                                        Select NFTs to Deposit
                                    </InputLabel>
                                    <Select
                                        multiple
                                        value={selectedNFTsForDeposit}
                                        onChange={(e) =>
                                            setSelectedNFTsForDeposit(
                                                e.target.value
                                            )
                                        }
                                        renderValue={(selected) =>
                                            selected.join(", ")
                                        }
                                        disabled={
                                            loading ||
                                            !isConnected ||
                                            ownedNFTs.length === 0 ||
                                            Number(stakedAmount) <= 0
                                        }
                                    >
                                        {ownedNFTs
                                            .filter(
                                                (nftId) =>
                                                    !stakedNFTs.includes(nftId)
                                            )
                                            .map((nftId) => (
                                                <MenuItem
                                                    key={nftId}
                                                    value={nftId}
                                                >
                                                    <Checkbox
                                                        checked={
                                                            selectedNFTsForDeposit.indexOf(
                                                                nftId
                                                            ) > -1
                                                        }
                                                    />
                                                    <Typography>
                                                        NFT #{nftId}
                                                    </Typography>
                                                </MenuItem>
                                            ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    color="secondary"
                                    onClick={handleDepositNFTs}
                                    disabled={
                                        loading ||
                                        !isConnected ||
                                        selectedNFTsForDeposit.length === 0 ||
                                        Number(stakedAmount) <= 0
                                    }
                                >
                                    Deposit Selected NFTs
                                </Button>
                            </Grid>
                            <Grid item xs={12}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    color="info"
                                    onClick={handleGetTokenA}
                                    disabled={
                                        !isConnected ||
                                        loading
                                    }
                                >
                                    Faucet 2M TokenA
                                </Button>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>
            {loading && (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                    <CircularProgress />
                </Box>
            )}
        </Box>
    );
};

export default UserDashboard;
