const dotenv = require('dotenv');
dotenv.config();

const admin_address = process.env.ADMIN_ADDRESS;

const isAdmin = (req, res, next) => {
    const userAddress = req.header('X-User-Address');
    if (userAddress !== admin_address) {
        return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    next();
};

module.exports = { isAdmin };