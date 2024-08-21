import React, { useState, useContext, useEffect } from 'react';
import { Web3Context } from '../context/Web3Context';
import { toast } from 'react-toastify';

const LOCK_PERIOD = 5 * 60 * 1000; // 5 minutes in milliseconds

const StakingForm = () => {
    const { web3, account, tokenAContract, stakingContract } = useContext(Web3Context);
    const [amount, setAmount] = useState('');
    const [stakingInfo, setStakingInfo] = useState(null);
    const [isLocked, setIsLocked] = useState(false);

    useEffect(() => {
        const fetchStakingInfo = async () => {
            if (account && stakingContract) {
                try {
                    const info = await stakingContract.methods.deposits(account).call();
                    setStakingInfo(info);

                    // Check if tokens are locked
                    const now = Date.now();
                    const depositTime = parseInt(info.depositTime) * 1000; // Convert to milliseconds
                    setIsLocked(now - depositTime < LOCK_PERIOD);
                } catch (error) {
                    console.error('Error fetching staking info:', error);
                }
            }
        };

        fetchStakingInfo();
        const interval = setInterval(fetchStakingInfo, 10000); // Refresh every 10 seconds
        return () => clearInterval(interval);
    }, [account, stakingContract]);

    const handleStake = async (e) => {
        e.preventDefault();
        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        try {
            const weiAmount = web3.utils.toWei(amount, 'ether');
            await tokenAContract.methods.approve(stakingContract._address, weiAmount).send({ from: account });
            await stakingContract.methods.depositTokenA(weiAmount).send({ from: account });
            toast.success('Tokens staked successfully');
            setAmount('');
        } catch (error) {
            toast.error('Error staking tokens');
            console.error(error);
        }
    };

    const handleWithdraw = async (claimOnly) => {
        if (isLocked) {
            toast.error('Tokens are still locked. Please wait for the lock period to end.');
            return;
        }

        try {
            await stakingContract.methods.withdraw(claimOnly).send({ from: account });
            toast.success(claimOnly ? 'Rewards claimed successfully' : 'Tokens withdrawn successfully');
        } catch (error) {
            toast.error('Error withdrawing tokens');
            console.error(error);
        }
    };

    const renderLockStatus = () => {
        if (isLocked) {
            const now = Date.now();
            const depositTime = Number(stakingInfo.depositTime) * 1000;
            const remainingTime = Math.max(0, LOCK_PERIOD - (now - depositTime));
            const minutes = Math.floor(remainingTime / 60000);
            const seconds = Math.floor((remainingTime % 60000) / 1000);
            return <p className="text-red-500">Locked for {minutes}m {seconds}s</p>;
        }
        return <p className="text-green-500">Unlocked</p>;
    };

    return (
        <div className="max-w-md mx-auto mt-8">
            <form onSubmit={handleStake} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="amount">
                        Stake Amount
                    </label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="amount"
                        type="text"
                        placeholder="Enter amount to stake"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                </div>
                <div className="flex items-center justify-between">
                    <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        type="submit"
                    >
                        Stake
                    </button>
                </div>
            </form>
            {stakingInfo && (
                <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                    <h2 className="text-xl font-bold mb-4 text-gray-800">Your Staking Info</h2>
                    <p className="text-gray-700">Amount Staked: {web3.utils.fromWei(stakingInfo.amount, 'ether')} TKA</p>
                    <p className="text-gray-700">Deposit Time: {new Date(Number(stakingInfo.depositTime) * 1000).toLocaleString()}</p>
                    <p className="text-gray-700">Has NFT: {stakingInfo.hasNFT ? 'Yes' : 'No'}</p>
                    {renderLockStatus()}
                    <div className="mt-4">
                        <button
                            onClick={() => handleWithdraw(false)}
                            className={`bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mr-2 ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={isLocked}
                        >
                            Withdraw All
                        </button>
                        <button
                            onClick={() => handleWithdraw(true)}
                            className={`bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={isLocked}
                        >
                            Claim Rewards
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StakingForm;