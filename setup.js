/**
 * Setup script for Discord Bot
 * Helps users configure environment variables and check setup
 */

const fs = require('fs');
const path = require('path');

console.log('🤖 Discord Bot Setup');
console.log('===================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
    console.log('❌ .env file not found');
    console.log('📝 Creating .env file with template...');
    
    const envTemplate = `# Discord Bot Configuration
DISCORD_TOKEN=your_discord_bot_token_here

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/discord-bot-upwork

# Logging Configuration
LOG_LEVEL=info
`;
    
    try {
        fs.writeFileSync(envPath, envTemplate);
        console.log('✅ .env file created successfully');
        console.log('📋 Please edit the .env file with your actual values:');
        console.log('   - DISCORD_TOKEN: Your Discord bot token');
        console.log('   - OPENAI_API_KEY: Your OpenAI API key (optional)');
        console.log('   - MONGODB_URI: Your MongoDB connection string');
    } catch (error) {
        console.error('❌ Failed to create .env file:', error.message);
        process.exit(1);
    }
} else {
    console.log('✅ .env file found');
}

// Check required dependencies
console.log('\n📦 Checking dependencies...');
const packageJson = require('./package.json');
const requiredDeps = ['discord.js', 'dotenv', 'axios', 'openai', 'node-cron', 'cheerio', 'mongoose'];

for (const dep of requiredDeps) {
    try {
        require.resolve(dep);
        console.log(`✅ ${dep}`);
    } catch (error) {
        console.log(`❌ ${dep} - not installed`);
    }
}

// Check environment variables
console.log('\n🔧 Checking environment variables...');
require('dotenv').config();

const requiredEnvVars = [
    { name: 'DISCORD_TOKEN', required: true },
    { name: 'OPENAI_API_KEY', required: false },
    { name: 'MONGODB_URI', required: false },
    { name: 'LOG_LEVEL', required: false }
];

for (const envVar of requiredEnvVars) {
    const value = process.env[envVar.name];
    if (value && value !== `your_${envVar.name.toLowerCase()}_here`) {
        console.log(`✅ ${envVar.name}`);
    } else if (envVar.required) {
        console.log(`❌ ${envVar.name} - required but not set`);
    } else {
        console.log(`⚠️  ${envVar.name} - optional, not set`);
    }
}

console.log('\n🚀 Setup complete!');
console.log('\nNext steps:');
console.log('1. Edit the .env file with your actual values');
console.log('2. Make sure MongoDB is running (if using local MongoDB)');
console.log('3. Run "npm start" to start the bot');
console.log('\nNote: OpenAI API key is optional. The bot will work without it, but AI features will be disabled.'); 