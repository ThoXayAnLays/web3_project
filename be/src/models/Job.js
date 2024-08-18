const db = require('../config/database');

class Job {
    static async create(data) {
        const { jobId, status, type, data: jobData } = data;
        const query = 'INSERT INTO jobs (job_id, status, type, data) VALUES ($1, $2, $3, $4) RETURNING *';
        const values = [jobId, status, type, JSON.stringify(jobData)];
        const result = await db.query(query, values);
        return result.rows[0];
    }

    static async update(jobId, status) {
        const query = 'UPDATE jobs SET status = $1 WHERE job_id = $2 RETURNING *';
        const values = [status, jobId];
        const result = await db.query(query, values);
        return result.rows[0];
    }

    static async getAll(page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'DESC', search = '') {
        const offset = (page - 1) * limit;
        const query = `
      SELECT * FROM jobs
      WHERE job_id::text ILIKE $1 OR type ILIKE $1
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $2 OFFSET $3
    `;
        const values = [`%${search}%`, limit, offset];
        const result = await db.query(query, values);
        return result.rows;
    }
}

module.exports = Job;