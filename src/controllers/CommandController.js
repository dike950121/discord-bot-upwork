/**
 * Controller for handling Discord bot commands
 * Manages user interactions and command processing
 */

const { EmbedBuilder } = require('discord.js');
const Logger = require('../utils/Logger');

class CommandController {
    constructor(upworkController, profileController, jobController, channelController) {
        this.upworkController = upworkController;
        this.profileController = profileController;
        this.jobController = jobController;
        this.channelController = channelController;
        
        this.commands = new Map();
        this.setupCommands();
    }

    /**
     * Setup all available commands
     */
    setupCommands() {
        // Job-related commands
        this.commands.set('!jobs', this.handleJobsCommand.bind(this));
        this.commands.set('!job', this.handleJobCommand.bind(this));
        this.commands.set('!search', this.handleSearchCommand.bind(this));
        this.commands.set('!stats', this.handleStatsCommand.bind(this));
        this.commands.set('!fetch', this.handleFetchCommand.bind(this));
        this.commands.set('!highscore', this.handleHighScoreCommand.bind(this));
        this.commands.set('!recent', this.handleRecentCommand.bind(this));

        // Profile-related commands
        this.commands.set('!profile', this.handleProfileCommand.bind(this));
        this.commands.set('!profiles', this.handleProfilesCommand.bind(this));
        this.commands.set('!addprofile', this.handleAddProfileCommand.bind(this));
        this.commands.set('!updateprofile', this.handleUpdateProfileCommand.bind(this));
        this.commands.set('!deleteprofile', this.handleDeleteProfileCommand.bind(this));
        this.commands.set('!match', this.handleMatchCommand.bind(this));

        // Channel-related commands
        this.commands.set('!channels', this.handleChannelsCommand.bind(this));
        this.commands.set('!createchannel', this.handleCreateChannelCommand.bind(this));
        this.commands.set('!deletechannel', this.handleDeleteChannelCommand.bind(this));

        // Utility commands
        this.commands.set('!help', this.handleHelpCommand.bind(this));
        this.commands.set('!ping', this.handlePingCommand.bind(this));
    }

    /**
     * Handle incoming Discord messages
     * @param {Object} message - The Discord message object
     */
    async handleMessage(message) {
        try {
            const content = message.content.trim();
            
            // Check if message starts with a command
            const command = this.getCommand(content);
            if (!command) return;

            // Extract command and arguments
            const args = this.parseArgs(content);
            
            // Execute command
            await command(message, args);
            
        } catch (error) {
            Logger.error('Error handling message:', error);
            message.reply('❌ An error occurred while processing your command.');
        }
    }

    /**
     * Get command from message content
     * @param {string} content - The message content
     */
    getCommand(content) {
        for (const [prefix, handler] of this.commands) {
            if (content.startsWith(prefix)) {
                return handler;
            }
        }
        return null;
    }

    /**
     * Parse command arguments
     * @param {string} content - The message content
     */
    parseArgs(content) {
        const parts = content.split(' ');
        return parts.slice(1);
    }

