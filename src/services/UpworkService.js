/**
 * Service for fetching jobs from Upwork
 * Handles real-time job scraping and data extraction
 */

const axios = require('axios');
const cheerio = require('cheerio');
const Logger = require('../utils/Logger');

class UpworkService {
    constructor() {
        this.baseUrl = 'https://www.upwork.com';
        this.searchUrl = 'https://www.upwork.com/ab/jobs/search';
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        };
        
        this.lastFetchTime = null;
        this.jobCache = new Map();
    }

    /**
     * Fetch jobs from Upwork
     * @param {Object} options - Fetch options
     * @param {number} options.limit - Number of jobs to fetch
     * @param {string} options.category - Job category filter
     * @param {number} options.minBudget - Minimum budget filter
     * @param {number} options.maxBudget - Maximum budget filter
     */
    async fetchJobs(options = {}) {
        try {
            Logger.info('Fetching jobs from Upwork...');
            
            const {
                limit = 50,
                category = null,
                minBudget = null,
                maxBudget = null,
                skills = []
            } = options;

            // Build search parameters
            const searchParams = this.buildSearchParams({
                limit,
                category,
                minBudget,
                maxBudget,
                skills
            });

            // Fetch job listings
            const response = await axios.get(this.searchUrl, {
                params: searchParams,
                headers: this.headers,
                timeout: 30000
            });

            if (response.status !== 200) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // Parse job listings
            const jobs = await this.parseJobListings(response.data);
            
            // Filter and process jobs
            const processedJobs = await this.processJobs(jobs, options);
            
            this.lastFetchTime = new Date();
            Logger.info(`Fetched ${processedJobs.length} jobs from Upwork`);
            
            return processedJobs;
        } catch (error) {
            Logger.error('Error fetching jobs from Upwork:', error);
            throw error;
        }
    }

    /**
     * Build search parameters for Upwork API
     * @param {Object} options - Search options
     */
    buildSearchParams(options) {
        const params = {
            sort: 'recency',
            page: 1,
            limit: options.limit || 50
        };

        // Add category filter
        if (options.category) {
            params.category = options.category;
        }

        // Add budget filters
        if (options.minBudget) {
            params.minBudget = options.minBudget;
        }
        if (options.maxBudget) {
            params.maxBudget = options.maxBudget;
        }

        // Add skills filter
        if (options.skills && options.skills.length > 0) {
            params.skills = options.skills.join(',');
        }

        return params;
    }

    /**
     * Parse job listings from HTML response
     * @param {string} html - HTML content
     */
    async parseJobListings(html) {
        try {
            const $ = cheerio.load(html);
            const jobs = [];

            // Parse job cards
            $('[data-test="job-tile"]').each((index, element) => {
                try {
                    const job = this.parseJobCard($, element);
                    if (job) {
                        jobs.push(job);
                    }
                } catch (error) {
                    Logger.error(`Error parsing job card ${index}:`, error);
                }
            });

            return jobs;
        } catch (error) {
            Logger.error('Error parsing job listings:', error);
            throw error;
        }
    }

    /**
     * Parse individual job card
     * @param {Object} $ - Cheerio object
     * @param {Object} element - Job card element
     */
    parseJobCard($, element) {
        try {
            const $card = $(element);
            
            // Extract basic job information
            const title = $card.find('[data-test="job-title"]').text().trim();
            const description = $card.find('[data-test="job-description"]').text().trim();
            const url = this.baseUrl + $card.find('a').attr('href');
            const upworkId = this.extractJobId(url);
            
            // Extract budget information
            const budgetText = $card.find('[data-test="budget"]').text().trim();
            const budget = this.parseBudget(budgetText);
            
            // Extract skills
            const skills = [];
            $card.find('[data-test="skills"] span').each((index, skillElement) => {
                const skill = $(skillElement).text().trim();
                if (skill) {
                    skills.push(skill);
                }
            });
            
            // Extract client information
            const clientInfo = $card.find('[data-test="client-info"]').text().trim();
            const location = $card.find('[data-test="location"]').text().trim();
            
            // Extract posting time
            const postedTime = $card.find('[data-test="posted-time"]').text().trim();
            const createdAt = this.parsePostedTime(postedTime);
            
            return {
                upworkId,
                title,
                description,
                url,
                budget,
                skills,
                clientInfo,
                location,
                createdAt,
                source: 'upwork'
            };
        } catch (error) {
            Logger.error('Error parsing job card:', error);
            return null;
        }
    }

    /**
     * Extract job ID from URL
     * @param {string} url - Job URL
     */
    extractJobId(url) {
        try {
            const match = url.match(/~([a-zA-Z0-9]+)/);
            return match ? match[1] : null;
        } catch (error) {
            Logger.error('Error extracting job ID:', error);
            return null;
        }
    }

    /**
     * Parse budget text into structured object
     * @param {string} budgetText - Budget text from job listing
     */
    parseBudget(budgetText) {
        try {
            if (!budgetText) return null;
            
            // Handle different budget formats
            const hourlyMatch = budgetText.match(/\$(\d+)-?\$?(\d+)?\s*\/hr/);
            const fixedMatch = budgetText.match(/\$(\d+)-?\$?(\d+)?\s*fixed/);
            const rangeMatch = budgetText.match(/\$(\d+)-?\$?(\d+)?/);
            
            if (hourlyMatch) {
                return {
                    type: 'hourly',
                    min: parseInt(hourlyMatch[1]),
                    max: hourlyMatch[2] ? parseInt(hourlyMatch[2]) : null
                };
            } else if (fixedMatch) {
                return {
                    type: 'fixed',
                    min: parseInt(fixedMatch[1]),
                    max: fixedMatch[2] ? parseInt(fixedMatch[2]) : null
                };
            } else if (rangeMatch) {
                return {
                    type: 'unknown',
                    min: parseInt(rangeMatch[1]),
                    max: rangeMatch[2] ? parseInt(rangeMatch[2]) : null
                };
            }
            
            return null;
        } catch (error) {
            Logger.error('Error parsing budget:', error);
            return null;
        }
    }

    /**
     * Parse posted time into Date object
     * @param {string} postedTime - Posted time text
     */
    parsePostedTime(postedTime) {
        try {
            if (!postedTime) return new Date();
            
            const now = new Date();
            
            // Handle different time formats
            if (postedTime.includes('hour')) {
                const hours = parseInt(postedTime.match(/(\d+)/)[1]);
                return new Date(now.getTime() - hours * 60 * 60 * 1000);
            } else if (postedTime.includes('day')) {
                const days = parseInt(postedTime.match(/(\d+)/)[1]);
                return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
            } else if (postedTime.includes('week')) {
                const weeks = parseInt(postedTime.match(/(\d+)/)[1]);
                return new Date(now.getTime() - weeks * 7 * 24 * 60 * 60 * 1000);
            }
            
            return new Date();
        } catch (error) {
            Logger.error('Error parsing posted time:', error);
            return new Date();
        }
    }

    /**
     * Process and filter jobs
     * @param {Array} jobs - Raw jobs array
     * @param {Object} options - Processing options
     */
    async processJobs(jobs, options = {}) {
        try {
            const processedJobs = [];
            
            for (const job of jobs) {
                try {
                    // Skip if job already exists in cache
                    if (this.jobCache.has(job.upworkId)) {
                        continue;
                    }
                    
                    // Apply filters
                    if (!this.applyFilters(job, options)) {
                        continue;
                    }
                    
                    // Add to cache
                    this.jobCache.set(job.upworkId, job);
                    
                    // Add to processed jobs
                    processedJobs.push(job);
                    
                    // Limit results
                    if (processedJobs.length >= (options.limit || 50)) {
                        break;
                    }
                } catch (error) {
                    Logger.error(`Error processing job ${job.upworkId}:`, error);
                }
            }
            
            return processedJobs;
        } catch (error) {
            Logger.error('Error processing jobs:', error);
            throw error;
        }
    }

    /**
     * Apply filters to job
     * @param {Object} job - Job object
     * @param {Object} filters - Filter options
     */
    applyFilters(job, filters) {
        try {
            // Category filter
            if (filters.category && job.category !== filters.category) {
                return false;
            }
            
            // Budget filters
            if (filters.minBudget && job.budget && job.budget.min < filters.minBudget) {
                return false;
            }
            if (filters.maxBudget && job.budget && job.budget.max > filters.maxBudget) {
                return false;
            }
            
            // Skills filter
            if (filters.skills && filters.skills.length > 0) {
                const jobSkills = job.skills.map(s => s.toLowerCase());
                const hasRequiredSkill = filters.skills.some(skill => 
                    jobSkills.includes(skill.toLowerCase())
                );
                if (!hasRequiredSkill) {
                    return false;
                }
            }
            
            return true;
        } catch (error) {
            Logger.error('Error applying filters:', error);
            return true; // Default to include if filter fails
        }
    }

    /**
     * Get job details by ID
     * @param {string} jobId - Upwork job ID
     */
    async getJobDetails(jobId) {
        try {
            const url = `${this.baseUrl}/jobs/~${jobId}`;
            
            const response = await axios.get(url, {
                headers: this.headers,
                timeout: 30000
            });
            
            if (response.status !== 200) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            // Parse detailed job information
            const jobDetails = await this.parseJobDetails(response.data, jobId);
            
            return jobDetails;
        } catch (error) {
            Logger.error(`Error fetching job details for ${jobId}:`, error);
            throw error;
        }
    }

    /**
     * Parse detailed job information
     * @param {string} html - HTML content
     * @param {string} jobId - Job ID
     */
    async parseJobDetails(html, jobId) {
        try {
            const $ = cheerio.load(html);
            
            const title = $('[data-test="job-title"]').text().trim();
            const description = $('[data-test="job-description"]').text().trim();
            const budget = this.parseBudget($('[data-test="budget"]').text().trim());
            const skills = [];
            
            $('[data-test="skills"] span').each((index, element) => {
                const skill = $(element).text().trim();
                if (skill) {
                    skills.push(skill);
                }
            });
            
            const clientInfo = $('[data-test="client-info"]').text().trim();
            const location = $('[data-test="location"]').text().trim();
            const experience = $('[data-test="experience-level"]').text().trim();
            
            return {
                upworkId: jobId,
                title,
                description,
                budget,
                skills,
                clientInfo,
                location,
                experience,
                url: `${this.baseUrl}/jobs/~${jobId}`,
                createdAt: new Date(),
                source: 'upwork'
            };
        } catch (error) {
            Logger.error('Error parsing job details:', error);
            throw error;
        }
    }

    /**
     * Clear job cache
     */
    clearCache() {
        this.jobCache.clear();
        Logger.info('Job cache cleared');
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.jobCache.size,
            lastFetch: this.lastFetchTime
        };
    }
}

module.exports = UpworkService; 