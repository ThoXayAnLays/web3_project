const db = require('../config/database');

class User {
    static async createUser(address, isAdmin = false) {
        const query = 'INSERT INTO users (address, is_admin) VALUES ($1, $2) RETURNING *';
        const values = [address, isAdmin];
        const result = await db.query(query, values);
        return result.rows[0];
    }

    static async isAdmin(address) {
        const query = 'SELECT is_admin FROM users WHERE address = $1';
        const values = [address];
        const result = await db.query(query, values);
        return result.rows.length > 0 ? result.rows[0].is_admin : false;
    }
}

module.exports = User;