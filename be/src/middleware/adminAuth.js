const User = require('../models/user');

async function adminAuth(req, res, next) {
    const address = req.headers['x-user-address'];
    if (!address) {
        return res.status(401).json({ error: 'No address provided' });
    }

    try {
        const isAdmin = await User.isAdmin(address);
        if (isAdmin) {
            next();
        } else {
            res.status(403).json({ error: 'Not authorized' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = adminAuth;