/**
 * Mongoose schema for Channel model
 * Defines the structure and validation for channel documents
 */

const mongoose = require('mongoose');

const ChannelSchema = new mongoose.Schema({
    discordId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    guildId: {
        type: String,
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        index: true
    },
    category: {
        type: String,
        required: true,
        index: true
    },
    parentCategoryId: {
        type: String,
        default: null,
        index: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better query performance
ChannelSchema.index({ guildId: 1, category: 1 });
ChannelSchema.index({ parentCategoryId: 1, name: 1 });

// Virtual for full channel name
ChannelSchema.virtual('fullName').get(function() {
    return `${this.category}: ${this.name}`;
});

// Instance method to update category
ChannelSchema.methods.updateCategory = function(newCategory) {
    this.category = newCategory;
    return this.save();
};

// Instance method to update parent category
ChannelSchema.methods.updateParentCategory = function(parentCategoryId) {
    this.parentCategoryId = parentCategoryId;
    return this.save();
};

// Static method to find channels by guild
ChannelSchema.statics.findByGuild = function(guildId) {
    return this.find({ guildId })
        .sort({ name: 1 });
};

// Static method to find channels by category
ChannelSchema.statics.findByCategory = function(category) {
    return this.find({ category })
        .sort({ name: 1 });
};

// Static method to find channels by parent category
ChannelSchema.statics.findByParentCategory = function(parentCategoryId) {
    return this.find({ parentCategoryId })
        .sort({ name: 1 });
};

// Static method to get statistics
ChannelSchema.statics.getStats = async function() {
    const stats = {};
    
    // Total channels
    stats.total = await this.countDocuments();
    
    // Channels by category
    const categoryResult = await this.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);
    stats.byCategory = categoryResult.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
    }, {});
    
    // Channels by guild
    const guildResult = await this.aggregate([
        { $group: { _id: '$guildId', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);
    stats.byGuild = guildResult.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
    }, {});
    
    // Recent channels (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    stats.recent = await this.countDocuments({
        createdAt: { $gte: sevenDaysAgo }
    });
    
    return stats;
};

module.exports = ChannelSchema; 