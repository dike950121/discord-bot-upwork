/**
 * Controller for handling user profile operations
 * Manages multiple profiles, profile matching, and profile scoring
 */

const Logger = require('../utils/Logger');

class ProfileController {
    constructor(profileModel) {
        this.profileModel = profileModel;
    }

    /**
     * Create a new profile
     * @param {Object} profileData - The profile data
     * @param {string} profileData.name - Profile name
     * @param {string} profileData.description - Profile description
     * @param {Array} profileData.skills - Array of skills
     * @param {Object} profileData.experience - Experience details
     * @param {number} profileData.hourlyRate - Hourly rate
     */
    async createProfile(profileData) {
        try {
            // Validate profile data
            this.validateProfileData(profileData);

            // Create profile
            const profile = await this.profileModel.create(profileData);
            
            Logger.info(`Profile created: ${profile.name}`);
            return profile;
        } catch (error) {
            Logger.error('Error creating profile:', error);
            throw error;
        }
    }

    /**
     * Update an existing profile
     * @param {string} profileId - The profile ID
     * @param {Object} updateData - The update data
     */
    async updateProfile(profileId, updateData) {
        try {
            const profile = await this.profileModel.update(profileId, updateData);
            
            Logger.info(`Profile updated: ${profile.name}`);
            return profile;
        } catch (error) {
            Logger.error(`Error updating profile ${profileId}:`, error);
            throw error;
        }
    }

    /**
     * Delete a profile
     * @param {string} profileId - The profile ID
     */
    async deleteProfile(profileId) {
        try {
            await this.profileModel.delete(profileId);
            
            Logger.info(`Profile deleted: ${profileId}`);
            return true;
        } catch (error) {
            Logger.error(`Error deleting profile ${profileId}:`, error);
            throw error;
        }
    }

    /**
     * Get all profiles
     */
    async getAllProfiles() {
        try {
            return await this.profileModel.findAll();
        } catch (error) {
            Logger.error('Error getting all profiles:', error);
            throw error;
        }
    }

    /**
     * Get a profile by ID
     * @param {string} profileId - The profile ID
     */
    async getProfileById(profileId) {
        try {
            return await this.profileModel.findById(profileId);
        } catch (error) {
            Logger.error(`Error getting profile ${profileId}:`, error);
            throw error;
        }
    }

    /**
     * Get a profile by name
     * @param {string} name - The profile name
     */
    async getProfileByName(name) {
        try {
            return await this.profileModel.findByName(name);
        } catch (error) {
            Logger.error(`Error getting profile by name ${name}:`, error);
            throw error;
        }
    }

    /**
     * Find the best matching profile for a job
     * @param {Object} job - The job data
     */
    async findBestMatchingProfile(job) {
        try {
            const profiles = await this.getAllProfiles();
            
            if (profiles.length === 0) {
                Logger.warn('No profiles available for matching');
                return null;
            }

            let bestMatch = null;
            let bestScore = 0;

            for (const profile of profiles) {
                const matchScore = this.calculateProfileJobMatch(profile, job);
                
                if (matchScore > bestScore) {
                    bestScore = matchScore;
                    bestMatch = profile;
                }
            }

            Logger.info(`Best profile match for job ${job.title}: ${bestMatch?.name} (Score: ${bestScore})`);
            return { profile: bestMatch, score: bestScore };
        } catch (error) {
            Logger.error('Error finding best matching profile:', error);
            throw error;
        }
    }

    /**
     * Calculate match score between a profile and a job
     * @param {Object} profile - The profile data
     * @param {Object} job - The job data
     */
    calculateProfileJobMatch(profile, job) {
        let score = 0;
        
        // Skill matching (40% weight)
        const skillMatch = this.calculateSkillMatch(profile.skills, job.skills);
        score += skillMatch * 0.4;
        
        // Experience level matching (30% weight)
        const experienceMatch = this.calculateExperienceMatch(profile.experience, job.experience);
        score += experienceMatch * 0.3;
        
        // Rate matching (20% weight)
        const rateMatch = this.calculateRateMatch(profile.hourlyRate, job.budget);
        score += rateMatch * 0.2;
        
        // Category matching (10% weight)
        const categoryMatch = this.calculateCategoryMatch(profile.categories, job.category);
        score += categoryMatch * 0.1;
        
        return Math.min(score, 10); // Cap at 10
    }

