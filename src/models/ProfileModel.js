/**
 * Model for managing user profile data using Mongoose
 * Handles profile CRUD operations and database interactions
 */

const mongoose = require('mongoose');
const ProfileSchema = require('./schemas/ProfileSchema');
const Logger = require('../utils/Logger');

class ProfileModel {
    constructor() {
        this.Profile = mongoose.model('Profile', ProfileSchema);
    }

    /**
     * Create a new profile
     * @param {Object} profileData - Profile data
     * @returns {Object} - Created profile
     */
    async create(profileData) {
        try {
            const profile = new this.Profile(profileData);
            const savedProfile = await profile.save();
            
            Logger.info(`Created profile: ${savedProfile.name} (ID: ${savedProfile._id})`);
            return savedProfile;
        } catch (error) {
            Logger.error('Error creating profile:', error);
            throw error;
        }
    }

    /**
     * Find profile by ID
     * @param {string} id - Profile ID
     * @returns {Object|null} - Profile object or null
     */
    async findById(id) {
        try {
            const profile = await this.Profile.findById(id);
            return profile;
        } catch (error) {
            Logger.error(`Error finding profile by ID ${id}:`, error);
            throw error;
        }
    }

    /**
     * Find profile by name
     * @param {string} name - Profile name
     * @returns {Object|null} - Profile object or null
     */
    async findByName(name) {
        try {
            const profile = await this.Profile.findOne({ name });
            return profile;
        } catch (error) {
            Logger.error(`Error finding profile by name ${name}:`, error);
            throw error;
        }
    }

