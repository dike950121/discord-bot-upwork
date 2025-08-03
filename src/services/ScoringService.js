/**
 * Service for job scoring and analysis
 * Combines OpenAI analysis with custom scoring algorithms
 */

const Logger = require('../utils/Logger');

class ScoringService {
    constructor(openaiService) {
        this.openaiService = openaiService;
        this.scoringWeights = {
            budget: 0.25,
            skills: 0.20,
            experience: 0.15,
            location: 0.10,
            description: 0.15,
            clientInfo: 0.15
        };
    }

    /**
     * Score a job using multiple criteria
     * @param {Object} job - The job data
     * @returns {number} - Score from 0-10
     */
    async scoreJob(job) {
        try {
            // Get OpenAI score
            const openaiScore = await this.openaiService.scoreJob(job);
            
            // Calculate custom score
            const customScore = this.calculateCustomScore(job);
            
            // Combine scores (70% OpenAI, 30% custom)
            const finalScore = (openaiScore * 0.7) + (customScore * 0.3);
            
            Logger.info(`Job ${job.title} - OpenAI: ${openaiScore}, Custom: ${customScore}, Final: ${finalScore}`);
            
            return Math.round(finalScore * 10) / 10; // Round to 1 decimal place
        } catch (error) {
            Logger.error('Error scoring job:', error);
            return this.calculateCustomScore(job); // Fallback to custom scoring
        }
    }

    /**
     * Categorize a job
     * @param {Object} job - The job data
     * @returns {string} - Job category
     */
    async categorizeJob(job) {
        try {
            return await this.openaiService.categorizeJob(job);
        } catch (error) {
            Logger.error('Error categorizing job:', error);
            return this.categorizeJobBySkills(job);
        }
    }

    /**
     * Analyze job requirements
     * @param {Object} job - The job data
     * @returns {Object} - Analysis results
     */
    async analyzeJob(job) {
        try {
            return await this.openaiService.analyzeJob(job);
        } catch (error) {
            Logger.error('Error analyzing job:', error);
            return this.analyzeJobManually(job);
        }
    }

    /**
     * Calculate custom score based on multiple factors
     * @param {Object} job - The job data
     * @returns {number} - Score from 0-10
     */
    calculateCustomScore(job) {
        let totalScore = 0;
        let totalWeight = 0;

        // Budget scoring
        const budgetScore = this.scoreBudget(job.budget);
        totalScore += budgetScore * this.scoringWeights.budget;
        totalWeight += this.scoringWeights.budget;

        // Skills scoring
        const skillsScore = this.scoreSkills(job.skills);
        totalScore += skillsScore * this.scoringWeights.skills;
        totalWeight += this.scoringWeights.skills;

        // Experience scoring
        const experienceScore = this.scoreExperience(job.experience);
        totalScore += experienceScore * this.scoringWeights.experience;
        totalWeight += this.scoringWeights.experience;

        // Location scoring
        const locationScore = this.scoreLocation(job.location);
        totalScore += locationScore * this.scoringWeights.location;
        totalWeight += this.scoringWeights.location;

        // Description scoring
        const descriptionScore = this.scoreDescription(job.description);
        totalScore += descriptionScore * this.scoringWeights.description;
        totalWeight += this.scoringWeights.description;

        // Client info scoring
        const clientScore = this.scoreClientInfo(job.clientInfo);
        totalScore += clientScore * this.scoringWeights.clientInfo;
        totalWeight += this.scoringWeights.clientInfo;

        return totalWeight > 0 ? totalScore / totalWeight : 5;
    }

    /**
     * Score budget adequacy
     * @param {Object} budget - Budget object
     * @returns {number} - Score from 0-10
     */
    scoreBudget(budget) {
        if (!budget) return 5; // Neutral score for unknown budget

        const { type, min, max } = budget;

        if (type === 'hourly') {
            if (min >= 50) return 10; // Excellent hourly rate
            if (min >= 30) return 8;  // Good hourly rate
            if (min >= 20) return 6;  // Average hourly rate
            if (min >= 10) return 4;  // Low hourly rate
            return 2; // Very low hourly rate
        } else if (type === 'fixed') {
            if (min >= 5000) return 10; // Excellent fixed budget
            if (min >= 2000) return 8;  // Good fixed budget
            if (min >= 1000) return 6;  // Average fixed budget
            if (min >= 500) return 4;   // Low fixed budget
            return 2; // Very low fixed budget
        }

        return 5; // Neutral for unknown type
    }

