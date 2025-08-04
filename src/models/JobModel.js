/**
 * Model for managing job data using Mongoose
 * Handles job CRUD operations and database interactions
 */

const mongoose = require('mongoose');
const JobSchema = require('./schemas/JobSchema');
const Logger = require('../utils/Logger');

class JobModel {
    constructor() {
        this.Job = mongoose.model('Job', JobSchema);
    }

    /**
     * Create a new job
     * @param {Object} jobData - Job data
     * @returns {Object} - Created job
     */
    async create(jobData) {
        try {
            const job = new this.Job(jobData);
            const savedJob = await job.save();
            
            Logger.info(`Created job: ${savedJob.title} (ID: ${savedJob._id})`);
            return savedJob;
        } catch (error) {
            Logger.error('Error creating job:', error);
            throw error;
        }
    }

    /**
     * Find job by ID
     * @param {string} id - Job ID
     * @returns {Object|null} - Job object or null
     */
    async findById(id) {
        try {
            const job = await this.Job.findById(id);
            return job;
        } catch (error) {
            Logger.error(`Error finding job by ID ${id}:`, error);
            throw error;
        }
    }

    /**
     * Find job by Upwork ID
     * @param {string} upworkId - Upwork job ID
     * @returns {Object|null} - Job object or null
     */
    async findByUpworkId(upworkId) {
        try {
            const job = await this.Job.findOne({ upworkId });
            return job;
        } catch (error) {
            Logger.error(`Error finding job by Upwork ID ${upworkId}:`, error);
            throw error;
        }
    }