    /**
     * Update a profile
     * @param {string} id - Profile ID
     * @param {Object} updateData - Update data
     * @returns {Object} - Updated profile
     */
    async update(id, updateData) {
        try {
            const updatedProfile = await this.Profile.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            );
            
            if (updatedProfile) {
                Logger.info(`Updated profile: ${updatedProfile.name} (ID: ${id})`);
            }
            
            return updatedProfile;
        } catch (error) {
            Logger.error(`Error updating profile ${id}:`, error);
            throw error;
        }
    }

    /**
     * Delete a profile
     * @param {string} id - Profile ID
     * @returns {boolean} - Success status
     */
    async delete(id) {
        try {
            const result = await this.Profile.findByIdAndDelete(id);
            const success = result !== null;
            
            if (success) {
                Logger.info(`Deleted profile with ID: ${id}`);
            }
            
            return success;
        } catch (error) {
            Logger.error(`Error deleting profile ${id}:`, error);
            throw error;
        }
    }

    /**
     * Find all profiles
     * @returns {Array} - Array of profiles
     */
    async findAll() {
        try {
            const profiles = await this.Profile.find().sort({ name: 1 });
            return profiles;
        } catch (error) {
            Logger.error('Error finding all profiles:', error);
            throw error;
        }
    }

    /**
     * Find profiles by skills
     * @param {Array} skills - Required skills
     * @returns {Array} - Array of profiles
     */
    async findBySkills(skills) {
        try {
            const profiles = await this.Profile.findBySkills(skills);
            return profiles;
        } catch (error) {
            Logger.error('Error finding profiles by skills:', error);
            throw error;
        }
    }

    /**
     * Find profiles by category
     * @param {string} category - Profile category
     * @returns {Array} - Array of profiles
     */
    async findByCategory(category) {
        try {
            const profiles = await this.Profile.findByCategory(category);
            return profiles;
        } catch (error) {
            Logger.error(`Error finding profiles by category ${category}:`, error);
            throw error;
        }
    }

    /**
     * Find profiles by hourly rate range
     * @param {number} minRate - Minimum hourly rate
     * @param {number} maxRate - Maximum hourly rate
     * @returns {Array} - Array of profiles
     */
    async findByRateRange(minRate, maxRate) {
        try {
            const profiles = await this.Profile.findByRateRange(minRate, maxRate);
            return profiles;
        } catch (error) {
            Logger.error('Error finding profiles by rate range:', error);
            throw error;
        }
    }

    /**
     * Find profiles by experience level
     * @param {string} level - Experience level
     * @returns {Array} - Array of profiles
     */
    async findByExperienceLevel(level) {
        try {
            const profiles = await this.Profile.findByExperienceLevel(level);
            return profiles;
        } catch (error) {
            Logger.error(`Error finding profiles by experience level ${level}:`, error);
            throw error;
        }
    }

    /**
     * Search profiles
     * @param {string} keyword - Search keyword
     * @returns {Array} - Array of profiles
     */
    async search(keyword) {
        try {
            const profiles = await this.Profile.search(keyword);
            return profiles;
        } catch (error) {
            Logger.error(`Error searching profiles with keyword "${keyword}":`, error);
            throw error;
        }
    }

    /**
     * Add skill to profile
     * @param {string} id - Profile ID
     * @param {string} skill - Skill to add
     * @returns {Object} - Updated profile
     */
    async addSkill(id, skill) {
        try {
            const profile = await this.Profile.findById(id);
            if (profile) {
                await profile.addSkill(skill);
                Logger.info(`Added skill to profile: ${profile.name} (ID: ${id}, Skill: ${skill})`);
            }
            return profile;
        } catch (error) {
            Logger.error(`Error adding skill to profile ${id}:`, error);
            throw error;
        }
    }

    /**
     * Remove skill from profile
     * @param {string} id - Profile ID
     * @param {string} skill - Skill to remove
     * @returns {Object} - Updated profile
     */
    async removeSkill(id, skill) {
        try {
            const profile = await this.Profile.findById(id);
            if (profile) {
                await profile.removeSkill(skill);
                Logger.info(`Removed skill from profile: ${profile.name} (ID: ${id}, Skill: ${skill})`);
            }
            return profile;
        } catch (error) {
            Logger.error(`Error removing skill from profile ${id}:`, error);
            throw error;
        }
    }

    /**
     * Add category to profile
     * @param {string} id - Profile ID
     * @param {string} category - Category to add
     * @returns {Object} - Updated profile
     */
    async addCategory(id, category) {
        try {
            const profile = await this.Profile.findById(id);
            if (profile) {
                await profile.addCategory(category);
                Logger.info(`Added category to profile: ${profile.name} (ID: ${id}, Category: ${category})`);
            }
            return profile;
        } catch (error) {
            Logger.error(`Error adding category to profile ${id}:`, error);
            throw error;
        }
    }

    /**
     * Remove category from profile
     * @param {string} id - Profile ID
     * @param {string} category - Category to remove
     * @returns {Object} - Updated profile
     */
    async removeCategory(id, category) {
        try {
            const profile = await this.Profile.findById(id);
            if (profile) {
                await profile.removeCategory(category);
                Logger.info(`Removed category from profile: ${profile.name} (ID: ${id}, Category: ${category})`);
            }
            return profile;
        } catch (error) {
            Logger.error(`Error removing category from profile ${id}:`, error);
            throw error;
        }
    }

    /**
     * Update profile hourly rate
     * @param {string} id - Profile ID
     * @param {number} newRate - New hourly rate
     * @returns {Object} - Updated profile
     */
    async updateHourlyRate(id, newRate) {
        try {
            const profile = await this.Profile.findById(id);
            if (profile) {
                await profile.updateHourlyRate(newRate);
                Logger.info(`Updated profile hourly rate: ${profile.name} (ID: ${id}, Rate: $${newRate})`);
            }
            return profile;
        } catch (error) {
            Logger.error(`Error updating profile hourly rate ${id}:`, error);
            throw error;
        }
    }

    /**
     * Get profile statistics
     * @returns {Object} - Statistics object
     */
    async getStats() {
        try {
            const stats = await this.Profile.getStats();
            return stats;
        } catch (error) {
            Logger.error('Error getting profile stats:', error);
            throw error;
        }
    }

    /**
     * Count total profiles
     * @returns {number} - Total profile count
     */
    async count() {
        try {
            return await this.Profile.countDocuments();
        } catch (error) {
            Logger.error('Error counting profiles:', error);
            throw error;
        }
    }

    /**
     * Delete all profiles
     * @returns {number} - Number of deleted profiles
     */
    async deleteAll() {
        try {
            const result = await this.Profile.deleteMany({});
            Logger.info(`Deleted ${result.deletedCount} profiles`);
            return result.deletedCount;
        } catch (error) {
            Logger.error('Error deleting all profiles:', error);
            throw error;
        }
    }

    /**
     * Find profiles by multiple IDs
     * @param {Array} ids - Array of profile IDs
     * @returns {Array} - Array of profiles
     */
    async findByIds(ids) {
        try {
            if (ids.length === 0) return [];
            
            const profiles = await this.Profile.find({
                _id: { $in: ids }
            });
            return profiles;
        } catch (error) {
            Logger.error('Error finding profiles by IDs:', error);
            throw error;
        }
    }

    /**
     * Find profiles by name pattern
     * @param {string} namePattern - Name pattern to search for
     * @returns {Array} - Array of profiles
     */
    async findByNamePattern(namePattern) {
        try {
            const profiles = await this.Profile.find({
                name: { $regex: namePattern, $options: 'i' }
            }).sort({ name: 1 });
            return profiles;
        } catch (error) {
            Logger.error(`Error finding profiles by name pattern "${namePattern}":`, error);
            throw error;
        }
    }
}

module.exports = ProfileModel; 