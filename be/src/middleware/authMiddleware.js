const ethUtil = require("ethereumjs-util");
const ethSigUtil = require("eth-sig-util");

exports.isAdmin = (req, res, next) => {
    const adminAddress = process.env.ADMIN_ADDRESS.toLowerCase();
    const userAddress = req.header("X-User-Address");
    const signature = req.header("X-Auth-Signature");
    const nonce = req.header("X-Auth-Nonce");

    if (!userAddress || !signature || !nonce) {
        return res
            .status(401)
            .json({ message: "Missing authentication headers" });
    }

    // Verify that the user address matches the admin address
    if (userAddress.toLowerCase() !== adminAddress) {
        return res.status(403).json({ message: "Not authorized" });
    }

    // Verify the signature
    try {
        const msgParams = [
            {
                type: "string",
                name: "Message",
                value: `Authenticate for API access with nonce: ${nonce}`,
            },
        ];

        const recoveredAddress = ethSigUtil.recoverTypedSignature({
            data: msgParams,
            sig: signature,
        });

        if (recoveredAddress.toLowerCase() !== adminAddress) {
            return res.status(401).json({ message: "Invalid signature" });
        }

        // If everything is valid, call next() to proceed to the route handler
        next();
    } catch (error) {
        console.error("Error verifying signature:", error);
        return res.status(401).json({ message: "Invalid signature" });
    }
};
