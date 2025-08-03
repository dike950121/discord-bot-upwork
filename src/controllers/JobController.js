/**
 * Controller for handling job operations
 * Manages job scoring, filtering, and analysis
 */

const Logger = require('../utils/Logger');

class JobController {
    constructor(jobModel, scoringService) {
        this.jobModel = jobModel;
        this.scoringService = scoringService;
    }

    /**
     * Get all jobs with optional filtering
     * @param {Object} filters - Filter options
     * @param {number} filters.minScore - Minimum score
     * @param {string} filters.category - Job category
     * @param {number} filters.limit - Number of jobs to return
     */
    async getJobs(filters = {}) {
        try {
            const jobs = await this.jobModel.findWithFilters(filters);
            return jobs;
        } catch (error) {
            Logger.error('Error getting jobs:', error);
            throw error;
        }
    }

    /**
     * Get a job by ID
     * @param {string} jobId - The job ID
     */
    async getJobById(jobId) {
        try {
            return await this.jobModel.findById(jobId);
        } catch (error) {
            Logger.error(`Error getting job ${jobId}:`, error);
            throw error;
        }
    }

    /**
     * Get jobs by category
     * @param {string} category - The job category
     * @param {number} limit - Number of jobs to return
     */
    async getJobsByCategory(category, limit = 50) {
        try {
            return await this.jobModel.findByCategory(category, limit);
        } catch (error) {
            Logger.error(`Error getting jobs by category ${category}:`, error);
            throw error;
        }
    }

    /**
     * Get high-scoring jobs
     * @param {number} minScore - Minimum score threshold
     * @param {number} limit - Number of jobs to return
     */
    async getHighScoringJobs(minScore = 7, limit = 50) {
        try {
            return await this.jobModel.findByScore(minScore, limit);
        } catch (error) {
            Logger.error(`Error getting high-scoring jobs:`, error);
            throw error;
        }
    }

    /**
     * Get recent jobs
     * @param {number} hours - Number of hours to look back
     * @param {number} limit - Number of jobs to return
     */
    async getRecentJobs(hours = 24, limit = 50) {
        try {
            const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
            return await this.jobModel.findByDateRange(cutoffDate, new Date(), limit);
        } catch (error) {
            Logger.error(`Error getting recent jobs:`, error);
            throw error;
        }
    }

    /**
     * Score a job using OpenAI
     * @param {Object} job - The job data
     */
    async scoreJob(job) {
        try {
            const score = await this.scoringService.scoreJob(job);
            
            // Update job with new score
            await this.jobModel.update(job.id, { score });
            
            Logger.info(`Job ${job.title} scored: ${score}`);
            return score;
        } catch (error) {
            Logger.error(`Error scoring job ${job.id}:`, error);
            throw error;
        }
    }

    /**
     * Categorize a job using OpenAI
     * @param {Object} job - The job data
     */
    async categorizeJob(job) {
        try {
            const category = await this.scoringService.categorizeJob(job);
            
            // Update job with new category
            await this.jobModel.update(job.id, { category });
            
            Logger.info(`Job ${job.title} categorized as: ${category}`);
            return category;
        } catch (error) {
            Logger.error(`Error categorizing job ${job.id}:`, error);
            throw error;
        }
    }

    /**
     * Analyze job requirements and extract key information
     * @param {Object} job - The job data
     */
    async analyzeJob(job) {
        try {
            const analysis = await this.scoringService.analyzeJob(job);
            
            // Update job with analysis results
            await this.jobModel.update(job.id, { 
                analysis,
                skills: analysis.skills,
                experience: analysis.experience,
                budget: analysis.budget
            });
            
            Logger.info(`Job ${job.title} analyzed successfully`);
            return analysis;
        } catch (error) {
            Logger.error(`Error analyzing job ${job.id}:`, error);
            throw error;
        }
    }

