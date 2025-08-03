/**
 * Model for managing Discord channel data
 * Handles channel CRUD operations and database interactions
 */

const Logger = require('../utils/Logger');

class ChannelModel {
    constructor(database) {
        this.database = database;
        this.tableName = 'channels';
        this.initTable();
    }

    /**
     * Initialize the channels table
     */
    async initTable() {
        try {
            const createTableSQL = `
                CREATE TABLE IF NOT EXISTS ${this.tableName} (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    discordId TEXT UNIQUE NOT NULL,
                    guildId TEXT NOT NULL,
                    name TEXT NOT NULL,
                    category TEXT NOT NULL,
                    parentCategoryId TEXT,
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `;
            
            await this.database.run(createTableSQL);
            Logger.info('Channels table initialized');
        } catch (error) {
            Logger.error('Error initializing channels table:', error);
            throw error;
        }
    }

    /**
     * Create a new channel
     * @param {Object} channelData - Channel data
     * @returns {Object} - Created channel
     */
    async create(channelData) {
        try {
            const sql = `
                INSERT INTO ${this.tableName} (
                    discordId, guildId, name, category, parentCategoryId
                ) VALUES (?, ?, ?, ?, ?)
            `;
            
            const params = [
                channelData.discordId,
                channelData.guildId,
                channelData.name,
                channelData.category,
                channelData.parentCategoryId || null
            ];
            
            const result = await this.database.run(sql, params);
            const channel = await this.findById(result.lastID);
            
            Logger.info(`Created channel: ${channel.name} (ID: ${channel.id})`);
            return channel;
        } catch (error) {
            Logger.error('Error creating channel:', error);
            throw error;
        }
    }

    /**
     * Find channel by ID
     * @param {number} id - Channel ID
     * @returns {Object|null} - Channel object or null
     */
    async findById(id) {
        try {
            const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
            const channel = await this.database.get(sql, [id]);
            
            if (channel) {
                return this.parseChannel(channel);
            }
            
            return null;
        } catch (error) {
            Logger.error(`Error finding channel by ID ${id}:`, error);
            throw error;
        }
    }

    /**
     * Find channel by Discord ID
     * @param {string} discordId - Discord channel ID
     * @returns {Object|null} - Channel object or null
     */
    async findByDiscordId(discordId) {
        try {
            const sql = `SELECT * FROM ${this.tableName} WHERE discordId = ?`;
            const channel = await this.database.get(sql, [discordId]);
            
            if (channel) {
                return this.parseChannel(channel);
            }
            
            return null;
        } catch (error) {
            Logger.error(`Error finding channel by Discord ID ${discordId}:`, error);
            throw error;
        }
    }

    /**
     * Find channel by category
     * @param {string} category - Channel category
     * @returns {Object|null} - Channel object or null
     */
    async findByCategory(category) {
        try {
            const sql = `SELECT * FROM ${this.tableName} WHERE category = ?`;
            const channel = await this.database.get(sql, [category]);
            
            if (channel) {
                return this.parseChannel(channel);
            }
            
            return null;
        } catch (error) {
            Logger.error(`Error finding channel by category ${category}:`, error);
            throw error;
        }
    }

    /**
     * Update a channel
     * @param {number} id - Channel ID
     * @param {Object} updateData - Update data
     * @returns {Object} - Updated channel
     */
    async update(id, updateData) {
        try {
            const fields = [];
            const values = [];
            
            Object.keys(updateData).forEach(key => {
                fields.push(`${key} = ?`);
                values.push(updateData[key]);
            });
            
            fields.push('updatedAt = CURRENT_TIMESTAMP');
            values.push(id);
            
            const sql = `UPDATE ${this.tableName} SET ${fields.join(', ')} WHERE id = ?`;
            await this.database.run(sql, values);
            
            const updatedChannel = await this.findById(id);
            Logger.info(`Updated channel: ${updatedChannel.name} (ID: ${id})`);
            return updatedChannel;
        } catch (error) {
            Logger.error(`Error updating channel ${id}:`, error);
            throw error;
        }
    }

    /**
     * Delete a channel
     * @param {number} id - Channel ID
     * @returns {boolean} - Success status
     */
    async delete(id) {
        try {
            const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
            const result = await this.database.run(sql, [id]);
            
            Logger.info(`Deleted channel with ID: ${id}`);
            return result.changes > 0;
        } catch (error) {
            Logger.error(`Error deleting channel ${id}:`, error);
            throw error;
        }
    }

    /**
     * Find all channels
     * @returns {Array} - Array of channels
     */
    async findAll() {
        try {
            const sql = `SELECT * FROM ${this.tableName} ORDER BY name`;
            const channels = await this.database.all(sql);
            return channels.map(channel => this.parseChannel(channel));
        } catch (error) {
            Logger.error('Error finding all channels:', error);
            throw error;
        }
    }

    /**
     * Find channels by guild
     * @param {string} guildId - Guild ID
     * @returns {Array} - Array of channels
     */
    async findByGuild(guildId) {
        try {
            const sql = `
                SELECT * FROM ${this.tableName} 
                WHERE guildId = ? 
                ORDER BY name
            `;
            
            const channels = await this.database.all(sql, [guildId]);
            return channels.map(channel => this.parseChannel(channel));
        } catch (error) {
            Logger.error(`Error finding channels by guild ${guildId}:`, error);
            throw error;
        }
    }

    /**
     * Find channels by parent category
     * @param {string} parentCategoryId - Parent category ID
     * @returns {Array} - Array of channels
     */
    async findByParentCategory(parentCategoryId) {
        try {
            const sql = `
                SELECT * FROM ${this.tableName} 
                WHERE parentCategoryId = ? 
                ORDER BY name
            `;
            
            const channels = await this.database.all(sql, [parentCategoryId]);
            return channels.map(channel => this.parseChannel(channel));
        } catch (error) {
            Logger.error(`Error finding channels by parent category ${parentCategoryId}:`, error);
            throw error;
        }
    }

    /**
     * Get channel statistics
     * @returns {Object} - Statistics object
     */
    async getStats() {
        try {
            const stats = {};
            
            // Total channels
            const totalResult = await this.database.get(`SELECT COUNT(*) as total FROM ${this.tableName}`);
            stats.total = totalResult.total;
            
            // Channels by category
            const categoryResult = await this.database.all(`
                SELECT category, COUNT(*) as count 
                FROM ${this.tableName} 
                GROUP BY category 
                ORDER BY count DESC
            `);
            stats.byCategory = categoryResult.reduce((acc, row) => {
                acc[row.category] = row.count;
                return acc;
            }, {});
            
            // Recent channels (last 7 days)
            const recentResult = await this.database.get(`
                SELECT COUNT(*) as count 
                FROM ${this.tableName} 
                WHERE createdAt >= datetime('now', '-7 days')
            `);
            stats.recent = recentResult.count;
            
            return stats;
        } catch (error) {
            Logger.error('Error getting channel stats:', error);
            throw error;
        }
    }

    /**
     * Parse channel data from database
     * @param {Object} channel - Raw channel data from database
     * @returns {Object} - Parsed channel data
     */
    parseChannel(channel) {
        return {
            ...channel,
            createdAt: new Date(channel.createdAt),
            updatedAt: new Date(channel.updatedAt)
        };
    }
}

module.exports = ChannelModel; 