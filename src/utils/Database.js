/**
 * Database utility for MongoDB operations using Mongoose
 * Provides a simple interface for database operations
 */

const mongoose = require('mongoose');
const Logger = require('./Logger');

class Database {
    constructor() {
        this.connection = null;
        this.isConnected = false;
    }

    /**
     * Initialize database connection
     * @param {string} uri - MongoDB connection URI
     * @returns {Promise} - Connection promise
     */
    async init(uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/discord-bot-upwork') {
        try {
            // Set mongoose options
            mongoose.set('strictQuery', false);
            
            // Connect to MongoDB
            this.connection = await mongoose.connect(uri, {
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            });

            this.isConnected = true;
            Logger.info('MongoDB connection established');
            
            // Handle connection events
            mongoose.connection.on('error', (err) => {
                Logger.error('MongoDB connection error:', err);
                this.isConnected = false;
            });

            mongoose.connection.on('disconnected', () => {
                Logger.warn('MongoDB connection disconnected');
                this.isConnected = false;
            });

            mongoose.connection.on('reconnected', () => {
                Logger.info('MongoDB connection reconnected');
                this.isConnected = true;
            });

            return this.connection;
        } catch (error) {
            Logger.error('Error connecting to MongoDB:', error);
            this.isConnected = false;
            throw error;
        }
    }

    /**
     * Get database connection
     * @returns {Object} - Mongoose connection
     */
    getConnection() {
        return this.connection;
    }

    /**
     * Get mongoose instance
     * @returns {Object} - Mongoose instance
     */
    getMongoose() {
        return mongoose;
    }

    /**
     * Check if database is connected
     * @returns {boolean} - Connection status
     */
    isConnected() {
        return this.isConnected && mongoose.connection.readyState === 1;
    }

    /**
     * Get database statistics
     * @returns {Promise<Object>} - Database statistics
     */
    async getStats() {
        try {
            const stats = {};
            
            // Get collection names
            const collections = await mongoose.connection.db.listCollections().toArray();
            stats.collections = collections.length;
            
            // Get document counts for each collection
            for (const collection of collections) {
                const count = await mongoose.connection.db.collection(collection.name).countDocuments();
                stats[collection.name] = count;
            }
            
            // Get database info
            const dbStats = await mongoose.connection.db.stats();
            stats.size = `${Math.round(dbStats.dataSize / 1024)}KB`;
            stats.storageSize = `${Math.round(dbStats.storageSize / 1024)}KB`;
            
            return stats;
        } catch (error) {
            Logger.error('Error getting database stats:', error);
            throw error;
        }
    }

    /**
     * Create indexes for collections
     * @param {Array} indexDefinitions - Array of index definitions
     * @returns {Promise} - Index creation promise
     */
    async createIndexes(indexDefinitions) {
        try {
            for (const indexDef of indexDefinitions) {
                const { collection, indexes } = indexDef;
                const collectionRef = mongoose.connection.db.collection(collection);
                
                for (const index of indexes) {
                    await collectionRef.createIndex(index.fields, index.options);
                    Logger.debug(`Created index on ${collection}: ${JSON.stringify(index.fields)}`);
                }
            }
            
            Logger.info('Database indexes created successfully');
        } catch (error) {
            Logger.error('Error creating database indexes:', error);
            throw error;
        }
    }

    /**
     * Backup database
     * @param {string} backupPath - Backup directory path
     * @returns {Promise} - Backup promise
     */
    async backup(backupPath) {
        try {
            // This would require mongodump to be installed
            // For now, we'll just log the backup request
            Logger.info(`Database backup requested to: ${backupPath}`);
            Logger.warn('Manual backup required - use mongodump command');
            return true;
        } catch (error) {
            Logger.error('Error backing up database:', error);
            throw error;
        }
    }

    /**
     * Optimize database
     * @returns {Promise} - Optimization promise
     */
    async optimize() {
        try {
            // MongoDB handles optimization automatically
            // We can run some maintenance operations here
            const collections = await mongoose.connection.db.listCollections().toArray();
            
            for (const collection of collections) {
                await mongoose.connection.db.command({
                    compact: collection.name,
                    force: true
                });
            }
            
            Logger.info('Database optimization completed');
        } catch (error) {
            Logger.error('Error optimizing database:', error);
            throw error;
        }
    }

    /**
     * Close database connection
     * @returns {Promise} - Close promise
     */
    async close() {
        try {
            if (this.connection) {
                await mongoose.connection.close();
                this.isConnected = false;
                Logger.info('MongoDB connection closed');
            }
        } catch (error) {
            Logger.error('Error closing database connection:', error);
            throw error;
        }
    }

    /**
     * Drop database (use with caution)
     * @returns {Promise} - Drop promise
     */
    async dropDatabase() {
        try {
            await mongoose.connection.db.dropDatabase();
            Logger.warn('Database dropped');
        } catch (error) {
            Logger.error('Error dropping database:', error);
            throw error;
        }
    }

    /**
     * Get database name
     * @returns {string} - Database name
     */
    getDatabaseName() {
        return mongoose.connection.db.databaseName;
    }

    /**
     * Health check
     * @returns {Promise<Object>} - Health status
     */
    async healthCheck() {
        try {
            const status = {
                connected: this.isConnected(),
                readyState: mongoose.connection.readyState,
                database: this.getDatabaseName(),
                collections: []
            };

            if (this.isConnected()) {
                const collections = await mongoose.connection.db.listCollections().toArray();
                status.collections = collections.map(col => col.name);
            }

            return status;
        } catch (error) {
            Logger.error('Error performing health check:', error);
            return {
                connected: false,
                error: error.message
            };
        }
    }
}

module.exports = Database; 