    /**
     * Get job statistics
     */
    async getJobStats() {
        try {
            const stats = await this.jobModel.getStats();
            return {
                totalJobs: stats.total,
                averageScore: stats.averageScore,
                jobsByCategory: stats.byCategory,
                jobsByScore: stats.byScore,
                recentJobs: stats.recent
            };
        } catch (error) {
            Logger.error('Error getting job stats:', error);
            throw error;
        }
    }

    /**
     * Search jobs by keyword
     * @param {string} keyword - Search keyword
     * @param {number} limit - Number of results to return
     */
    async searchJobs(keyword, limit = 50) {
        try {
            return await this.jobModel.search(keyword, limit);
        } catch (error) {
            Logger.error(`Error searching jobs with keyword "${keyword}":`, error);
            throw error;
        }
    }

    /**
     * Get jobs with specific skills
     * @param {Array} skills - Required skills
     * @param {number} limit - Number of jobs to return
     */
    async getJobsBySkills(skills, limit = 50) {
        try {
            return await this.jobModel.findBySkills(skills, limit);
        } catch (error) {
            Logger.error(`Error getting jobs by skills:`, error);
            throw error;
        }
    }

    /**
     * Get jobs within budget range
     * @param {number} minBudget - Minimum budget
     * @param {number} maxBudget - Maximum budget
     * @param {number} limit - Number of jobs to return
     */
    async getJobsByBudget(minBudget, maxBudget, limit = 50) {
        try {
            return await this.jobModel.findByBudget(minBudget, maxBudget, limit);
        } catch (error) {
            Logger.error(`Error getting jobs by budget:`, error);
            throw error;
        }
    }

    /**
     * Mark a job as applied
     * @param {string} jobId - The job ID
     */
    async markJobAsApplied(jobId) {
        try {
            await this.jobModel.update(jobId, { 
                applied: true,
                appliedAt: new Date()
            });
            
            Logger.info(`Job ${jobId} marked as applied`);
            return true;
        } catch (error) {
            Logger.error(`Error marking job ${jobId} as applied:`, error);
            throw error;
        }
    }

    /**
     * Mark a job as saved
     * @param {string} jobId - The job ID
     */
    async markJobAsSaved(jobId) {
        try {
            await this.jobModel.update(jobId, { 
                saved: true,
                savedAt: new Date()
            });
            
            Logger.info(`Job ${jobId} marked as saved`);
            return true;
        } catch (error) {
            Logger.error(`Error marking job ${jobId} as saved:`, error);
            throw error;
        }
    }

    /**
     * Get applied jobs
     * @param {number} limit - Number of jobs to return
     */
    async getAppliedJobs(limit = 50) {
        try {
            return await this.jobModel.findApplied(limit);
        } catch (error) {
            Logger.error('Error getting applied jobs:', error);
            throw error;
        }
    }

    /**
     * Get saved jobs
     * @param {number} limit - Number of jobs to return
     */
    async getSavedJobs(limit = 50) {
        try {
            return await this.jobModel.findSaved(limit);
        } catch (error) {
            Logger.error('Error getting saved jobs:', error);
            throw error;
        }
    }

    /**
     * Delete a job
     * @param {string} jobId - The job ID
     */
    async deleteJob(jobId) {
        try {
            await this.jobModel.delete(jobId);
            
            Logger.info(`Job ${jobId} deleted`);
            return true;
        } catch (error) {
            Logger.error(`Error deleting job ${jobId}:`, error);
            throw error;
        }
    }

    /**
     * Bulk update job scores
     * @param {Array} jobIds - Array of job IDs to update
     */
    async bulkUpdateScores(jobIds) {
        try {
            const jobs = await this.jobModel.findByIds(jobIds);
            const updatedJobs = [];

            for (const job of jobs) {
                const score = await this.scoringService.scoreJob(job);
                await this.jobModel.update(job.id, { score });
                updatedJobs.push({ ...job, score });
            }

            Logger.info(`Updated scores for ${updatedJobs.length} jobs`);
            return updatedJobs;
        } catch (error) {
            Logger.error('Error bulk updating job scores:', error);
            throw error;
        }
    }
}

module.exports = JobController; 