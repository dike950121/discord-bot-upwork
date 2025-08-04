/**
 * Mongoose schema for Job model
 * Defines the structure and validation for job documents
 */

const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
    upworkId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        index: true
    },
    description: {
        type: String,
        default: ''
    },
    url: {
        type: String,
        default: ''
    },
    budget: {
        min: { type: Number, default: 0 },
        max: { type: Number, default: 0 },
        type: { type: String, enum: ['fixed', 'hourly'], default: 'fixed' }
    },
    skills: {
        type: [String],
        default: []
    },
    category: {
        type: String,
        required: true,
        index: true
    },
    score: {
        type: Number,
        default: 0,
        min: 0,
        max: 10,
        index: true
    },
    location: {
        type: String,
        default: ''
    },
    clientInfo: {
        type: String,
        default: ''
    },
    experience: {
        type: String,
        enum: ['entry', 'intermediate', 'expert'],
        default: 'intermediate'
    },
    applied: {
        type: Boolean,
        default: false,
        index: true
    },
    saved: {
        type: Boolean,
        default: false,
        index: true
    },
    appliedAt: {
        type: Date,
        default: null
    },
    savedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better query performance
JobSchema.index({ createdAt: -1 });
JobSchema.index({ score: -1, createdAt: -1 });
JobSchema.index({ category: 1, createdAt: -1 });
JobSchema.index({ skills: 1 });
JobSchema.index({ 'budget.min': 1, 'budget.max': 1 });

// Virtual for budget range
JobSchema.virtual('budgetRange').get(function() {
    if (this.budget.min === this.budget.max) {
        return `$${this.budget.min}`;
    }
    return `$${this.budget.min} - $${this.budget.max}`;
});

// Virtual for formatted score
JobSchema.virtual('scoreFormatted').get(function() {
    return this.score.toFixed(1);
});

// Instance method to mark as applied
JobSchema.methods.markAsApplied = function() {
    this.applied = true;
    this.appliedAt = new Date();
    return this.save();
};

// Instance method to mark as saved
JobSchema.methods.markAsSaved = function() {
    this.saved = true;
    this.savedAt = new Date();
    return this.save();
};

// Instance method to update score
JobSchema.methods.updateScore = function(newScore) {
    this.score = Math.max(0, Math.min(10, newScore));
    return this.save();
};

// Static method to find jobs by score range
JobSchema.statics.findByScoreRange = function(minScore, maxScore, limit = 50) {
    return this.find({
        score: { $gte: minScore, $lte: maxScore }
    })
    .sort({ score: -1, createdAt: -1 })
    .limit(limit);
};

// Static method to find jobs by category
JobSchema.statics.findByCategory = function(category, limit = 50) {
    return this.find({ category })
        .sort({ createdAt: -1 })
        .limit(limit);
};

// Static method to find jobs by skills
JobSchema.statics.findBySkills = function(skills, limit = 50) {
    return this.find({
        skills: { $in: skills }
    })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to search jobs
JobSchema.statics.search = function(keyword, limit = 50) {
    return this.find({
        $or: [
            { title: { $regex: keyword, $options: 'i' } },
            { description: { $regex: keyword, $options: 'i' } }
        ]
    })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get statistics
JobSchema.statics.getStats = async function() {
    const stats = {};
    
    // Total jobs
    stats.total = await this.countDocuments();
    
    // Average score
    const avgResult = await this.aggregate([
        { $group: { _id: null, average: { $avg: '$score' } } }
    ]);
    stats.averageScore = avgResult.length > 0 ? avgResult[0].average : 0;
    
    // Jobs by category
    const categoryResult = await this.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);
    stats.byCategory = categoryResult.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
    }, {});
    
    // Jobs by score range
    const scoreResult = await this.aggregate([
        {
            $addFields: {
                scoreRange: {
                    $switch: {
                        branches: [
                            { case: { $gte: ['$score', 8] }, then: 'High (8-10)' },
                            { case: { $gte: ['$score', 6] }, then: 'Medium (6-7.9)' },
                            { case: { $gte: ['$score', 4] }, then: 'Low (4-5.9)' }
                        ],
                        default: 'Very Low (0-3.9)'
                    }
                }
            }
        },
        { $group: { _id: '$scoreRange', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);
    stats.byScore = scoreResult.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
    }, {});
    
    // Recent jobs (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    stats.recent = await this.countDocuments({
        createdAt: { $gte: oneDayAgo }
    });
    
    return stats;
};

module.exports = JobSchema; 