/**
 * Main entry point for the Discord bot application
 * Handles initialization and startup of all services
 */

require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

// Import controllers and services
const UpworkController = require('./controllers/UpworkController');
const ProfileController = require('./controllers/ProfileController');
const JobController = require('./controllers/JobController');
const ChannelController = require('./controllers/ChannelController');
const CommandController = require('./controllers/CommandController');

// Import models
const JobModel = require('./models/JobModel');
const ProfileModel = require('./models/ProfileModel');
const ChannelModel = require('./models/ChannelModel');

// Import services
const UpworkService = require('./services/UpworkService');
const OpenAIService = require('./services/OpenAIService');
const ScoringService = require('./services/ScoringService');
const ChannelService = require('./services/ChannelService');

// Import utilities
const Logger = require('./utils/Logger');
const Database = require('./utils/Database');

class DiscordBot {
    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers
            ]
        });

        this.controllers = {};
        this.services = {};
        this.models = {};
        
        this.initializeDatabase();
        this.initializeServices();
        this.initializeControllers();
        this.setupEventHandlers();
    }

    /**
     * Initialize MongoDB database connection
     */
    async initializeDatabase() {
        Logger.info('Initializing MongoDB connection...');
        
        try {
            this.database = new Database();
            await this.database.init();
            
            Logger.info('MongoDB connection established successfully');
        } catch (error) {
            Logger.error('Failed to initialize MongoDB connection:', error);
            Logger.warn('Bot will continue without database functionality');
            this.database = null;
        }
    }

    /**
     * Initialize all services with dependencies
     */
    initializeServices() {
        Logger.info('Initializing services...');
        
        // Initialize services
        this.services.openai = new OpenAIService();
        this.services.upwork = new UpworkService();
        this.services.scoring = new ScoringService(this.services.openai);
        this.services.channel = new ChannelService(this.client);
        
        Logger.info('Services initialized successfully');
    }

    /**
     * Initialize all controllers with their dependencies
     */
    initializeControllers() {
        Logger.info('Initializing controllers...');
        
        // Initialize models (no longer need database parameter)
        this.models.job = new JobModel();
        this.models.profile = new ProfileModel();
        this.models.channel = new ChannelModel();
        
        // Initialize controllers
        this.controllers.upwork = new UpworkController(
            this.services.upwork,
            this.services.scoring,
            this.models.job
        );
        
        this.controllers.profile = new ProfileController(
            this.models.profile
        );
        
        this.controllers.job = new JobController(
            this.models.job,
            this.services.scoring
        );
        
        this.controllers.channel = new ChannelController(
            this.services.channel,
            this.models.channel
        );
        
        this.controllers.command = new CommandController(
            this.controllers.upwork,
            this.controllers.profile,
            this.controllers.job,
            this.controllers.channel
        );
        
        Logger.info('Controllers initialized successfully');
    }

    /**
     * Setup Discord event handlers
     */
    setupEventHandlers() {
        this.client.on('ready', () => {
            Logger.info(`Bot logged in as ${this.client.user.tag}`);
            this.startJobMonitoring();
        });

        this.client.on('messageCreate', async (message) => {
            if (message.author.bot) return;
            
            try {
                await this.controllers.command.handleMessage(message);
            } catch (error) {
                Logger.error('Error handling message:', error);
                message.reply('An error occurred while processing your command.');
            }
        });

        this.client.on('error', (error) => {
            Logger.error('Discord client error:', error);
        });
    }

    /**
     * Start the job monitoring process
     */
    async startJobMonitoring() {
        Logger.info('Starting job monitoring...');
        
        // Start the Upwork job monitoring
        await this.controllers.upwork.startMonitoring();
        
        Logger.info('Job monitoring started successfully');
    }

    /**
     * Start the bot
     */
    async start() {
        try {
            Logger.info('Starting Discord bot...');
            
            // Check if Discord token is provided
            if (!process.env.DISCORD_TOKEN || process.env.DISCORD_TOKEN === 'your_discord_bot_token_here') {
                Logger.error('DISCORD_TOKEN environment variable is required. Please set it in your .env file.');
                Logger.error('You can run "npm run setup" to create a .env file template.');
                process.exit(1);
            }
            
            // Connect to Discord
            await this.client.login(process.env.DISCORD_TOKEN);
            
            Logger.info('Discord bot started successfully');
        } catch (error) {
            Logger.error('Failed to start Discord bot:', error);
            process.exit(1);
        }
    }

    /**
     * Gracefully shutdown the bot
     */
    async shutdown() {
        Logger.info('Shutting down bot...');
        
        try {
            // Close Discord connection
            if (this.client) {
                await this.client.destroy();
            }
            
            // Close database connection
            if (this.database) {
                await this.database.close();
            }
            
            Logger.info('Bot shutdown completed');
        } catch (error) {
            Logger.error('Error during shutdown:', error);
        }
    }
}

// Start the bot
const bot = new DiscordBot();
bot.start().catch(console.error);

// Handle graceful shutdown
process.on('SIGINT', async () => {
    await bot.shutdown();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await bot.shutdown();
    process.exit(0);
}); 