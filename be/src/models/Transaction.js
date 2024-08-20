const db = require('../config/database');

class Transaction {
    static async create(data) {
        const { user, event, amount, timestamp } = data;
        const query = 'INSERT INTO transactions (user_address, event_type, amount, timestamp) VALUES ($1, $2, $3, $4) RETURNING *';
        const values = [user, event, amount, timestamp];
        const result = await db.query(query, values);
        return result.rows[0];
    }

    static async getAll(page = 1, limit = 10, sortBy = 'timestamp', sortOrder = 'DESC', search = '') {
        const offset = (page - 1) * limit;
        const query = `
      SELECT * FROM transactions
      WHERE user_address ILIKE $1 OR event_type ILIKE $1
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $2 OFFSET $3
    `;
        const values = [`%${search}%`, limit, offset];
        const result = await db.query(query, values);
        return result.rows;
    }

    static async getByUser(userAddress, page = 1, limit = 10, sortBy = 'timestamp', sortOrder = 'DESC') {
        const offset = (page - 1) * limit;
        const query = `
      SELECT * FROM transactions
      WHERE user_address = $1
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $2 OFFSET $3
    `;
        const values = [userAddress, limit, offset];
        const result = await db.query(query, values);
        return result.rows;
    }
}

module.exports = Transaction;