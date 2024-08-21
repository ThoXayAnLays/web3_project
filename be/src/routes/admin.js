const express = require("express");
const router = express.Router();
const { stakingContract, web3 } = require("../services/web3Service");
const dotenv = require("dotenv");
dotenv.config();

const checkAdmin = (req, res, next) => {
    const { address } = req.body;
    if (address.toLowerCase() !== process.env.ADMIN_ADDRESS.toLowerCase()) {
        return res.status(403).send("Not authorized");
    }
    next();
};

router.post("/update-apr", checkAdmin, async (req, res) => {
    const { newAPR } = req.body;
    try {
        const accounts = await web3.eth.getAccounts();
        await stakingContract.methods
            .updateAPR(newAPR)
            .send({ from: accounts[0] });
        res.send("APR updated");
    } catch (error) {
        res.status(400).send(error.message);
    }
});

module.exports = router;
