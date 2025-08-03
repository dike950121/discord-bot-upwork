/**
 * Database utility for SQLite operations
 * Provides a simple interface for database operations
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const Logger = require('./Logger');

class Database {
    constructor() {
        this.dbPath = path.join(process.cwd(), 'data', 'bot.db');
        this.ensureDataDirectory();
        this.db = null;
        this.init();
    }

    /**
     * Ensure data directory exists
     */
    ensureDataDirectory() {
        const dataDir = path.dirname(this.dbPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
    }

    /**
     * Initialize database connection
     */
    init() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    Logger.error('Error opening database:', err);
                    reject(err);
                } else {
                    Logger.info('Database connection established');
                    this.enableForeignKeys();
                    resolve();
                }
            });
        });
    }

    /**
     * Enable foreign key constraints
     */
    enableForeignKeys() {
        return new Promise((resolve, reject) => {
            this.db.run('PRAGMA foreign_keys = ON', (err) => {
                if (err) {
                    Logger.error('Error enabling foreign keys:', err);
                    reject(err);
                } else {
                    Logger.debug('Foreign keys enabled');
                    resolve();
                }
            });
        });
    }

    /**
     * Run a SQL statement
     * @param {string} sql - SQL statement
     * @param {Array} params - Parameters for the statement
     * @returns {Promise<Object>} - Result object
     */
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            this.db.run(sql, params, function(err) {
                const duration = Date.now() - startTime;
                
                if (err) {
                    Logger.error('Database run error:', err);
                    Logger.databaseOperation('RUN', 'unknown', duration);
                    reject(err);
                } else {
                    Logger.databaseOperation('RUN', 'unknown', duration);
                    resolve({
                        lastID: this.lastID,
                        changes: this.changes
                    });
                }
            });
        });
    }

    /**
     * Get a single row
     * @param {string} sql - SQL statement
     * @param {Array} params - Parameters for the statement
     * @returns {Promise<Object|null>} - Row object or null
     */
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            this.db.get(sql, params, (err, row) => {
                const duration = Date.now() - startTime;
                
                if (err) {
                    Logger.error('Database get error:', err);
                    Logger.databaseOperation('GET', 'unknown', duration);
                    reject(err);
                } else {
                    Logger.databaseOperation('GET', 'unknown', duration);
                    resolve(row);
                }
            });
        });
    }

    /**
     * Get all rows
     * @param {string} sql - SQL statement
     * @param {Array} params - Parameters for the statement
     * @returns {Promise<Array>} - Array of row objects
     */
    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            this.db.all(sql, params, (err, rows) => {
                const duration = Date.now() - startTime;
                
                if (err) {
                    Logger.error('Database all error:', err);
                    Logger.databaseOperation('ALL', 'unknown', duration);
                    reject(err);
                } else {
                    Logger.databaseOperation('ALL', 'unknown', duration);
                    resolve(rows);
                }
            });
        });
    }

    /**
     * Execute multiple SQL statements
     * @param {Array} statements - Array of SQL statements
     * @returns {Promise<Array>} - Array of results
     */
    async executeMultiple(statements) {
        const results = [];
        
        for (const statement of statements) {
            try {
                const result = await this.run(statement.sql, statement.params || []);
                results.push(result);
            } catch (error) {
                Logger.error('Error executing statement:', error);
                throw error;
            }
        }
        
        return results;
    }

    /**
     * Begin a transaction
     * @returns {Promise} - Transaction promise
     */
    beginTransaction() {
        return new Promise((resolve, reject) => {
            this.db.run('BEGIN TRANSACTION', (err) => {
                if (err) {
                    Logger.error('Error beginning transaction:', err);
                    reject(err);
                } else {
                    Logger.debug('Transaction begun');
                    resolve();
                }
            });
        });
    }

    /**
     * Commit a transaction
     * @returns {Promise} - Commit promise
     */
    commitTransaction() {
        return new Promise((resolve, reject) => {
            this.db.run('COMMIT', (err) => {
                if (err) {
                    Logger.error('Error committing transaction:', err);
                    reject(err);
                } else {
                    Logger.debug('Transaction committed');
                    resolve();
                }
            });
        });
    }

    /**
     * Rollback a transaction
     * @returns {Promise} - Rollback promise
     */
    rollbackTransaction() {
        return new Promise((resolve, reject) => {
            this.db.run('ROLLBACK', (err) => {
                if (err) {
                    Logger.error('Error rolling back transaction:', err);
                    reject(err);
                } else {
                    Logger.debug('Transaction rolled back');
                    resolve();
                }
            });
        });
    }

    /**
     * Execute a transaction
     * @param {Function} callback - Transaction callback
     * @returns {Promise} - Transaction result
     */
    async transaction(callback) {
        try {
            await this.beginTransaction();
            const result = await callback(this);
            await this.commitTransaction();
            return result;
        } catch (error) {
            await this.rollbackTransaction();
            throw error;
        }
    }

    /**
     * Backup database
     * @param {string} backupPath - Backup file path
     * @returns {Promise} - Backup promise
     */
    backup(backupPath) {
        return new Promise((resolve, reject) => {
            const backupDb = new sqlite3.Database(backupPath);
            
            this.db.backup(backupDb, (err) => {
                backupDb.close();
                
                if (err) {
                    Logger.error('Error backing up database:', err);
                    reject(err);
                } else {
                    Logger.info(`Database backed up to: ${backupPath}`);
                    resolve();
                }
            });
        });
    }

    /**
     * Get database statistics
     * @returns {Promise<Object>} - Database statistics
     */
    async getStats() {
        try {
            const stats = {};
            
            // Get table information
            const tables = await this.all(`
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name NOT LIKE 'sqlite_%'
            `);
            
            stats.tables = tables.length;
            
            // Get row counts for each table
            for (const table of tables) {
                const countResult = await this.get(`SELECT COUNT(*) as count FROM ${table.name}`);
                stats[table.name] = countResult.count;
            }
            
            // Get database size
            const dbStats = fs.statSync(this.dbPath);
            stats.size = `${Math.round(dbStats.size / 1024)}KB`;
            
            return stats;
        } catch (error) {
            Logger.error('Error getting database stats:', error);
            throw error;
        }
    }

    /**
     * Optimize database
     * @returns {Promise} - Optimization promise
     */
    async optimize() {
        try {
            await this.run('VACUUM');
            await this.run('ANALYZE');
            Logger.info('Database optimized');
        } catch (error) {
            Logger.error('Error optimizing database:', error);
            throw error;
        }
    }

    /**
     * Close database connection
     * @returns {Promise} - Close promise
     */
    close() {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) {
                    Logger.error('Error closing database:', err);
                    reject(err);
                } else {
                    Logger.info('Database connection closed');
                    resolve();
                }
            });
        });
    }

    /**
     * Check if database is connected
     * @returns {boolean} - Connection status
     */
    isConnected() {
        return this.db !== null;
    }

    /**
     * Get database path
     * @returns {string} - Database file path
     */
    getPath() {
        return this.dbPath;
    }
}

module.exports = Database; 