/**
 * Model for managing Discord channel data using Mongoose
 * Handles channel CRUD operations and database interactions
 */

const mongoose = require('mongoose');
const ChannelSchema = require('./schemas/ChannelSchema');
const Logger = require('../utils/Logger');

class ChannelModel {
    constructor() {
        this.Channel = mongoose.model('Channel', ChannelSchema);
    }

    /**
     * Create a new channel
     * @param {Object} channelData - Channel data
     * @returns {Object} - Created channel
     */
    async create(channelData) {
        try {
            const channel = new this.Channel(channelData);
            const savedChannel = await channel.save();
            
            Logger.info(`Created channel: ${savedChannel.name} (ID: ${savedChannel._id})`);
            return savedChannel;
        } catch (error) {
            Logger.error('Error creating channel:', error);
            throw error;
        }
    }

    /**
     * Find channel by ID
     * @param {string} id - Channel ID
     * @returns {Object|null} - Channel object or null
     */
    async findById(id) {
        try {
            const channel = await this.Channel.findById(id);
            return channel;
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
            const channel = await this.Channel.findOne({ discordId });
            return channel;
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
            const channel = await this.Channel.findOne({ category });
            return channel;
        } catch (error) {
            Logger.error(`Error finding channel by category ${category}:`, error);
            throw error;
        }
    }

    /**
     * Update a channel
     * @param {string} id - Channel ID
     * @param {Object} updateData - Update data
     * @returns {Object} - Updated channel
     */
    async update(id, updateData) {
        try {
            const updatedChannel = await this.Channel.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            );
            
            if (updatedChannel) {
                Logger.info(`Updated channel: ${updatedChannel.name} (ID: ${id})`);
            }
            
            return updatedChannel;
        } catch (error) {
            Logger.error(`Error updating channel ${id}:`, error);
            throw error;
        }
    }

    /**
     * Delete a channel
     * @param {string} id - Channel ID
     * @returns {boolean} - Success status
     */
    async delete(id) {
        try {
            const result = await this.Channel.findByIdAndDelete(id);
            const success = result !== null;
            
            if (success) {
                Logger.info(`Deleted channel with ID: ${id}`);
            }
            
            return success;
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
            const channels = await this.Channel.find().sort({ name: 1 });
            return channels;
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
            const channels = await this.Channel.findByGuild(guildId);
            return channels;
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
            const channels = await this.Channel.findByParentCategory(parentCategoryId);
            return channels;
        } catch (error) {
            Logger.error(`Error finding channels by parent category ${parentCategoryId}:`, error);
            throw error;
        }
    }

    /**
     * Update channel category
     * @param {string} id - Channel ID
     * @param {string} newCategory - New category
     * @returns {Object} - Updated channel
     */
    async updateCategory(id, newCategory) {
        try {
            const channel = await this.Channel.findById(id);
            if (channel) {
                await channel.updateCategory(newCategory);
                Logger.info(`Updated channel category: ${channel.name} (ID: ${id}, Category: ${newCategory})`);
            }
            return channel;
        } catch (error) {
            Logger.error(`Error updating channel category ${id}:`, error);
            throw error;
        }
    }

    /**
     * Update channel parent category
     * @param {string} id - Channel ID
     * @param {string} parentCategoryId - Parent category ID
     * @returns {Object} - Updated channel
     */
    async updateParentCategory(id, parentCategoryId) {
        try {
            const channel = await this.Channel.findById(id);
            if (channel) {
                await channel.updateParentCategory(parentCategoryId);
                Logger.info(`Updated channel parent category: ${channel.name} (ID: ${id})`);
            }
            return channel;
        } catch (error) {
            Logger.error(`Error updating channel parent category ${id}:`, error);
            throw error;
        }
    }

    /**
     * Get channel statistics
     * @returns {Object} - Statistics object
     */
    async getStats() {
        try {
            const stats = await this.Channel.getStats();
            return stats;
        } catch (error) {
            Logger.error('Error getting channel stats:', error);
            throw error;
        }
    }

    /**
     * Count total channels
     * @returns {number} - Total channel count
     */
    async count() {
        try {
            return await this.Channel.countDocuments();
        } catch (error) {
            Logger.error('Error counting channels:', error);
            throw error;
        }
    }

    /**
     * Delete all channels
     * @returns {number} - Number of deleted channels
     */
    async deleteAll() {
        try {
            const result = await this.Channel.deleteMany({});
            Logger.info(`Deleted ${result.deletedCount} channels`);
            return result.deletedCount;
        } catch (error) {
            Logger.error('Error deleting all channels:', error);
            throw error;
        }
    }

    /**
     * Find channels by multiple Discord IDs
     * @param {Array} discordIds - Array of Discord channel IDs
     * @returns {Array} - Array of channels
     */
    async findByDiscordIds(discordIds) {
        try {
            if (discordIds.length === 0) return [];
            
            const channels = await this.Channel.find({
                discordId: { $in: discordIds }
            });
            return channels;
        } catch (error) {
            Logger.error('Error finding channels by Discord IDs:', error);
            throw error;
        }
    }

    /**
     * Find channels by name pattern
     * @param {string} namePattern - Name pattern to search for
     * @returns {Array} - Array of channels
     */
    async findByNamePattern(namePattern) {
        try {
            const channels = await this.Channel.find({
                name: { $regex: namePattern, $options: 'i' }
            }).sort({ name: 1 });
            return channels;
        } catch (error) {
            Logger.error(`Error finding channels by name pattern "${namePattern}":`, error);
            throw error;
        }
    }
}

module.exports = ChannelModel; 