    /**
     * Update a job
     * @param {string} id - Job ID
     * @param {Object} updateData - Update data
     * @returns {Object} - Updated job
     */
    async update(id, updateData) {
        try {
            const updatedJob = await this.Job.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            );
            
            if (updatedJob) {
                Logger.info(`Updated job: ${updatedJob.title} (ID: ${id})`);
            }
            
            return updatedJob;
        } catch (error) {
            Logger.error(`Error updating job ${id}:`, error);
            throw error;
        }
    }

    /**
     * Delete a job
     * @param {string} id - Job ID
     * @returns {boolean} - Success status
     */
    async delete(id) {
        try {
            const result = await this.Job.findByIdAndDelete(id);
            const success = result !== null;
            
            if (success) {
                Logger.info(`Deleted job with ID: ${id}`);
            }
            
            return success;
        } catch (error) {
            Logger.error(`Error deleting job ${id}:`, error);
            throw error;
        }
    }

    /**
     * Find jobs with filters
     * @param {Object} filters - Filter options
     * @returns {Array} - Array of jobs
     */
    async findWithFilters(filters = {}) {
        try {
            const query = {};
            
            if (filters.minScore !== undefined) {
                query.score = { $gte: filters.minScore };
            }
            
            if (filters.category) {
                query.category = filters.category;
            }
            
            if (filters.applied !== undefined) {
                query.applied = filters.applied;
            }
            
            if (filters.saved !== undefined) {
                query.saved = filters.saved;
            }
            
            let queryBuilder = this.Job.find(query).sort({ createdAt: -1 });
            
            if (filters.limit) {
                queryBuilder = queryBuilder.limit(filters.limit);
            }
            
            const jobs = await queryBuilder;
            return jobs;
        } catch (error) {
            Logger.error('Error finding jobs with filters:', error);
            throw error;
        }
    }

    /**
     * Find jobs by category
     * @param {string} category - Job category
     * @param {number} limit - Number of jobs to return
     * @returns {Array} - Array of jobs
     */
    async findByCategory(category, limit = 50) {
        try {
            const jobs = await this.Job.findByCategory(category, limit);
            return jobs;
        } catch (error) {
            Logger.error(`Error finding jobs by category ${category}:`, error);
            throw error;
        }
    }

    /**
     * Find jobs by score
     * @param {number} minScore - Minimum score
     * @param {number} limit - Number of jobs to return
     * @returns {Array} - Array of jobs
     */
    async findByScore(minScore, limit = 50) {
        try {
            const jobs = await this.Job.find({ score: { $gte: minScore } })
                .sort({ score: -1, createdAt: -1 })
                .limit(limit);
            return jobs;
        } catch (error) {
            Logger.error(`Error finding jobs by score >= ${minScore}:`, error);
            throw error;
        }
    }

    /**
     * Find jobs by date range
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @param {number} limit - Number of jobs to return
     * @returns {Array} - Array of jobs
     */
    async findByDateRange(startDate, endDate, limit = 50) {
        try {
            const jobs = await this.Job.find({
                createdAt: { $gte: startDate, $lte: endDate }
            })
            .sort({ createdAt: -1 })
            .limit(limit);
            
            return jobs;
        } catch (error) {
            Logger.error('Error finding jobs by date range:', error);
            throw error;
        }
    }

    /**
     * Search jobs by keyword
     * @param {string} keyword - Search keyword
     * @param {number} limit - Number of jobs to return
     * @returns {Array} - Array of jobs
     */
    async search(keyword, limit = 50) {
        try {
            const jobs = await this.Job.search(keyword, limit);
            return jobs;
        } catch (error) {
            Logger.error(`Error searching jobs with keyword "${keyword}":`, error);
            throw error;
        }
    }

    /**
     * Find jobs by skills
     * @param {Array} skills - Required skills
     * @param {number} limit - Number of jobs to return
     * @returns {Array} - Array of jobs
     */
    async findBySkills(skills, limit = 50) {
        try {
            const jobs = await this.Job.findBySkills(skills, limit);
            return jobs;
        } catch (error) {
            Logger.error('Error finding jobs by skills:', error);
            throw error;
        }
    }

    /**
     * Find jobs by budget range
     * @param {number} minBudget - Minimum budget
     * @param {number} maxBudget - Maximum budget
     * @param {number} limit - Number of jobs to return
     * @returns {Array} - Array of jobs
     */
    async findByBudget(minBudget, maxBudget, limit = 50) {
        try {
            const jobs = await this.Job.find({
                $or: [
                    { 'budget.min': { $gte: minBudget, $lte: maxBudget } },
                    { 'budget.max': { $gte: minBudget, $lte: maxBudget } }
                ]
            })
            .sort({ createdAt: -1 })
            .limit(limit);
            
            return jobs;
        } catch (error) {
            Logger.error('Error finding jobs by budget:', error);
            throw error;
        }
    }

    /**
     * Find applied jobs
     * @param {number} limit - Number of jobs to return
     * @returns {Array} - Array of jobs
     */
    async findApplied(limit = 50) {
        try {
            const jobs = await this.Job.find({ applied: true })
                .sort({ appliedAt: -1 })
                .limit(limit);
            return jobs;
        } catch (error) {
            Logger.error('Error finding applied jobs:', error);
            throw error;
        }
    }

    /**
     * Find saved jobs
     * @param {number} limit - Number of jobs to return
     * @returns {Array} - Array of jobs
     */
    async findSaved(limit = 50) {
        try {
            const jobs = await this.Job.find({ saved: true })
                .sort({ savedAt: -1 })
                .limit(limit);
            return jobs;
        } catch (error) {
            Logger.error('Error finding saved jobs:', error);
            throw error;
        }
    }

    /**
     * Find jobs by IDs
     * @param {Array} ids - Array of job IDs
     * @returns {Array} - Array of jobs
     */
    async findByIds(ids) {
        try {
            if (ids.length === 0) return [];
            
            const jobs = await this.Job.find({
                _id: { $in: ids }
            });
            return jobs;
        } catch (error) {
            Logger.error('Error finding jobs by IDs:', error);
            throw error;
        }
    }

    /**
     * Mark job as applied
     * @param {string} id - Job ID
     * @returns {Object} - Updated job
     */
    async markAsApplied(id) {
        try {
            const job = await this.Job.findById(id);
            if (job) {
                await job.markAsApplied();
                Logger.info(`Marked job as applied: ${job.title} (ID: ${id})`);
            }
            return job;
        } catch (error) {
            Logger.error(`Error marking job as applied ${id}:`, error);
            throw error;
        }
    }

    /**
     * Mark job as saved
     * @param {string} id - Job ID
     * @returns {Object} - Updated job
     */
    async markAsSaved(id) {
        try {
            const job = await this.Job.findById(id);
            if (job) {
                await job.markAsSaved();
                Logger.info(`Marked job as saved: ${job.title} (ID: ${id})`);
            }
            return job;
        } catch (error) {
            Logger.error(`Error marking job as saved ${id}:`, error);
            throw error;
        }
    }

    /**
     * Update job score
     * @param {string} id - Job ID
     * @param {number} score - New score
     * @returns {Object} - Updated job
     */
    async updateScore(id, score) {
        try {
            const job = await this.Job.findById(id);
            if (job) {
                await job.updateScore(score);
                Logger.info(`Updated job score: ${job.title} (ID: ${id}, Score: ${score})`);
            }
            return job;
        } catch (error) {
            Logger.error(`Error updating job score ${id}:`, error);
            throw error;
        }
    }

    /**
     * Get job statistics
     * @returns {Object} - Statistics object
     */
    async getStats() {
        try {
            const stats = await this.Job.getStats();
            return stats;
        } catch (error) {
            Logger.error('Error getting job stats:', error);
            throw error;
        }
    }

    /**
     * Get all jobs
     * @param {number} limit - Number of jobs to return
     * @returns {Array} - Array of jobs
     */
    async findAll(limit = 100) {
        try {
            const jobs = await this.Job.find()
                .sort({ createdAt: -1 })
                .limit(limit);
            return jobs;
        } catch (error) {
            Logger.error('Error finding all jobs:', error);
            throw error;
        }
    }

    /**
     * Count total jobs
     * @returns {number} - Total job count
     */
    async count() {
        try {
            return await this.Job.countDocuments();
        } catch (error) {
            Logger.error('Error counting jobs:', error);
            throw error;
        }
    }

    /**
     * Delete all jobs
     * @returns {number} - Number of deleted jobs
     */
    async deleteAll() {
        try {
            const result = await this.Job.deleteMany({});
            Logger.info(`Deleted ${result.deletedCount} jobs`);
            return result.deletedCount;
        } catch (error) {
            Logger.error('Error deleting all jobs:', error);
            throw error;
        }
    }
}

module.exports = JobModel; 