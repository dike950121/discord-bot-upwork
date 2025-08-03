/**
 * Service for managing Discord channels and messages
 * Handles channel operations and message sending
 */

const Logger = require('../utils/Logger');

class ChannelService {
    constructor(client) {
        this.client = client;
    }

    /**
     * Create a new Discord channel
     * @param {string} guildId - The guild ID
     * @param {Object} options - Channel options
     * @returns {Object} - Created channel
     */
    async createChannel(guildId, options) {
        try {
            const guild = await this.client.guilds.fetch(guildId);
            if (!guild) {
                throw new Error(`Guild ${guildId} not found`);
            }

            const channel = await guild.channels.create({
                name: options.name,
                type: options.type,
                parent: options.parent,
                permissionOverwrites: options.permissionOverwrites || [],
                topic: options.topic || '',
                nsfw: options.nsfw || false
            });

            Logger.info(`Created channel ${channel.name} in guild ${guild.name}`);
            return channel;
        } catch (error) {
            Logger.error(`Error creating channel in guild ${guildId}:`, error);
            throw error;
        }
    }

    /**
     * Send a message to a channel
     * @param {string} channelId - The channel ID
     * @param {Object} messageOptions - Message options
     * @returns {Object} - Sent message
     */
    async sendMessage(channelId, messageOptions) {
        try {
            const channel = await this.client.channels.fetch(channelId);
            if (!channel) {
                throw new Error(`Channel ${channelId} not found`);
            }

            const message = await channel.send(messageOptions);
            Logger.info(`Sent message to channel ${channel.name}`);
            return message;
        } catch (error) {
            Logger.error(`Error sending message to channel ${channelId}:`, error);
            throw error;
        }
    }

    /**
     * Delete a Discord channel
     * @param {string} channelId - The channel ID
     * @returns {boolean} - Success status
     */
    async deleteChannel(channelId) {
        try {
            const channel = await this.client.channels.fetch(channelId);
            if (!channel) {
                Logger.warn(`Channel ${channelId} not found for deletion`);
                return false;
            }

            await channel.delete();
            Logger.info(`Deleted channel ${channel.name}`);
            return true;
        } catch (error) {
            Logger.error(`Error deleting channel ${channelId}:`, error);
            throw error;
        }
    }

    /**
     * Delete a message from a channel
     * @param {string} channelId - The channel ID
     * @param {string} messageId - The message ID
     * @returns {boolean} - Success status
     */
    async deleteMessage(channelId, messageId) {
        try {
            const channel = await this.client.channels.fetch(channelId);
            if (!channel) {
                Logger.warn(`Channel ${channelId} not found`);
                return false;
            }

            const message = await channel.messages.fetch(messageId);
            if (!message) {
                Logger.warn(`Message ${messageId} not found in channel ${channelId}`);
                return false;
            }

            await message.delete();
            Logger.info(`Deleted message ${messageId} from channel ${channel.name}`);
            return true;
        } catch (error) {
            Logger.error(`Error deleting message ${messageId} from channel ${channelId}:`, error);
            return false;
        }
    }

    /**
     * Get old messages from a channel
     * @param {string} channelId - The channel ID
     * @param {Date} cutoffDate - Cutoff date for old messages
     * @returns {Array} - Array of old messages
     */
    async getOldMessages(channelId, cutoffDate) {
        try {
            const channel = await this.client.channels.fetch(channelId);
            if (!channel) {
                Logger.warn(`Channel ${channelId} not found`);
                return [];
            }

            const messages = await channel.messages.fetch({ limit: 100 });
            const oldMessages = messages.filter(message => 
                message.createdAt < cutoffDate && !message.pinned
            );

            Logger.info(`Found ${oldMessages.size} old messages in channel ${channel.name}`);
            return Array.from(oldMessages.values());
        } catch (error) {
            Logger.error(`Error getting old messages from channel ${channelId}:`, error);
            return [];
        }
    }

    /**
     * Get channel information
     * @param {string} channelId - The channel ID
     * @returns {Object} - Channel information
     */
    async getChannelInfo(channelId) {
        try {
            const channel = await this.client.channels.fetch(channelId);
            if (!channel) {
                throw new Error(`Channel ${channelId} not found`);
            }

            return {
                id: channel.id,
                name: channel.name,
                type: channel.type,
                guildId: channel.guild?.id,
                guildName: channel.guild?.name,
                topic: channel.topic,
                createdAt: channel.createdAt,
                position: channel.position,
                parentId: channel.parent?.id,
                parentName: channel.parent?.name
            };
        } catch (error) {
            Logger.error(`Error getting channel info for ${channelId}:`, error);
            throw error;
        }
    }

    /**
     * Get all channels in a guild
     * @param {string} guildId - The guild ID
     * @returns {Array} - Array of channels
     */
    async getGuildChannels(guildId) {
        try {
            const guild = await this.client.guilds.fetch(guildId);
            if (!guild) {
                throw new Error(`Guild ${guildId} not found`);
            }

            const channels = await guild.channels.fetch();
            return Array.from(channels.values());
        } catch (error) {
            Logger.error(`Error getting channels for guild ${guildId}:`, error);
            throw error;
        }
    }

    /**
     * Find channel by name in a guild
     * @param {string} guildId - The guild ID
     * @param {string} channelName - The channel name
     * @returns {Object|null} - Channel object or null
     */
    async findChannelByName(guildId, channelName) {
        try {
            const channels = await this.getGuildChannels(guildId);
            return channels.find(channel => 
                channel.name.toLowerCase() === channelName.toLowerCase()
            ) || null;
        } catch (error) {
            Logger.error(`Error finding channel by name in guild ${guildId}:`, error);
            return null;
        }
    }

