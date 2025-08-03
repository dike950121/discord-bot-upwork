/**
 * Controller for handling Discord channel operations
 * Manages channel creation, job distribution, and category management
 */

const { EmbedBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const Logger = require('../utils/Logger');

class ChannelController {
    constructor(channelService, channelModel) {
        this.channelService = channelService;
        this.channelModel = channelModel;
        this.defaultCategory = 'US ONLY';
    }

    /**
     * Create a new channel for a job category
     * @param {string} guildId - The Discord guild ID
     * @param {string} category - The job category
     * @param {string} parentCategoryId - Parent category ID (optional)
     */
    async createChannelForCategory(guildId, category, parentCategoryId = null) {
        try {
            // Check if channel already exists
            const existingChannel = await this.channelModel.findByCategory(category);
            if (existingChannel) {
                Logger.info(`Channel for category ${category} already exists`);
                return existingChannel;
            }

            // Create Discord channel
            const channelName = this.formatChannelName(category);
            const channel = await this.channelService.createChannel(guildId, {
                name: channelName,
                type: ChannelType.GuildText,
                parent: parentCategoryId,
                permissionOverwrites: [
                    {
                        id: guildId,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                    }
                ]
            });

            // Save channel to database
            const channelData = {
                discordId: channel.id,
                guildId: guildId,
                name: channelName,
                category: category,
                parentCategoryId: parentCategoryId,
                createdAt: new Date()
            };

            const savedChannel = await this.channelModel.create(channelData);
            
            Logger.info(`Created channel ${channelName} for category ${category}`);
            return savedChannel;
        } catch (error) {
            Logger.error(`Error creating channel for category ${category}:`, error);
            throw error;
        }
    }

    /**
     * Distribute a job to the appropriate channel
     * @param {Object} job - The job data
     * @param {string} guildId - The Discord guild ID
     */
    async distributeJob(job, guildId) {
        try {
            // Find or create channel for job category
            const channel = await this.getOrCreateChannelForCategory(guildId, job.category);
            
            if (!channel) {
                Logger.error(`Could not create channel for category ${job.category}`);
                return false;
            }

            // Create job embed
            const embed = this.createJobEmbed(job);
            
            // Send job to channel
            await this.channelService.sendMessage(channel.discordId, { embeds: [embed] });
            
            Logger.info(`Distributed job ${job.title} to channel ${channel.name}`);
            return true;
        } catch (error) {
            Logger.error(`Error distributing job ${job.id}:`, error);
            throw error;
        }
    }

    /**
     * Get or create channel for a category
     * @param {string} guildId - The Discord guild ID
     * @param {string} category - The job category
     */
    async getOrCreateChannelForCategory(guildId, category) {
        try {
            // Try to find existing channel
            let channel = await this.channelModel.findByCategory(category);
            
            if (!channel) {
                // Create new channel
                channel = await this.createChannelForCategory(guildId, category);
            }
            
            return channel;
        } catch (error) {
            Logger.error(`Error getting or creating channel for category ${category}:`, error);
            throw error;
        }
    }

    /**
     * Create a job embed for Discord
     * @param {Object} job - The job data
     */
    createJobEmbed(job) {
        const embed = new EmbedBuilder()
            .setTitle(`🎯 ${job.title}`)
            .setColor(this.getScoreColor(job.score))
            .setDescription(job.description.substring(0, 2000))
            .addFields(
                { name: '💰 Budget', value: this.formatBudget(job.budget), inline: true },
                { name: '⭐ Score', value: `${job.score}/10`, inline: true },
                { name: '📂 Category', value: job.category, inline: true },
                { name: '🔗 Link', value: job.url, inline: false }
            )
            .setTimestamp(new Date(job.createdAt))
            .setFooter({ text: `Job ID: ${job.id}` });

        // Add skills if available
        if (job.skills && job.skills.length > 0) {
            embed.addFields({
                name: '🛠️ Skills',
                value: job.skills.slice(0, 10).join(', '),
                inline: false
            });
        }

        // Add experience if available
        if (job.experience) {
            embed.addFields({
                name: '📈 Experience',
                value: job.experience,
                inline: true
            });
        }

        return embed;
    }

    /**
     * Get color based on job score
     * @param {number} score - The job score
     */
    getScoreColor(score) {
        if (score >= 8) return '#00FF00'; // Green for high scores
        if (score >= 6) return '#FFFF00'; // Yellow for medium scores
        if (score >= 4) return '#FFA500'; // Orange for low-medium scores
        return '#FF0000'; // Red for low scores
    }

    /**
     * Format budget for display
     * @param {Object} budget - The budget object
     */
    formatBudget(budget) {
        if (!budget) return 'Not specified';
        
        if (budget.min && budget.max) {
            return `$${budget.min} - $${budget.max}`;
        } else if (budget.min) {
            return `$${budget.min}+`;
        } else if (budget.max) {
            return `Up to $${budget.max}`;
        }
        
        return 'Not specified';
    }

    /**
     * Format channel name from category
     * @param {string} category - The job category
     */
    formatChannelName(category) {
        return category.toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    /**
     * Get all channels
     */
    async getAllChannels() {
        try {
            return await this.channelModel.findAll();
        } catch (error) {
            Logger.error('Error getting all channels:', error);
            throw error;
        }
    }

    /**
     * Get channel by category
     * @param {string} category - The job category
     */
    async getChannelByCategory(category) {
        try {
            return await this.channelModel.findByCategory(category);
        } catch (error) {
            Logger.error(`Error getting channel for category ${category}:`, error);
            throw error;
        }
    }

    /**
     * Delete a channel
     * @param {string} channelId - The channel ID
     */
    async deleteChannel(channelId) {
        try {
            const channel = await this.channelModel.findById(channelId);
            if (!channel) {
                throw new Error('Channel not found');
            }

            // Delete Discord channel
            await this.channelService.deleteChannel(channel.discordId);
            
            // Delete from database
            await this.channelModel.delete(channelId);
            
            Logger.info(`Deleted channel ${channel.name}`);
            return true;
        } catch (error) {
            Logger.error(`Error deleting channel ${channelId}:`, error);
            throw error;
        }
    }

    /**
     * Update channel settings
     * @param {string} channelId - The channel ID
     * @param {Object} updateData - The update data
     */
    async updateChannel(channelId, updateData) {
        try {
            const channel = await this.channelModel.update(channelId, updateData);
            
            Logger.info(`Updated channel ${channel.name}`);
            return channel;
        } catch (error) {
            Logger.error(`Error updating channel ${channelId}:`, error);
            throw error;
        }
    }

    /**
     * Send message to a specific channel
     * @param {string} channelId - The channel ID
     * @param {Object} message - The message to send
     */
    async sendMessageToChannel(channelId, message) {
        try {
            await this.channelService.sendMessage(channelId, message);
            Logger.info(`Sent message to channel ${channelId}`);
        } catch (error) {
            Logger.error(`Error sending message to channel ${channelId}:`, error);
            throw error;
        }
    }

    /**
     * Get channel statistics
     */
    async getChannelStats() {
        try {
            const stats = await this.channelModel.getStats();
            return {
                totalChannels: stats.total,
                channelsByCategory: stats.byCategory,
                recentChannels: stats.recent
            };
        } catch (error) {
            Logger.error('Error getting channel stats:', error);
            throw error;
        }
    }

    /**
     * Create default channels
     * @param {string} guildId - The Discord guild ID
     */
    async createDefaultChannels(guildId) {
        try {
            const defaultCategories = [
                'US ONLY',
                'mobile',
                'full-stack',
                'full-stack-ai',
                'frontend',
                'backend'
            ];

            const createdChannels = [];

            for (const category of defaultCategories) {
                try {
                    const channel = await this.createChannelForCategory(guildId, category);
                    createdChannels.push(channel);
                } catch (error) {
                    Logger.error(`Error creating default channel for ${category}:`, error);
                }
            }

            Logger.info(`Created ${createdChannels.length} default channels`);
            return createdChannels;
        } catch (error) {
            Logger.error('Error creating default channels:', error);
            throw error;
        }
    }

    /**
     * Archive old jobs in a channel
     * @param {string} channelId - The channel ID
     * @param {number} daysOld - Number of days old to archive
     */
    async archiveOldJobs(channelId, daysOld = 7) {
        try {
            const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
            
            // Get old messages from channel
            const oldMessages = await this.channelService.getOldMessages(channelId, cutoffDate);
            
            // Archive or delete old messages
            for (const message of oldMessages) {
                await this.channelService.deleteMessage(channelId, message.id);
            }
            
            Logger.info(`Archived ${oldMessages.length} old messages from channel ${channelId}`);
            return oldMessages.length;
        } catch (error) {
            Logger.error(`Error archiving old jobs in channel ${channelId}:`, error);
            throw error;
        }
    }
}

module.exports = ChannelController; 