    /**
     * Calculate skill match between profile and job
     * @param {Array} profileSkills - Profile skills
     * @param {Array} jobSkills - Job required skills
     */
    calculateSkillMatch(profileSkills, jobSkills) {
        if (!profileSkills || !jobSkills) return 0;
        
        const profileSkillSet = new Set(profileSkills.map(s => s.toLowerCase()));
        const jobSkillSet = new Set(jobSkills.map(s => s.toLowerCase()));
        
        const matches = [...jobSkillSet].filter(skill => profileSkillSet.has(skill));
        const matchPercentage = matches.length / jobSkillSet.size;
        
        return matchPercentage * 10; // Scale to 0-10
    }

    /**
     * Calculate experience level match
     * @param {Object} profileExperience - Profile experience
     * @param {string} jobExperience - Job experience requirement
     */
    calculateExperienceMatch(profileExperience, jobExperience) {
        // Simple matching logic - can be enhanced
        const experienceLevels = {
            'entry': 1,
            'intermediate': 2,
            'expert': 3
        };
        
        const profileLevel = experienceLevels[profileExperience.level] || 1;
        const jobLevel = experienceLevels[jobExperience] || 1;
        
        const difference = Math.abs(profileLevel - jobLevel);
        return Math.max(0, 10 - difference * 3); // Higher score for closer matches
    }

    /**
     * Calculate rate match
     * @param {number} profileRate - Profile hourly rate
     * @param {Object} jobBudget - Job budget
     */
    calculateRateMatch(profileRate, jobBudget) {
        if (!jobBudget || !profileRate) return 5; // Neutral score
        
        const budgetRange = {
            min: jobBudget.min || 0,
            max: jobBudget.max || profileRate * 2
        };
        
        if (profileRate >= budgetRange.min && profileRate <= budgetRange.max) {
            return 10; // Perfect match
        } else if (profileRate < budgetRange.min) {
            return Math.max(0, 10 - (budgetRange.min - profileRate) / 10);
        } else {
            return Math.max(0, 10 - (profileRate - budgetRange.max) / 10);
        }
    }

    /**
     * Calculate category match
     * @param {Array} profileCategories - Profile categories
     * @param {string} jobCategory - Job category
     */
    calculateCategoryMatch(profileCategories, jobCategory) {
        if (!profileCategories || !jobCategory) return 5;
        
        const profileCategorySet = new Set(profileCategories.map(c => c.toLowerCase()));
        return profileCategorySet.has(jobCategory.toLowerCase()) ? 10 : 0;
    }

    /**
     * Validate profile data
     * @param {Object} profileData - The profile data to validate
     */
    validateProfileData(profileData) {
        if (!profileData.name || typeof profileData.name !== 'string') {
            throw new Error('Profile name is required and must be a string');
        }
        
        if (!profileData.description || typeof profileData.description !== 'string') {
            throw new Error('Profile description is required and must be a string');
        }
        
        if (!Array.isArray(profileData.skills) || profileData.skills.length === 0) {
            throw new Error('Profile must have at least one skill');
        }
        
        if (!profileData.experience || typeof profileData.experience !== 'object') {
            throw new Error('Profile experience is required');
        }
        
        if (typeof profileData.hourlyRate !== 'number' || profileData.hourlyRate <= 0) {
            throw new Error('Profile hourly rate must be a positive number');
        }
    }

    /**
     * Get profile statistics
     */
    async getProfileStats() {
        try {
            const stats = await this.profileModel.getStats();
            return {
                totalProfiles: stats.total,
                averageRate: stats.averageRate,
                skillDistribution: stats.skillDistribution,
                categoryDistribution: stats.categoryDistribution
            };
        } catch (error) {
            Logger.error('Error getting profile stats:', error);
            throw error;
        }
    }
}

module.exports = ProfileController; 