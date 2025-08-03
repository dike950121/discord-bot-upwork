/**
 * Model for managing user profile data
 * Handles profile CRUD operations and database interactions
 */

const Logger = require('../utils/Logger');

class ProfileModel {
    constructor(database) {
        this.database = database;
        this.tableName = 'profiles';
        this.initTable();
    }

    /**
     * Initialize the profiles table
     */
    async initTable() {
        try {
            const createTableSQL = `
                CREATE TABLE IF NOT EXISTS ${this.tableName} (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE NOT NULL,
                    description TEXT,
                    skills TEXT,
                    experience TEXT,
                    hourlyRate REAL NOT NULL,
                    categories TEXT,
                    portfolio TEXT,
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `;
            
            await this.database.run(createTableSQL);
            Logger.info('Profiles table initialized');
        } catch (error) {
            Logger.error('Error initializing profiles table:', error);
            throw error;
        }
    }

    /**
     * Create a new profile
     * @param {Object} profileData - Profile data
     * @returns {Object} - Created profile
     */
    async create(profileData) {
        try {
            const sql = `
                INSERT INTO ${this.tableName} (
                    name, description, skills, experience, hourlyRate, categories, portfolio
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            
            const params = [
                profileData.name,
                profileData.description,
                JSON.stringify(profileData.skills),
                JSON.stringify(profileData.experience),
                profileData.hourlyRate,
                JSON.stringify(profileData.categories || []),
                profileData.portfolio || ''
            ];
            
            const result = await this.database.run(sql, params);
            const profile = await this.findById(result.lastID);
            
            Logger.info(`Created profile: ${profile.name} (ID: ${profile.id})`);
            return profile;
        } catch (error) {
            Logger.error('Error creating profile:', error);
            throw error;
        }
    }

    /**
     * Find profile by ID
     * @param {number} id - Profile ID
     * @returns {Object|null} - Profile object or null
     */
    async findById(id) {
        try {
            const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
            const profile = await this.database.get(sql, [id]);
            
            if (profile) {
                return this.parseProfile(profile);
            }
            
            return null;
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
            const sql = `SELECT * FROM ${this.tableName} WHERE name = ?`;
            const profile = await this.database.get(sql, [name]);
            
            if (profile) {
                return this.parseProfile(profile);
            }
            
            return null;
        } catch (error) {
            Logger.error(`Error finding profile by name ${name}:`, error);
            throw error;
        }
    }

    /**
     * Update a profile
     * @param {number} id - Profile ID
     * @param {Object} updateData - Update data
     * @returns {Object} - Updated profile
     */
    async update(id, updateData) {
        try {
            const fields = [];
            const values = [];
            
            Object.keys(updateData).forEach(key => {
                if (key === 'skills' || key === 'experience' || key === 'categories') {
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
            
            const updatedProfile = await this.findById(id);
            Logger.info(`Updated profile: ${updatedProfile.name} (ID: ${id})`);
            return updatedProfile;
        } catch (error) {
            Logger.error(`Error updating profile ${id}:`, error);
            throw error;
        }
    }

    /**
     * Delete a profile
     * @param {number} id - Profile ID
     * @returns {boolean} - Success status
     */
    async delete(id) {
        try {
            const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
            const result = await this.database.run(sql, [id]);
            
            Logger.info(`Deleted profile with ID: ${id}`);
            return result.changes > 0;
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
            const sql = `SELECT * FROM ${this.tableName} ORDER BY name`;
            const profiles = await this.database.all(sql);
            return profiles.map(profile => this.parseProfile(profile));
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
            const conditions = skills.map(() => 'skills LIKE ?').join(' OR ');
            const sql = `
                SELECT * FROM ${this.tableName} 
                WHERE ${conditions} 
                ORDER BY name
            `;
            
            const searchTerms = skills.map(skill => `%${skill}%`);
            const profiles = await this.database.all(sql, searchTerms);
            return profiles.map(profile => this.parseProfile(profile));
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
            const sql = `
                SELECT * FROM ${this.tableName} 
                WHERE categories LIKE ? 
                ORDER BY name
            `;
            
            const profiles = await this.database.all(sql, [`%${category}%`]);
            return profiles.map(profile => this.parseProfile(profile));
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
            const sql = `
                SELECT * FROM ${this.tableName} 
                WHERE hourlyRate >= ? AND hourlyRate <= ? 
                ORDER BY hourlyRate
            `;
            
            const profiles = await this.database.all(sql, [minRate, maxRate]);
            return profiles.map(profile => this.parseProfile(profile));
        } catch (error) {
            Logger.error('Error finding profiles by rate range:', error);
            throw error;
        }
    }

    /**
     * Get profile statistics
     * @returns {Object} - Statistics object
     */
    async getStats() {
        try {
            const stats = {};
            
            // Total profiles
            const totalResult = await this.database.get(`SELECT COUNT(*) as total FROM ${this.tableName}`);
            stats.total = totalResult.total;
            
            // Average hourly rate
            const avgResult = await this.database.get(`SELECT AVG(hourlyRate) as average FROM ${this.tableName}`);
            stats.averageRate = avgResult.average || 0;
            
            // Skill distribution
            const skillResult = await this.database.all(`
                SELECT skills FROM ${this.tableName}
            `);
            
            const skillCounts = {};
            skillResult.forEach(row => {
                const skills = JSON.parse(row.skills);
                skills.forEach(skill => {
                    skillCounts[skill] = (skillCounts[skill] || 0) + 1;
                });
            });
            stats.skillDistribution = skillCounts;
            
            // Category distribution
            const categoryResult = await this.database.all(`
                SELECT categories FROM ${this.tableName}
            `);
            
            const categoryCounts = {};
            categoryResult.forEach(row => {
                const categories = JSON.parse(row.categories);
                categories.forEach(category => {
                    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
                });
            });
            stats.categoryDistribution = categoryCounts;
            
            return stats;
        } catch (error) {
            Logger.error('Error getting profile stats:', error);
            throw error;
        }
    }

    /**
     * Parse profile data from database
     * @param {Object} profile - Raw profile data from database
     * @returns {Object} - Parsed profile data
     */
    parseProfile(profile) {
        return {
            ...profile,
            skills: profile.skills ? JSON.parse(profile.skills) : [],
            experience: profile.experience ? JSON.parse(profile.experience) : {},
            categories: profile.categories ? JSON.parse(profile.categories) : [],
            hourlyRate: parseFloat(profile.hourlyRate),
            createdAt: new Date(profile.createdAt),
            updatedAt: new Date(profile.updatedAt)
        };
    }
}

module.exports = ProfileModel; 