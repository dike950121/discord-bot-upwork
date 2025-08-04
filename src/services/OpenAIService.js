/**
 * Service for OpenAI integration
 * Handles job scoring, categorization, and analysis using OpenAI API
 */

const OpenAI = require('openai');
const Logger = require('../utils/Logger');

class OpenAIService {
    constructor() {
        // Check if OpenAI API key is available
        if (!process.env.OPENAI_API_KEY) {
            Logger.warn('OpenAI API key not found. Some features will be disabled.');
            this.openai = null;
        } else {
            this.openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY
            });
        }
        
        this.model = 'gpt-4';
        this.maxTokens = 1000;
        this.temperature = 0.3;
    }

    /**
     * Score a job based on various criteria
     * @param {Object} job - The job data
     * @returns {number} - Score from 0-10
     */
    async scoreJob(job) {
        try {
            if (!this.openai) {
                Logger.warn('OpenAI service not available, using default score');
                return 5; // Default neutral score
            }
            
            const prompt = this.buildScoringPrompt(job);
            
            const response = await this.openai.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert job evaluator. Score jobs from 0-10 based on quality, budget, requirements, and potential.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: this.maxTokens,
                temperature: this.temperature
            });

            const scoreText = response.choices[0].message.content.trim();
            const score = this.parseScore(scoreText);
            
            Logger.info(`Job ${job.title} scored: ${score}/10`);
            return score;
        } catch (error) {
            Logger.error('Error scoring job:', error);
            return 5; // Default neutral score
        }
    }

    /**
     * Categorize a job into predefined categories
     * @param {Object} job - The job data
     * @returns {string} - Job category
     */
    async categorizeJob(job) {
        try {
            if (!this.openai) {
                Logger.warn('OpenAI service not available, using default category');
                return 'other';
            }
            
            const prompt = this.buildCategorizationPrompt(job);
            
            const response = await this.openai.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert job categorizer. Categorize jobs into one of these categories: mobile, full-stack, full-stack-ai, frontend, backend, us-only, or other. Respond with only the category name.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 50,
                temperature: this.temperature
            });

            const category = response.choices[0].message.content.trim().toLowerCase();
            
            Logger.info(`Job ${job.title} categorized as: ${category}`);
            return category;
        } catch (error) {
            Logger.error('Error categorizing job:', error);
            return 'other';
        }
    }

    /**
     * Analyze job requirements and extract key information
     * @param {Object} job - The job data
     * @returns {Object} - Analysis results
     */
    async analyzeJob(job) {
        try {
            if (!this.openai) {
                Logger.warn('OpenAI service not available, using default analysis');
                return this.getDefaultAnalysis(job);
            }
            
            const prompt = this.buildAnalysisPrompt(job);
            
            const response = await this.openai.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert job analyst. Analyze job requirements and extract key information in JSON format.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: this.maxTokens,
                temperature: this.temperature
            });

            const analysisText = response.choices[0].message.content.trim();
            const analysis = this.parseAnalysis(analysisText);
            
            Logger.info(`Job ${job.title} analyzed successfully`);
            return analysis;
        } catch (error) {
            Logger.error('Error analyzing job:', error);
            return this.getDefaultAnalysis(job);
        }
    }

    /**
     * Find the best matching profile for a job
     * @param {Object} job - The job data
     * @param {Array} profiles - Available profiles
     * @returns {Object} - Best match with score
     */
    async findBestProfileMatch(job, profiles) {
        try {
            if (!this.openai) {
                Logger.warn('OpenAI service not available, using default profile match');
                return this.parseProfileMatch('default', profiles);
            }
            
            const prompt = this.buildProfileMatchingPrompt(job, profiles);
            
            const response = await this.openai.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert profile matcher. Find the best matching profile for a job and provide a match score from 0-10.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: this.maxTokens,
                temperature: this.temperature
            });

            const matchText = response.choices[0].message.content.trim();
            const match = this.parseProfileMatch(matchText, profiles);
            
            Logger.info(`Best profile match for job ${job.title}: ${match.profile?.name} (Score: ${match.score})`);
            return match;
        } catch (error) {
            Logger.error('Error finding profile match:', error);
            return { profile: null, score: 0 };
        }
    }

    /**
     * Build scoring prompt for a job
     * @param {Object} job - The job data
     */
    buildScoringPrompt(job) {
        return `
Please score this job from 0-10 based on the following criteria:
- Job quality and clarity
- Budget adequacy
- Skill requirements match
- Project scope and timeline
- Client reputation and location

Job Title: ${job.title}
Description: ${job.description}
Budget: ${this.formatBudget(job.budget)}
Skills: ${job.skills?.join(', ') || 'Not specified'}
Location: ${job.location || 'Not specified'}

Provide only a number from 0-10 as your response.
        `.trim();
    }

    /**
     * Build categorization prompt for a job
     * @param {Object} job - The job data
     */
    buildCategorizationPrompt(job) {
        return `
Please categorize this job into one of these categories:
- mobile (mobile app development)
- full-stack (full-stack web development)
- full-stack-ai (AI/ML full-stack development)
- frontend (frontend development only)
- backend (backend development only)
- us-only (US-based projects only)
- other (doesn't fit above categories)

Job Title: ${job.title}
Description: ${job.description}
Skills: ${job.skills?.join(', ') || 'Not specified'}

Respond with only the category name.
        `.trim();
    }

    /**
     * Build analysis prompt for a job
     * @param {Object} job - The job data
     */
    buildAnalysisPrompt(job) {
        return `
Please analyze this job and extract key information in JSON format:

Job Title: ${job.title}
Description: ${job.description}
Budget: ${this.formatBudget(job.budget)}
Skills: ${job.skills?.join(', ') || 'Not specified'}

Return a JSON object with the following structure:
{
  "skills": ["skill1", "skill2"],
  "experience": "entry|intermediate|expert",
  "budget": {
    "type": "hourly|fixed|unknown",
    "min": number,
    "max": number
  },
  "duration": "short|medium|long",
  "complexity": "simple|moderate|complex",
  "location": "string",
  "category": "string"
}
        `.trim();
    }

    /**
     * Build profile matching prompt
     * @param {Object} job - The job data
     * @param {Array} profiles - Available profiles
     */
    buildProfileMatchingPrompt(job, profiles) {
        const profilesText = profiles.map((profile, index) => `
Profile ${index + 1}: ${profile.name}
Skills: ${profile.skills.join(', ')}
Experience: ${profile.experience.level}
Rate: $${profile.hourlyRate}/hr
        `).join('\n');

        return `
Please find the best matching profile for this job:

Job: ${job.title}
Description: ${job.description}
Budget: ${this.formatBudget(job.budget)}
Required Skills: ${job.skills?.join(', ') || 'Not specified'}

Available Profiles:
${profilesText}

Return a JSON object with:
{
  "bestProfileIndex": number,
  "matchScore": number (0-10),
  "reasoning": "string"
}
        `.trim();
    }

    /**
     * Parse score from OpenAI response
     * @param {string} scoreText - Score text from OpenAI
     */
    parseScore(scoreText) {
        try {
            const score = parseFloat(scoreText);
            if (isNaN(score) || score < 0 || score > 10) {
                return 5; // Default neutral score
            }
            return Math.round(score * 10) / 10; // Round to 1 decimal place
        } catch (error) {
            Logger.error('Error parsing score:', error);
            return 5;
        }
    }

    /**
     * Parse analysis from OpenAI response
     * @param {string} analysisText - Analysis text from OpenAI
     */
    parseAnalysis(analysisText) {
        try {
            // Try to extract JSON from the response
            const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            
            // Fallback to default analysis
            return this.getDefaultAnalysis();
        } catch (error) {
            Logger.error('Error parsing analysis:', error);
            return this.getDefaultAnalysis();
        }
    }

    /**
     * Parse profile match from OpenAI response
     * @param {string} matchText - Match text from OpenAI
     * @param {Array} profiles - Available profiles
     */
    parseProfileMatch(matchText, profiles) {
        try {
            // Try to extract JSON from the response
            const jsonMatch = matchText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const match = JSON.parse(jsonMatch[0]);
                const profileIndex = match.bestProfileIndex - 1;
                
                if (profileIndex >= 0 && profileIndex < profiles.length) {
                    return {
                        profile: profiles[profileIndex],
                        score: match.matchScore,
                        reasoning: match.reasoning
                    };
                }
            }
            
            return { profile: null, score: 0 };
        } catch (error) {
            Logger.error('Error parsing profile match:', error);
            return { profile: null, score: 0 };
        }
    }

    /**
     * Get default analysis for a job
     * @param {Object} job - The job data
     */
    getDefaultAnalysis(job) {
        return {
            skills: job.skills || [],
            experience: 'intermediate',
            budget: job.budget || { type: 'unknown', min: 0, max: 0 },
            duration: 'medium',
            complexity: 'moderate',
            location: job.location || 'Unknown',
            category: 'other'
        };
    }

    /**
     * Format budget for display
     * @param {Object} budget - Budget object
     */
    formatBudget(budget) {
        if (!budget) return 'Not specified';
        
        if (budget.type === 'hourly') {
            if (budget.min && budget.max) {
                return `$${budget.min}-$${budget.max}/hr`;
            } else if (budget.min) {
                return `$${budget.min}+/hr`;
            }
        } else if (budget.type === 'fixed') {
            if (budget.min && budget.max) {
                return `$${budget.min}-$${budget.max} fixed`;
            } else if (budget.min) {
                return `$${budget.min}+ fixed`;
            }
        }
        
        return 'Not specified';
    }

    /**
     * Test OpenAI connection
     */
    async testConnection() {
        try {
            if (!this.openai) {
                Logger.warn('OpenAI service not available for testing');
                return false;
            }
            
            const response = await this.openai.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: 'user',
                        content: 'Hello, please respond with "OK" if you can see this message.'
                    }
                ],
                max_tokens: 10,
                temperature: 0
            });

            const message = response.choices[0].message.content.trim();
            return message === 'OK';
        } catch (error) {
            Logger.error('OpenAI connection test failed:', error);
            return false;
        }
    }

    /**
     * Get service statistics
     */
    getStats() {
        return {
            model: this.model,
            maxTokens: this.maxTokens,
            temperature: this.temperature
        };
    }
}

module.exports = OpenAIService; 