/**
 * Logger utility for consistent logging throughout the application
 * Provides different log levels and formatting
 */

const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logLevels = {
            ERROR: 0,
            WARN: 1,
            INFO: 2,
            DEBUG: 3
        };
        
        this.currentLevel = this.logLevels.INFO;
        this.logDir = path.join(process.cwd(), 'logs');
        this.ensureLogDirectory();
    }

    /**
     * Ensure log directory exists
     */
    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    /**
     * Get current timestamp
     * @returns {string} - Formatted timestamp
     */
    getTimestamp() {
        return new Date().toISOString();
    }

    /**
     * Format log message
     * @param {string} level - Log level
     * @param {string} message - Log message
     * @param {Object} data - Additional data
     * @returns {string} - Formatted log message
     */
    formatMessage(level, message, data = null) {
        const timestamp = this.getTimestamp();
        const formattedMessage = `[${timestamp}] [${level}] ${message}`;
        
        if (data) {
            return `${formattedMessage} ${JSON.stringify(data)}`;
        }
        
        return formattedMessage;
    }

    /**
     * Write log to file
     * @param {string} level - Log level
     * @param {string} message - Log message
     */
    writeToFile(level, message) {
        try {
            const date = new Date().toISOString().split('T')[0];
            const logFile = path.join(this.logDir, `${date}.log`);
            const logEntry = `${message}\n`;
            
            fs.appendFileSync(logFile, logEntry);
        } catch (error) {
            console.error('Error writing to log file:', error);
        }
    }

    /**
     * Log error message
     * @param {string} message - Error message
     * @param {Object} data - Additional error data
     */
    static error(message, data = null) {
        const logger = new Logger();
        const formattedMessage = logger.formatMessage('ERROR', message, data);
        
        if (logger.currentLevel >= logger.logLevels.ERROR) {
            console.error(formattedMessage);
            logger.writeToFile('ERROR', formattedMessage);
        }
    }

    /**
     * Log warning message
     * @param {string} message - Warning message
     * @param {Object} data - Additional warning data
     */
    static warn(message, data = null) {
        const logger = new Logger();
        const formattedMessage = logger.formatMessage('WARN', message, data);
        
        if (logger.currentLevel >= logger.logLevels.WARN) {
            console.warn(formattedMessage);
            logger.writeToFile('WARN', formattedMessage);
        }
    }

    /**
     * Log info message
     * @param {string} message - Info message
     * @param {Object} data - Additional info data
     */
    static info(message, data = null) {
        const logger = new Logger();
        const formattedMessage = logger.formatMessage('INFO', message, data);
        
        if (logger.currentLevel >= logger.logLevels.INFO) {
            console.log(formattedMessage);
            logger.writeToFile('INFO', formattedMessage);
        }
    }

    /**
     * Log debug message
     * @param {string} message - Debug message
     * @param {Object} data - Additional debug data
     */
    static debug(message, data = null) {
        const logger = new Logger();
        const formattedMessage = logger.formatMessage('DEBUG', message, data);
        
        if (logger.currentLevel >= logger.logLevels.DEBUG) {
            console.debug(formattedMessage);
            logger.writeToFile('DEBUG', formattedMessage);
        }
    }

    /**
     * Set log level
     * @param {string} level - Log level (ERROR, WARN, INFO, DEBUG)
     */
    static setLevel(level) {
        const logger = new Logger();
        const upperLevel = level.toUpperCase();
        
        if (logger.logLevels[upperLevel] !== undefined) {
            logger.currentLevel = logger.logLevels[upperLevel];
            Logger.info(`Log level set to: ${upperLevel}`);
        } else {
            Logger.warn(`Invalid log level: ${level}. Using INFO.`);
        }
    }

    /**
     * Get current log level
     * @returns {string} - Current log level
     */
    static getLevel() {
        const logger = new Logger();
        const levels = Object.keys(logger.logLevels);
        return levels[logger.currentLevel];
    }

    /**
     * Log application startup
     */
    static startup() {
        Logger.info('=== Discord Bot Startup ===');
        Logger.info(`Node.js version: ${process.version}`);
        Logger.info(`Platform: ${process.platform}`);
        Logger.info(`Architecture: ${process.arch}`);
        Logger.info(`Working directory: ${process.cwd()}`);
        Logger.info(`Log level: ${Logger.getLevel()}`);
    }

    /**
     * Log application shutdown
     */
    static shutdown() {
        Logger.info('=== Discord Bot Shutdown ===');
        Logger.info('Application shutting down gracefully');
    }

    /**
     * Log job processing
     * @param {Object} job - Job object
     * @param {string} action - Action being performed
     */
    static jobProcess(job, action) {
        Logger.info(`Job ${action}: ${job.title}`, {
            jobId: job.id,
            upworkId: job.upworkId,
            score: job.score,
            category: job.category
        });
    }

    /**
     * Log profile operation
     * @param {Object} profile - Profile object
     * @param {string} action - Action being performed
     */
    static profileOperation(profile, action) {
        Logger.info(`Profile ${action}: ${profile.name}`, {
            profileId: profile.id,
            hourlyRate: profile.hourlyRate,
            skills: profile.skills?.length || 0
        });
    }

    /**
     * Log channel operation
     * @param {Object} channel - Channel object
     * @param {string} action - Action being performed
     */
    static channelOperation(channel, action) {
        Logger.info(`Channel ${action}: ${channel.name}`, {
            channelId: channel.id,
            discordId: channel.discordId,
            category: channel.category
        });
    }

    /**
     * Log API request
     * @param {string} method - HTTP method
     * @param {string} url - Request URL
     * @param {number} statusCode - Response status code
     * @param {number} responseTime - Response time in ms
     */
    static apiRequest(method, url, statusCode, responseTime) {
        const level = statusCode >= 400 ? 'ERROR' : 'INFO';
        Logger[level.toLowerCase()](`API ${method} ${url}`, {
            statusCode,
            responseTime: `${responseTime}ms`
        });
    }

    /**
     * Log database operation
     * @param {string} operation - Database operation
     * @param {string} table - Table name
     * @param {number} duration - Operation duration in ms
     */
    static databaseOperation(operation, table, duration) {
        Logger.debug(`Database ${operation} on ${table}`, {
            duration: `${duration}ms`
        });
    }

    /**
     * Log OpenAI operation
     * @param {string} operation - OpenAI operation
     * @param {number} tokens - Token usage
     * @param {number} duration - Operation duration in ms
     */
    static openaiOperation(operation, tokens, duration) {
        Logger.info(`OpenAI ${operation}`, {
            tokens,
            duration: `${duration}ms`
        });
    }

    /**
     * Log error with stack trace
     * @param {Error} error - Error object
     * @param {string} context - Error context
     */
    static errorWithStack(error, context = '') {
        const message = context ? `${context}: ${error.message}` : error.message;
        Logger.error(message, {
            stack: error.stack,
            name: error.name
        });
    }

    /**
     * Log performance metric
     * @param {string} metric - Metric name
     * @param {number} value - Metric value
     * @param {string} unit - Unit of measurement
     */
    static performance(metric, value, unit = 'ms') {
        Logger.info(`Performance: ${metric}`, {
            value: `${value}${unit}`
        });
    }

    /**
     * Log memory usage
     */
    static memoryUsage() {
        const usage = process.memoryUsage();
        Logger.debug('Memory usage', {
            rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
            heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
            external: `${Math.round(usage.external / 1024 / 1024)}MB`
        });
    }

    /**
     * Log uptime
     */
    static uptime() {
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        
        Logger.info('Application uptime', {
            uptime: `${hours}h ${minutes}m ${seconds}s`
        });
    }
}

module.exports = Logger; 