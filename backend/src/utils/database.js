const { Pool } = require('pg');
const logger = require('./logger');

class Database {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
    });

    this.pool.on('connect', () => {
      logger.debug('Connected to PostgreSQL database');
    });

    this.pool.on('error', (err) => {
      logger.error('PostgreSQL pool error:', err);
    });
  }

  async query(text, params = []) {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      logger.debug('Executed query', {
        text: text.replace(/\s+/g, ' ').trim(),
        duration: `${duration}ms`,
        rows: result.rowCount
      });
      
      return result;
    } catch (error) {
      logger.error('Database query error:', {
        text: text.replace(/\s+/g, ' ').trim(),
        params,
        error: error.message,
        duration: `${Date.now() - start}ms`
      });
      throw error;
    }
  }

  async transaction(callback) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async close() {
    await this.pool.end();
    logger.info('Database connection pool closed');
  }

  // Helper methods for common operations
  async findById(table, id, columns = '*') {
    const query = `SELECT ${columns} FROM ${table} WHERE id = $1`;
    const result = await this.query(query, [id]);
    return result.rows[0] || null;
  }

  async findOne(table, conditions = {}, columns = '*') {
    const keys = Object.keys(conditions);
    if (keys.length === 0) {
      throw new Error('Conditions required for findOne query');
    }
    
    const whereClause = keys.map((key, index) => `${key} = $${index + 1}`).join(' AND ');
    const query = `SELECT ${columns} FROM ${table} WHERE ${whereClause}`;
    const values = Object.values(conditions);
    
    const result = await this.query(query, values);
    return result.rows[0] || null;
  }

  async findMany(table, conditions = {}, options = {}) {
    const { columns = '*', orderBy = 'created_at DESC', limit, offset } = options;
    const keys = Object.keys(conditions);
    
    let query = `SELECT ${columns} FROM ${table}`;
    const values = [];
    
    if (keys.length > 0) {
      const whereClause = keys.map((key, index) => `${key} = $${index + 1}`).join(' AND ');
      query += ` WHERE ${whereClause}`;
      values.push(...Object.values(conditions));
    }
    
    query += ` ORDER BY ${orderBy}`;
    
    if (limit) {
      query += ` LIMIT ${parseInt(limit)}`;
    }
    
    if (offset) {
      query += ` OFFSET ${parseInt(offset)}`;
    }
    
    const result = await this.query(query, values);
    return result.rows;
  }

  async create(table, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
    const columns = keys.join(', ');
    
    const query = `
      INSERT INTO ${table} (${columns}) 
      VALUES (${placeholders}) 
      RETURNING *
    `;
    
    const result = await this.query(query, values);
    return result.rows[0];
  }

  async update(table, id, data) {
    const keys = Object.keys(data);
    if (keys.length === 0) {
      throw new Error('No data provided for update');
    }
    
    const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
    const values = Object.values(data);
    values.push(id);
    
    const query = `
      UPDATE ${table} 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $${values.length} 
      RETURNING *
    `;
    
    const result = await this.query(query, values);
    return result.rows[0];
  }

  async delete(table, id) {
    const query = `DELETE FROM ${table} WHERE id = $1 RETURNING *`;
    const result = await this.query(query, [id]);
    return result.rows[0];
  }
}

const db = new Database();

module.exports = db;