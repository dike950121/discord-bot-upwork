/**
 * Mongoose schema for Profile model
 * Defines the structure and validation for profile documents
 */

const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    description: {
        type: String,
        default: ''
    },
    skills: {
        type: [String],
        default: [],
        index: true
    },
    experience: {
        years: { type: Number, default: 0 },
        level: { type: String, enum: ['junior', 'mid-level', 'senior', 'expert'], default: 'mid-level' },
        specialties: { type: [String], default: [] }
    },
    hourlyRate: {
        type: Number,
        required: true,
        min: 0,
        index: true
    },
    categories: {
        type: [String],
        default: [],
        index: true
    },
    portfolio: {
        type: String,
        default: ''
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better query performance
ProfileSchema.index({ hourlyRate: 1 });
ProfileSchema.index({ 'experience.level': 1 });
ProfileSchema.index({ categories: 1 });

// Virtual for formatted hourly rate
ProfileSchema.virtual('hourlyRateFormatted').get(function() {
    return `$${this.hourlyRate}/hr`;
});

// Virtual for experience summary
ProfileSchema.virtual('experienceSummary').get(function() {
    return `${this.experience.years} years (${this.experience.level})`;
});

// Instance method to add skill
ProfileSchema.methods.addSkill = function(skill) {
    if (!this.skills.includes(skill)) {
        this.skills.push(skill);
    }
    return this.save();
};

// Instance method to remove skill
ProfileSchema.methods.removeSkill = function(skill) {
    this.skills = this.skills.filter(s => s !== skill);
    return this.save();
};

// Instance method to add category
ProfileSchema.methods.addCategory = function(category) {
    if (!this.categories.includes(category)) {
        this.categories.push(category);
    }
    return this.save();
};

// Instance method to remove category
ProfileSchema.methods.removeCategory = function(category) {
    this.categories = this.categories.filter(c => c !== category);
    return this.save();
};

// Instance method to update hourly rate
ProfileSchema.methods.updateHourlyRate = function(newRate) {
    this.hourlyRate = Math.max(0, newRate);
    return this.save();
};

// Static method to find profiles by skills
ProfileSchema.statics.findBySkills = function(skills) {
    return this.find({
        skills: { $in: skills }
    })
    .sort({ name: 1 });
};

// Static method to find profiles by category
ProfileSchema.statics.findByCategory = function(category) {
    return this.find({
        categories: category
    })
    .sort({ name: 1 });
};

// Static method to find profiles by hourly rate range
ProfileSchema.statics.findByRateRange = function(minRate, maxRate) {
    return this.find({
        hourlyRate: { $gte: minRate, $lte: maxRate }
    })
    .sort({ hourlyRate: 1 });
};

// Static method to find profiles by experience level
ProfileSchema.statics.findByExperienceLevel = function(level) {
    return this.find({
        'experience.level': level
    })
    .sort({ 'experience.years': -1, name: 1 });
};

// Static method to search profiles
ProfileSchema.statics.search = function(keyword) {
    return this.find({
        $or: [
            { name: { $regex: keyword, $options: 'i' } },
            { description: { $regex: keyword, $options: 'i' } },
            { skills: { $in: [new RegExp(keyword, 'i')] } }
        ]
    })
    .sort({ name: 1 });
};

// Static method to get statistics
ProfileSchema.statics.getStats = async function() {
    const stats = {};
    
    // Total profiles
    stats.total = await this.countDocuments();
    
    // Average hourly rate
    const avgResult = await this.aggregate([
        { $group: { _id: null, average: { $avg: '$hourlyRate' } } }
    ]);
    stats.averageRate = avgResult.length > 0 ? avgResult[0].average : 0;
    
    // Skill distribution
    const skillResult = await this.aggregate([
        { $unwind: '$skills' },
        { $group: { _id: '$skills', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);
    stats.skillDistribution = skillResult.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
    }, {});
    
    // Category distribution
    const categoryResult = await this.aggregate([
        { $unwind: '$categories' },
        { $group: { _id: '$categories', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);
    stats.categoryDistribution = categoryResult.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
    }, {});
    
    // Experience level distribution
    const experienceResult = await this.aggregate([
        { $group: { _id: '$experience.level', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);
    stats.experienceDistribution = experienceResult.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
    }, {});
    
    // Rate range distribution
    const rateResult = await this.aggregate([
        {
            $addFields: {
                rateRange: {
                    $switch: {
                        branches: [
                            { case: { $gte: ['$hourlyRate', 100] }, then: 'High ($100+)' },
                            { case: { $gte: ['$hourlyRate', 50] }, then: 'Medium ($50-99)' },
                            { case: { $gte: ['$hourlyRate', 25] }, then: 'Low ($25-49)' }
                        ],
                        default: 'Very Low (<$25)'
                    }
                }
            }
        },
        { $group: { _id: '$rateRange', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);
    stats.rateDistribution = rateResult.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
    }, {});
    
    return stats;
};

module.exports = ProfileSchema; 