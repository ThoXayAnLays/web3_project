const db = require('../config/database');

class Transaction {
    static async create(data) {
        const { from, to, value, hash, blockNumber, timestamp } = data;
        const query = 'INSERT INTO transactions (from_address, to_address, value, hash, block_number, timestamp) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *';
        const values = [from, to, value, hash, blockNumber, timestamp];
        const result = await db.query(query, values);
        return result.rows[0];
    }

    static async getAll(page = 1, limit = 10, sortBy = 'timestamp', sortOrder = 'DESC', search = '') {
        const offset = (page - 1) * limit;
        const query = `
      SELECT * FROM transactions
      WHERE from_address ILIKE $1 OR to_address ILIKE $1 OR hash ILIKE $1
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
      WHERE from_address = $1 OR to_address = $1
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $2 OFFSET $3
    `;
        const values = [userAddress, limit, offset];
        const result = await db.query(query, values);
        return result.rows;
    }
}

module.exports = Transaction;