    /**
     * Handle jobs command - show recent jobs
     */
    async handleJobsCommand(message, args) {
        try {
            const limit = parseInt(args[0]) || 10;
            const jobs = await this.jobController.getRecentJobs(24, limit);
            
            if (jobs.length === 0) {
                message.reply('📭 No recent jobs found.');
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle('📋 Recent Jobs')
                .setColor('#0099ff')
                .setDescription(`Showing ${jobs.length} recent jobs`);

            jobs.forEach((job, index) => {
                embed.addFields({
                    name: `${index + 1}. ${job.title}`,
                    value: `Score: ${job.score}/10 | Category: ${job.category} | Budget: ${this.formatBudget(job.budget)}`,
                    inline: false
                });
            });

            message.reply({ embeds: [embed] });
        } catch (error) {
            Logger.error('Error handling jobs command:', error);
            message.reply('❌ Error fetching jobs.');
        }
    }

    /**
     * Handle job command - show specific job details
     */
    async handleJobCommand(message, args) {
        try {
            if (args.length === 0) {
                message.reply('❌ Please provide a job ID.');
                return;
            }

            const jobId = args[0];
            const job = await this.jobController.getJobById(jobId);
            
            if (!job) {
                message.reply('❌ Job not found.');
                return;
            }

            const embed = this.createJobEmbed(job);
            message.reply({ embeds: [embed] });
        } catch (error) {
            Logger.error('Error handling job command:', error);
            message.reply('❌ Error fetching job details.');
        }
    }

    /**
     * Handle search command - search jobs by keyword
     */
    async handleSearchCommand(message, args) {
        try {
            if (args.length === 0) {
                message.reply('❌ Please provide a search keyword.');
                return;
            }

            const keyword = args.join(' ');
            const jobs = await this.jobController.searchJobs(keyword, 10);
            
            if (jobs.length === 0) {
                message.reply(`🔍 No jobs found for "${keyword}".`);
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle(`🔍 Search Results for "${keyword}"`)
                .setColor('#0099ff')
                .setDescription(`Found ${jobs.length} jobs`);

            jobs.forEach((job, index) => {
                embed.addFields({
                    name: `${index + 1}. ${job.title}`,
                    value: `Score: ${job.score}/10 | Category: ${job.category}`,
                    inline: false
                });
            });

            message.reply({ embeds: [embed] });
        } catch (error) {
            Logger.error('Error handling search command:', error);
            message.reply('❌ Error searching jobs.');
        }
    }

    /**
     * Handle stats command - show job statistics
     */
    async handleStatsCommand(message, args) {
        try {
            const stats = await this.jobController.getJobStats();
            
            const embed = new EmbedBuilder()
                .setTitle('📊 Job Statistics')
                .setColor('#00ff00')
                .addFields(
                    { name: 'Total Jobs', value: stats.totalJobs.toString(), inline: true },
                    { name: 'Average Score', value: stats.averageScore.toFixed(2), inline: true },
                    { name: 'Recent Jobs (24h)', value: stats.recentJobs.toString(), inline: true }
                );

            // Add category breakdown
            if (stats.jobsByCategory) {
                const categoryText = Object.entries(stats.jobsByCategory)
                    .map(([category, count]) => `${category}: ${count}`)
                    .join('\n');
                
                embed.addFields({
                    name: 'Jobs by Category',
                    value: categoryText || 'No data',
                    inline: false
                });
            }

            message.reply({ embeds: [embed] });
        } catch (error) {
            Logger.error('Error handling stats command:', error);
            message.reply('❌ Error fetching statistics.');
        }
    }

    /**
     * Handle fetch command - manually fetch jobs
     */
    async handleFetchCommand(message, args) {
        try {
            message.reply('🔄 Fetching new jobs from Upwork...');
            
            await this.upworkController.manualFetch();
            
            message.reply('✅ Job fetching completed!');
        } catch (error) {
            Logger.error('Error handling fetch command:', error);
            message.reply('❌ Error fetching jobs.');
        }
    }

    /**
     * Handle high score command - show high-scoring jobs
     */
    async handleHighScoreCommand(message, args) {
        try {
            const minScore = parseInt(args[0]) || 7;
            const jobs = await this.jobController.getHighScoringJobs(minScore, 10);
            
            if (jobs.length === 0) {
                message.reply(`📭 No jobs found with score >= ${minScore}.`);
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle(`⭐ High-Scoring Jobs (>= ${minScore})`)
                .setColor('#ffff00')
                .setDescription(`Found ${jobs.length} high-scoring jobs`);

            jobs.forEach((job, index) => {
                embed.addFields({
                    name: `${index + 1}. ${job.title}`,
                    value: `Score: ${job.score}/10 | Category: ${job.category} | Budget: ${this.formatBudget(job.budget)}`,
                    inline: false
                });
            });

            message.reply({ embeds: [embed] });
        } catch (error) {
            Logger.error('Error handling high score command:', error);
            message.reply('❌ Error fetching high-scoring jobs.');
        }
    }

    /**
     * Handle recent command - show recent jobs
     */
    async handleRecentCommand(message, args) {
        try {
            const hours = parseInt(args[0]) || 24;
            const jobs = await this.jobController.getRecentJobs(hours, 10);
            
            if (jobs.length === 0) {
                message.reply(`📭 No jobs found in the last ${hours} hours.`);
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle(`🕒 Recent Jobs (Last ${hours}h)`)
                .setColor('#0099ff')
                .setDescription(`Found ${jobs.length} recent jobs`);

            jobs.forEach((job, index) => {
                embed.addFields({
                    name: `${index + 1}. ${job.title}`,
                    value: `Score: ${job.score}/10 | Category: ${job.category}`,
                    inline: false
                });
            });

            message.reply({ embeds: [embed] });
        } catch (error) {
            Logger.error('Error handling recent command:', error);
            message.reply('❌ Error fetching recent jobs.');
        }
    }

    /**
     * Handle profile command - show profile details
     */
    async handleProfileCommand(message, args) {
        try {
            if (args.length === 0) {
                message.reply('❌ Please provide a profile name.');
                return;
            }

            const profileName = args.join(' ');
            const profile = await this.profileController.getProfileByName(profileName);
            
            if (!profile) {
                message.reply('❌ Profile not found.');
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle(`👤 Profile: ${profile.name}`)
                .setColor('#00ff00')
                .setDescription(profile.description)
                .addFields(
                    { name: 'Skills', value: profile.skills.join(', '), inline: false },
                    { name: 'Experience', value: profile.experience.level, inline: true },
                    { name: 'Hourly Rate', value: `$${profile.hourlyRate}`, inline: true }
                );

            message.reply({ embeds: [embed] });
        } catch (error) {
            Logger.error('Error handling profile command:', error);
            message.reply('❌ Error fetching profile.');
        }
    }

    /**
     * Handle profiles command - list all profiles
     */
    async handleProfilesCommand(message, args) {
        try {
            const profiles = await this.profileController.getAllProfiles();
            
            if (profiles.length === 0) {
                message.reply('📭 No profiles found.');
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle('👥 All Profiles')
                .setColor('#0099ff')
                .setDescription(`Found ${profiles.length} profiles`);

            profiles.forEach((profile, index) => {
                embed.addFields({
                    name: `${index + 1}. ${profile.name}`,
                    value: `Skills: ${profile.skills.slice(0, 3).join(', ')} | Rate: $${profile.hourlyRate}`,
                    inline: false
                });
            });

            message.reply({ embeds: [embed] });
        } catch (error) {
            Logger.error('Error handling profiles command:', error);
            message.reply('❌ Error fetching profiles.');
        }
    }

    /**
     * Handle add profile command
     */
    async handleAddProfileCommand(message, args) {
        try {
            // This would need more sophisticated parsing or a different approach
            message.reply('❌ Profile creation via command not implemented. Use the web interface.');
        } catch (error) {
            Logger.error('Error handling add profile command:', error);
            message.reply('❌ Error creating profile.');
        }
    }

    /**
     * Handle match command - find best profile for a job
     */
    async handleMatchCommand(message, args) {
        try {
            if (args.length === 0) {
                message.reply('❌ Please provide a job ID.');
                return;
            }

            const jobId = args[0];
            const job = await this.jobController.getJobById(jobId);
            
            if (!job) {
                message.reply('❌ Job not found.');
                return;
            }

            const match = await this.profileController.findBestMatchingProfile(job);
            
            if (!match || !match.profile) {
                message.reply('❌ No matching profiles found.');
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle('🎯 Best Profile Match')
                .setColor('#00ff00')
                .addFields(
                    { name: 'Job', value: job.title, inline: true },
                    { name: 'Best Profile', value: match.profile.name, inline: true },
                    { name: 'Match Score', value: `${match.score.toFixed(2)}/10`, inline: true }
                );

            message.reply({ embeds: [embed] });
        } catch (error) {
            Logger.error('Error handling match command:', error);
            message.reply('❌ Error finding profile match.');
        }
    }

    /**
     * Handle channels command - list all channels
     */
    async handleChannelsCommand(message, args) {
        try {
            const channels = await this.channelController.getAllChannels();
            
            if (channels.length === 0) {
                message.reply('📭 No channels found.');
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle('📺 Job Channels')
                .setColor('#0099ff')
                .setDescription(`Found ${channels.length} channels`);

            channels.forEach((channel, index) => {
                embed.addFields({
                    name: `${index + 1}. ${channel.name}`,
                    value: `Category: ${channel.category}`,
                    inline: false
                });
            });

            message.reply({ embeds: [embed] });
        } catch (error) {
            Logger.error('Error handling channels command:', error);
            message.reply('❌ Error fetching channels.');
        }
    }

    /**
     * Handle help command
     */
    async handleHelpCommand(message, args) {
        const embed = new EmbedBuilder()
            .setTitle('🤖 Discord Bot Commands')
            .setColor('#0099ff')
            .setDescription('Here are all available commands:')
            .addFields(
                { name: '📋 Job Commands', value: '!jobs, !job <id>, !search <keyword>, !stats, !fetch, !highscore [min], !recent [hours]', inline: false },
                { name: '👤 Profile Commands', value: '!profile <name>, !profiles, !match <job_id>', inline: false },
                { name: '📺 Channel Commands', value: '!channels', inline: false },
                { name: '🛠️ Utility Commands', value: '!help, !ping', inline: false }
            );

        message.reply({ embeds: [embed] });
    }

    /**
     * Handle ping command
     */
    async handlePingCommand(message, args) {
        const embed = new EmbedBuilder()
            .setTitle('🏓 Pong!')
            .setColor('#00ff00')
            .setDescription('Bot is online and responding!');

        message.reply({ embeds: [embed] });
    }

    /**
     * Create job embed for display
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

        return embed;
    }

    /**
     * Get color based on job score
     */
    getScoreColor(score) {
        if (score >= 8) return '#00FF00';
        if (score >= 6) return '#FFFF00';
        if (score >= 4) return '#FFA500';
        return '#FF0000';
    }

    /**
     * Format budget for display
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

    // Additional command handlers for profile and channel management
    async handleUpdateProfileCommand(message, args) {
        message.reply('❌ Profile updates via command not implemented. Use the web interface.');
    }

    async handleDeleteProfileCommand(message, args) {
        message.reply('❌ Profile deletion via command not implemented. Use the web interface.');
    }

    async handleCreateChannelCommand(message, args) {
        message.reply('❌ Channel creation via command not implemented. Use the web interface.');
    }

    async handleDeleteChannelCommand(message, args) {
        message.reply('❌ Channel deletion via command not implemented. Use the web interface.');
    }
}

module.exports = CommandController; 