    /**
     * Score skills relevance and demand
     * @param {Array} skills - Skills array
     * @returns {number} - Score from 0-10
     */
    scoreSkills(skills) {
        if (!skills || skills.length === 0) return 5;

        const highDemandSkills = [
            'javascript', 'react', 'node.js', 'python', 'java', 'c#', 'php',
            'angular', 'vue.js', 'typescript', 'aws', 'docker', 'kubernetes',
            'machine learning', 'ai', 'data science', 'blockchain', 'mobile',
            'ios', 'android', 'flutter', 'react native'
        ];

        const mediumDemandSkills = [
            'html', 'css', 'sass', 'less', 'bootstrap', 'jquery', 'express',
            'django', 'flask', 'laravel', 'wordpress', 'shopify', 'magento',
            'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch'
        ];

        let score = 0;
        let totalSkills = skills.length;

        skills.forEach(skill => {
            const skillLower = skill.toLowerCase();
            if (highDemandSkills.some(s => skillLower.includes(s))) {
                score += 10;
            } else if (mediumDemandSkills.some(s => skillLower.includes(s))) {
                score += 7;
            } else {
                score += 5; // Neutral for other skills
            }
        });

        return totalSkills > 0 ? score / totalSkills : 5;
    }

    /**
     * Score experience level
     * @param {string} experience - Experience level
     * @returns {number} - Score from 0-10
     */
    scoreExperience(experience) {
        if (!experience) return 5;

        const experienceLower = experience.toLowerCase();
        
        if (experienceLower.includes('expert')) return 10;
        if (experienceLower.includes('senior')) return 9;
        if (experienceLower.includes('intermediate')) return 7;
        if (experienceLower.includes('mid')) return 7;
        if (experienceLower.includes('entry')) return 5;
        if (experienceLower.includes('junior')) return 5;
        if (experienceLower.includes('beginner')) return 3;

        return 5; // Default neutral score
    }

    /**
     * Score location desirability
     * @param {string} location - Location string
     * @returns {number} - Score from 0-10
     */
    scoreLocation(location) {
        if (!location) return 5;

        const locationLower = location.toLowerCase();
        
        // High-value locations
        if (locationLower.includes('united states') || locationLower.includes('us')) return 10;
        if (locationLower.includes('canada')) return 9;
        if (locationLower.includes('uk') || locationLower.includes('united kingdom')) return 8;
        if (locationLower.includes('australia')) return 8;
        if (locationLower.includes('germany')) return 7;
        if (locationLower.includes('france')) return 7;
        if (locationLower.includes('japan')) return 7;
        
        // Medium-value locations
        if (locationLower.includes('singapore')) return 6;
        if (locationLower.includes('sweden')) return 6;
        if (locationLower.includes('netherlands')) return 6;
        if (locationLower.includes('switzerland')) return 6;
        
        // Lower-value locations (but still acceptable)
        if (locationLower.includes('india')) return 4;
        if (locationLower.includes('philippines')) return 4;
        if (locationLower.includes('pakistan')) return 3;
        if (locationLower.includes('bangladesh')) return 3;

        return 5; // Default neutral score
    }

    /**
     * Score job description quality
     * @param {string} description - Job description
     * @returns {number} - Score from 0-10
     */
    scoreDescription(description) {
        if (!description) return 5;

        let score = 5; // Base score

        // Length scoring
        if (description.length > 500) score += 2;
        else if (description.length > 200) score += 1;
        else if (description.length < 50) score -= 2;

        // Quality indicators
        const qualityKeywords = [
            'detailed', 'comprehensive', 'thorough', 'professional',
            'experience', 'expertise', 'skills', 'requirements',
            'timeline', 'budget', 'scope', 'deliverables'
        ];

        const negativeKeywords = [
            'urgent', 'asap', 'quick', 'fast', 'cheap', 'low budget',
            'simple', 'easy', 'basic', 'beginner', 'student'
        ];

        const descriptionLower = description.toLowerCase();
        
        qualityKeywords.forEach(keyword => {
            if (descriptionLower.includes(keyword)) score += 0.5;
        });

        negativeKeywords.forEach(keyword => {
            if (descriptionLower.includes(keyword)) score -= 0.5;
        });

        return Math.max(0, Math.min(10, score));
    }

