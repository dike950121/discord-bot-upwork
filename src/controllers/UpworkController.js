/**
 * Controller for handling Upwork job operations
 * Manages real-time job fetching, scoring, and distribution
 */

const cron = require('node-cron');
const Logger = require('../utils/Logger');

class UpworkController {
    constructor(upworkService, scoringService, jobModel) {
        this.upworkService = upworkService;
        this.scoringService = scoringService;
        this.jobModel = jobModel;
        this.monitoringInterval = null;
        this.isMonitoring = false;
    }

    /**
     * Start real-time job monitoring
     * Fetches jobs every 5 minutes and processes them
     */
    async startMonitoring() {
        if (this.isMonitoring) {
            Logger.warn('Job monitoring is already running');
            return;
        }

        this.isMonitoring = true;
        Logger.info('Starting Upwork job monitoring...');

        // Schedule job fetching every 5 minutes
        this.monitoringInterval = cron.schedule('*/5 * * * *', async () => {
            try {
                await this.fetchAndProcessJobs();
            } catch (error) {
                Logger.error('Error in job monitoring cycle:', error);
            }
        }, {
            scheduled: false
        });

        this.monitoringInterval.start();
        Logger.info('Upwork job monitoring started successfully');
    }

    /**
     * Stop job monitoring
     */
    stopMonitoring() {
        if (this.monitoringInterval) {
            this.monitoringInterval.stop();
            this.isMonitoring = false;
            Logger.info('Upwork job monitoring stopped');
        }
    }

    /**
     * Fetch and process new jobs from Upwork
     */
    async fetchAndProcessJobs() {
        Logger.info('Fetching new jobs from Upwork...');
        
        try {
            // Fetch jobs from Upwork
            const jobs = await this.upworkService.fetchJobs();
            
            if (!jobs || jobs.length === 0) {
                Logger.info('No new jobs found');
                return;
            }

            Logger.info(`Found ${jobs.length} new jobs, processing...`);

            // Process each job
            for (const job of jobs) {
                await this.processJob(job);
            }

            Logger.info('Job processing completed');
        } catch (error) {
            Logger.error('Error fetching and processing jobs:', error);
        }
    }

    /**
     * Process a single job
     * @param {Object} job - The job data from Upwork
     */
    async processJob(job) {
        try {
            // Check if job already exists
            const existingJob = await this.jobModel.findByUpworkId(job.upworkId);
            if (existingJob) {
                Logger.debug(`Job ${job.upworkId} already exists, skipping`);
                return;
            }

            // Score the job using OpenAI
            const score = await this.scoringService.scoreJob(job);
            job.score = score;

            // Categorize the job
            const category = await this.scoringService.categorizeJob(job);
            job.category = category;

            // Save job to database
            const savedJob = await this.jobModel.create(job);
            
            Logger.info(`Processed job: ${job.title} (Score: ${score}, Category: ${category})`);

            // Emit event for job processing (will be handled by ChannelController)
            this.emit('jobProcessed', savedJob);

        } catch (error) {
            Logger.error(`Error processing job ${job.upworkId}:`, error);
        }
    }

    /**
     * Manually fetch jobs (for testing or immediate processing)
     */
    async manualFetch() {
        Logger.info('Manual job fetch requested');
        await this.fetchAndProcessJobs();
    }

    /**
     * Get job statistics
     */
    async getJobStats() {
        try {
            const stats = await this.jobModel.getStats();
            return {
                totalJobs: stats.total,
                jobsByCategory: stats.byCategory,
                averageScore: stats.averageScore,
                lastFetch: stats.lastFetch
            };
        } catch (error) {
            Logger.error('Error getting job stats:', error);
            throw error;
        }
    }

    /**
     * Get jobs by category
     * @param {string} category - The job category
     */
    async getJobsByCategory(category) {
        try {
            return await this.jobModel.findByCategory(category);
        } catch (error) {
            Logger.error(`Error getting jobs by category ${category}:`, error);
            throw error;
        }
    }

    /**
     * Get high-scoring jobs
     * @param {number} minScore - Minimum score threshold
     */
    async getHighScoringJobs(minScore = 7) {
        try {
            return await this.jobModel.findByScore(minScore);
        } catch (error) {
            Logger.error(`Error getting high-scoring jobs:`, error);
            throw error;
        }
    }
}

module.exports = UpworkController; 