    /**
     * Update channel settings
     * @param {string} channelId - The channel ID
     * @param {Object} updateData - Update data
     * @returns {Object} - Updated channel
     */
    async updateChannel(channelId, updateData) {
        try {
            const channel = await this.client.channels.fetch(channelId);
            if (!channel) {
                throw new Error(`Channel ${channelId} not found`);
            }

            const updatedChannel = await channel.edit(updateData);
            Logger.info(`Updated channel ${channel.name}`);
            return updatedChannel;
        } catch (error) {
            Logger.error(`Error updating channel ${channelId}:`, error);
            throw error;
        }
    }

    /**
     * Set channel permissions
     * @param {string} channelId - The channel ID
     * @param {Array} permissions - Permission overwrites
     * @returns {boolean} - Success status
     */
    async setChannelPermissions(channelId, permissions) {
        try {
            const channel = await this.client.channels.fetch(channelId);
            if (!channel) {
                throw new Error(`Channel ${channelId} not found`);
            }

            await channel.permissionOverwrites.set(permissions);
            Logger.info(`Updated permissions for channel ${channel.name}`);
            return true;
        } catch (error) {
            Logger.error(`Error setting permissions for channel ${channelId}:`, error);
            throw error;
        }
    }

    /**
     * Get channel statistics
     * @param {string} channelId - The channel ID
     * @returns {Object} - Channel statistics
     */
    async getChannelStats(channelId) {
        try {
            const channel = await this.client.channels.fetch(channelId);
            if (!channel) {
                throw new Error(`Channel ${channelId} not found`);
            }

            const messages = await channel.messages.fetch({ limit: 100 });
            
            return {
                channelId: channel.id,
                channelName: channel.name,
                messageCount: messages.size,
                lastMessage: messages.first()?.createdAt || null,
                memberCount: channel.guild?.memberCount || 0
            };
        } catch (error) {
            Logger.error(`Error getting stats for channel ${channelId}:`, error);
            throw error;
        }
    }

    /**
     * Bulk delete messages
     * @param {string} channelId - The channel ID
     * @param {Array} messageIds - Array of message IDs to delete
     * @returns {number} - Number of messages deleted
     */
    async bulkDeleteMessages(channelId, messageIds) {
        try {
            const channel = await this.client.channels.fetch(channelId);
            if (!channel) {
                throw new Error(`Channel ${channelId} not found`);
            }

            const messages = await channel.messages.fetch({ limit: 100 });
            const messagesToDelete = messages.filter(message => 
                messageIds.includes(message.id)
            );

            if (messagesToDelete.size > 0) {
                await channel.bulkDelete(messagesToDelete);
                Logger.info(`Bulk deleted ${messagesToDelete.size} messages from channel ${channel.name}`);
                return messagesToDelete.size;
            }

            return 0;
        } catch (error) {
            Logger.error(`Error bulk deleting messages from channel ${channelId}:`, error);
            throw error;
        }
    }

    /**
     * Pin a message
     * @param {string} channelId - The channel ID
     * @param {string} messageId - The message ID
     * @returns {boolean} - Success status
     */
    async pinMessage(channelId, messageId) {
        try {
            const channel = await this.client.channels.fetch(channelId);
            if (!channel) {
                throw new Error(`Channel ${channelId} not found`);
            }

            const message = await channel.messages.fetch(messageId);
            if (!message) {
                throw new Error(`Message ${messageId} not found`);
            }

            await message.pin();
            Logger.info(`Pinned message ${messageId} in channel ${channel.name}`);
            return true;
        } catch (error) {
            Logger.error(`Error pinning message ${messageId} in channel ${channelId}:`, error);
            throw error;
        }
    }

    /**
     * Unpin a message
     * @param {string} channelId - The channel ID
     * @param {string} messageId - The message ID
     * @returns {boolean} - Success status
     */
    async unpinMessage(channelId, messageId) {
        try {
            const channel = await this.client.channels.fetch(channelId);
            if (!channel) {
                throw new Error(`Channel ${channelId} not found`);
            }

            const message = await channel.messages.fetch(messageId);
            if (!message) {
                throw new Error(`Message ${messageId} not found`);
            }

            await message.unpin();
            Logger.info(`Unpinned message ${messageId} in channel ${channel.name}`);
            return true;
        } catch (error) {
            Logger.error(`Error unpinning message ${messageId} in channel ${channelId}:`, error);
            throw error;
        }
    }

    /**
     * Get pinned messages
     * @param {string} channelId - The channel ID
     * @returns {Array} - Array of pinned messages
     */
    async getPinnedMessages(channelId) {
        try {
            const channel = await this.client.channels.fetch(channelId);
            if (!channel) {
                throw new Error(`Channel ${channelId} not found`);
            }

            const pinnedMessages = await channel.messages.fetchPinned();
            Logger.info(`Retrieved ${pinnedMessages.size} pinned messages from channel ${channel.name}`);
            return Array.from(pinnedMessages.values());
        } catch (error) {
            Logger.error(`Error getting pinned messages from channel ${channelId}:`, error);
            throw error;
        }
    }

    /**
     * Test channel access
     * @param {string} channelId - The channel ID
     * @returns {boolean} - Access status
     */
    async testChannelAccess(channelId) {
        try {
            const channel = await this.client.channels.fetch(channelId);
            if (!channel) {
                return false;
            }

            // Try to send a test message and immediately delete it
            const testMessage = await channel.send('Test message - will be deleted');
            await testMessage.delete();
            
            Logger.info(`Channel access test successful for ${channel.name}`);
            return true;
        } catch (error) {
            Logger.error(`Channel access test failed for ${channelId}:`, error);
            return false;
        }
    }
}

module.exports = ChannelService; 