    /**
     * Score client information
     * @param {string} clientInfo - Client information
     * @returns {number} - Score from 0-10
     */
    scoreClientInfo(clientInfo) {
        if (!clientInfo) return 5;

        let score = 5; // Base score
        const clientLower = clientInfo.toLowerCase();

        // Positive indicators
        if (clientLower.includes('verified')) score += 2;
        if (clientLower.includes('payment verified')) score += 2;
        if (clientLower.includes('top rated')) score += 1;
        if (clientLower.includes('plus')) score += 1;
        if (clientLower.includes('enterprise')) score += 1;

        // Negative indicators
        if (clientLower.includes('new')) score -= 1;
        if (clientLower.includes('0%')) score -= 2;
        if (clientLower.includes('no feedback')) score -= 1;

        return Math.max(0, Math.min(10, score));
    }

    /**
     * Categorize job by skills (fallback method)
     * @param {Object} job - The job data
     * @returns {string} - Job category
     */
    categorizeJobBySkills(job) {
        if (!job.skills || job.skills.length === 0) {
            return 'other';
        }

        const skillsLower = job.skills.map(s => s.toLowerCase());
        const titleLower = job.title.toLowerCase();
        const descriptionLower = job.description.toLowerCase();

        // Mobile development
        if (skillsLower.some(s => s.includes('react native') || s.includes('flutter') || s.includes('ios') || s.includes('android'))) {
            return 'mobile';
        }

        // AI/ML development
        if (skillsLower.some(s => s.includes('machine learning') || s.includes('ai') || s.includes('tensorflow') || s.includes('pytorch'))) {
            return 'full-stack-ai';
        }

        // Frontend development
        if (skillsLower.some(s => s.includes('react') || s.includes('vue') || s.includes('angular') || s.includes('frontend'))) {
            return 'frontend';
        }

        // Backend development
        if (skillsLower.some(s => s.includes('node.js') || s.includes('python') || s.includes('java') || s.includes('backend'))) {
            return 'backend';
        }

        // Full-stack development
        if (skillsLower.some(s => s.includes('full stack') || s.includes('fullstack'))) {
            return 'full-stack';
        }

        // US-only projects
        if (titleLower.includes('us only') || descriptionLower.includes('us only') || 
            titleLower.includes('united states') || descriptionLower.includes('united states')) {
            return 'us-only';
        }

        return 'other';
    }

    /**
     * Analyze job manually (fallback method)
     * @param {Object} job - The job data
     * @returns {Object} - Analysis results
     */
    analyzeJobManually(job) {
        return {
            skills: job.skills || [],
            experience: this.extractExperienceLevel(job.description),
            budget: job.budget || { type: 'unknown', min: 0, max: 0 },
            duration: this.extractDuration(job.description),
            complexity: this.extractComplexity(job.description),
            location: job.location || 'Unknown',
            category: this.categorizeJobBySkills(job)
        };
    }

    /**
     * Extract experience level from description
     * @param {string} description - Job description
     * @returns {string} - Experience level
     */
    extractExperienceLevel(description) {
        if (!description) return 'intermediate';

        const descLower = description.toLowerCase();
        
        if (descLower.includes('expert') || descLower.includes('senior')) return 'expert';
        if (descLower.includes('entry') || descLower.includes('junior') || descLower.includes('beginner')) return 'entry';
        
        return 'intermediate';
    }

    /**
     * Extract project duration from description
     * @param {string} description - Job description
     * @returns {string} - Duration
     */
    extractDuration(description) {
        if (!description) return 'medium';

        const descLower = description.toLowerCase();
        
        if (descLower.includes('short') || descLower.includes('quick') || descLower.includes('1-2 weeks')) return 'short';
        if (descLower.includes('long') || descLower.includes('months') || descLower.includes('ongoing')) return 'long';
        
        return 'medium';
    }

    /**
     * Extract project complexity from description
     * @param {string} description - Job description
     * @returns {string} - Complexity
     */
    extractComplexity(description) {
        if (!description) return 'moderate';

        const descLower = description.toLowerCase();
        
        if (descLower.includes('simple') || descLower.includes('basic') || descLower.includes('easy')) return 'simple';
        if (descLower.includes('complex') || descLower.includes('advanced') || descLower.includes('sophisticated')) return 'complex';
        
        return 'moderate';
    }

    /**
     * Get scoring statistics
     */
    getStats() {
        return {
            weights: this.scoringWeights,
            openaiStats: this.openaiService.getStats()
        };
    }
}

module.exports = ScoringService; 