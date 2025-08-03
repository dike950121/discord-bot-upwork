/**
 * Model for managing job data
 * Handles job CRUD operations and database interactions
 */

const Logger = require('../utils/Logger');

class JobModel {
    constructor(database) {
        this.database = database;
        this.tableName = 'jobs';
        this.initTable();
    }

    /**
     * Initialize the jobs table
     */
    async initTable() {
        try {
            const createTableSQL = `
                CREATE TABLE IF NOT EXISTS ${this.tableName} (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    upworkId TEXT UNIQUE NOT NULL,
                    title TEXT NOT NULL,
                    description TEXT,
                    url TEXT,
                    budget TEXT,
                    skills TEXT,
                    category TEXT,
                    score REAL DEFAULT 0,
                    location TEXT,
                    clientInfo TEXT,
                    experience TEXT,
                    applied BOOLEAN DEFAULT FALSE,
                    saved BOOLEAN DEFAULT FALSE,
                    appliedAt DATETIME,
                    savedAt DATETIME,
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `;
            
            await this.database.run(createTableSQL);
            Logger.info('Jobs table initialized');
        } catch (error) {
            Logger.error('Error initializing jobs table:', error);
            throw error;
        }
    }

    /**
     * Create a new job
     * @param {Object} jobData - Job data
     * @returns {Object} - Created job
     */
    async create(jobData) {
        try {
            const sql = `
                INSERT INTO ${this.tableName} (
                    upworkId, title, description, url, budget, skills, 
                    category, score, location, clientInfo, experience
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const params = [
                jobData.upworkId,
                jobData.title,
                jobData.description,
                jobData.url,
                JSON.stringify(jobData.budget),
                JSON.stringify(jobData.skills),
                jobData.category,
                jobData.score || 0,
                jobData.location,
                jobData.clientInfo,
                jobData.experience
            ];
            
            const result = await this.database.run(sql, params);
            const job = await this.findById(result.lastID);
            
            Logger.info(`Created job: ${job.title} (ID: ${job.id})`);
            return job;
        } catch (error) {
            Logger.error('Error creating job:', error);
            throw error;
        }
    }

    /**
     * Find job by ID
     * @param {number} id - Job ID
     * @returns {Object|null} - Job object or null
     */
    async findById(id) {
        try {
            const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
            const job = await this.database.get(sql, [id]);
            
            if (job) {
                return this.parseJob(job);
            }
            
            return null;
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
            const sql = `SELECT * FROM ${this.tableName} WHERE upworkId = ?`;
            const job = await this.database.get(sql, [upworkId]);
            
            if (job) {
                return this.parseJob(job);
            }
            
            return null;
        } catch (error) {
            Logger.error(`Error finding job by Upwork ID ${upworkId}:`, error);
            throw error;
        }
    }

    /**
     * Update a job
     * @param {number} id - Job ID
     * @param {Object} updateData - Update data
     * @returns {Object} - Updated job
     */
    async update(id, updateData) {
        try {
            const fields = [];
            const values = [];
            
            Object.keys(updateData).forEach(key => {
                if (key === 'budget' || key === 'skills') {
                    fields.push(`${key} = ?`);
                    values.push(JSON.stringify(updateData[key]));
                } else {
                    fields.push(`${key} = ?`);
                    values.push(updateData[key]);
                }
            });
            
            fields.push('updatedAt = CURRENT_TIMESTAMP');
            values.push(id);
            
            const sql = `UPDATE ${this.tableName} SET ${fields.join(', ')} WHERE id = ?`;
            await this.database.run(sql, values);
            
            const updatedJob = await this.findById(id);
            Logger.info(`Updated job: ${updatedJob.title} (ID: ${id})`);
            return updatedJob;
        } catch (error) {
            Logger.error(`Error updating job ${id}:`, error);
            throw error;
        }
    }

    /**
     * Delete a job
     * @param {number} id - Job ID
     * @returns {boolean} - Success status
     */
    async delete(id) {
        try {
            const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
            const result = await this.database.run(sql, [id]);
            
            Logger.info(`Deleted job with ID: ${id}`);
            return result.changes > 0;
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
            let sql = `SELECT * FROM ${this.tableName}`;
            const conditions = [];
            const values = [];
            
            if (filters.minScore !== undefined) {
                conditions.push('score >= ?');
                values.push(filters.minScore);
            }
            
            if (filters.category) {
                conditions.push('category = ?');
                values.push(filters.category);
            }
            
            if (filters.applied !== undefined) {
                conditions.push('applied = ?');
                values.push(filters.applied);
            }
            
            if (filters.saved !== undefined) {
                conditions.push('saved = ?');
                values.push(filters.saved);
            }
            
            if (conditions.length > 0) {
                sql += ` WHERE ${conditions.join(' AND ')}`;
            }
            
            sql += ` ORDER BY createdAt DESC`;
            
            if (filters.limit) {
                sql += ` LIMIT ?`;
                values.push(filters.limit);
            }
            
            const jobs = await this.database.all(sql, values);
            return jobs.map(job => this.parseJob(job));
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
            const sql = `
                SELECT * FROM ${this.tableName} 
                WHERE category = ? 
                ORDER BY createdAt DESC 
                LIMIT ?
            `;
            
            const jobs = await this.database.all(sql, [category, limit]);
            return jobs.map(job => this.parseJob(job));
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
            const sql = `
                SELECT * FROM ${this.tableName} 
                WHERE score >= ? 
                ORDER BY score DESC, createdAt DESC 
                LIMIT ?
            `;
            
            const jobs = await this.database.all(sql, [minScore, limit]);
            return jobs.map(job => this.parseJob(job));
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
            const sql = `
                SELECT * FROM ${this.tableName} 
                WHERE createdAt BETWEEN ? AND ? 
                ORDER BY createdAt DESC 
                LIMIT ?
            `;
            
            const jobs = await this.database.all(sql, [startDate, endDate, limit]);
            return jobs.map(job => this.parseJob(job));
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
            const sql = `
                SELECT * FROM ${this.tableName} 
                WHERE title LIKE ? OR description LIKE ? 
                ORDER BY createdAt DESC 
                LIMIT ?
            `;
            
            const searchTerm = `%${keyword}%`;
            const jobs = await this.database.all(sql, [searchTerm, searchTerm, limit]);
            return jobs.map(job => this.parseJob(job));
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
            const conditions = skills.map(() => 'skills LIKE ?').join(' OR ');
            const sql = `
                SELECT * FROM ${this.tableName} 
                WHERE ${conditions} 
                ORDER BY createdAt DESC 
                LIMIT ?
            `;
            
            const searchTerms = skills.map(skill => `%${skill}%`);
            const jobs = await this.database.all(sql, [...searchTerms, limit]);
            return jobs.map(job => this.parseJob(job));
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
            const sql = `
                SELECT * FROM ${this.tableName} 
                WHERE budget LIKE '%"min":${minBudget}%' 
                OR budget LIKE '%"max":${maxBudget}%' 
                ORDER BY createdAt DESC 
                LIMIT ?
            `;
            
            const jobs = await this.database.all(sql, [limit]);
            return jobs.map(job => this.parseJob(job));
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
            const sql = `
                SELECT * FROM ${this.tableName} 
                WHERE applied = TRUE 
                ORDER BY appliedAt DESC 
                LIMIT ?
            `;
            
            const jobs = await this.database.all(sql, [limit]);
            return jobs.map(job => this.parseJob(job));
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
            const sql = `
                SELECT * FROM ${this.tableName} 
                WHERE saved = TRUE 
                ORDER BY savedAt DESC 
                LIMIT ?
            `;
            
            const jobs = await this.database.all(sql, [limit]);
            return jobs.map(job => this.parseJob(job));
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
            
            const placeholders = ids.map(() => '?').join(',');
            const sql = `SELECT * FROM ${this.tableName} WHERE id IN (${placeholders})`;
            
            const jobs = await this.database.all(sql, ids);
            return jobs.map(job => this.parseJob(job));
        } catch (error) {
            Logger.error('Error finding jobs by IDs:', error);
            throw error;
        }
    }

    /**
     * Get job statistics
     * @returns {Object} - Statistics object
     */
    async getStats() {
        try {
            const stats = {};
            
            // Total jobs
            const totalResult = await this.database.get(`SELECT COUNT(*) as total FROM ${this.tableName}`);
            stats.total = totalResult.total;
            
            // Average score
            const avgResult = await this.database.get(`SELECT AVG(score) as average FROM ${this.tableName}`);
            stats.averageScore = avgResult.average || 0;
            
            // Jobs by category
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
            
            // Jobs by score range
            const scoreResult = await this.database.all(`
                SELECT 
                    CASE 
                        WHEN score >= 8 THEN 'High (8-10)'
                        WHEN score >= 6 THEN 'Medium (6-7.9)'
                        WHEN score >= 4 THEN 'Low (4-5.9)'
                        ELSE 'Very Low (0-3.9)'
                    END as scoreRange,
                    COUNT(*) as count
                FROM ${this.tableName}
                GROUP BY scoreRange
                ORDER BY count DESC
            `);
            stats.byScore = scoreResult.reduce((acc, row) => {
                acc[row.scoreRange] = row.count;
                return acc;
            }, {});
            
            // Recent jobs (last 24 hours)
            const recentResult = await this.database.get(`
                SELECT COUNT(*) as count 
                FROM ${this.tableName} 
                WHERE createdAt >= datetime('now', '-1 day')
            `);
            stats.recent = recentResult.count;
            
            return stats;
        } catch (error) {
            Logger.error('Error getting job stats:', error);
            throw error;
        }
    }

    /**
     * Parse job data from database
     * @param {Object} job - Raw job data from database
     * @returns {Object} - Parsed job data
     */
    parseJob(job) {
        return {
            ...job,
            budget: job.budget ? JSON.parse(job.budget) : null,
            skills: job.skills ? JSON.parse(job.skills) : [],
            applied: Boolean(job.applied),
            saved: Boolean(job.saved),
            createdAt: new Date(job.createdAt),
            updatedAt: new Date(job.updatedAt),
            appliedAt: job.appliedAt ? new Date(job.appliedAt) : null,
            savedAt: job.savedAt ? new Date(job.savedAt) : null
        };
    }
}

module.exports = JobModel; 