/**
 * Minimal test script to verify bot initialization
 * Tests that the bot can start without crashing when env vars are missing
 */

require('dotenv').config();

console.log('🧪 Testing bot initialization...\n');

// Test 1: Check environment variables
console.log('📋 Environment Variables:');
console.log(`DISCORD_TOKEN: ${process.env.DISCORD_TOKEN ? '✅ Set' : '❌ Missing'}`);
console.log(`OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`MONGODB_URI: ${process.env.MONGODB_URI ? '✅ Set' : '❌ Missing'}`);
console.log(`LOG_LEVEL: ${process.env.LOG_LEVEL ? '✅ Set' : '❌ Missing'}`);

// Test 2: Test service initialization
console.log('\n🔧 Testing service initialization...');
try {
    const OpenAIService = require('./src/services/OpenAIService');
    const openaiService = new OpenAIService();
    console.log('✅ OpenAIService initialized successfully');
    
    if (openaiService.openai) {
        console.log('✅ OpenAI client available');
    } else {
        console.log('⚠️  OpenAI client not available (API key missing)');
    }
} catch (error) {
    console.log('❌ OpenAIService initialization failed:', error.message);
}

// Test 3: Test database initialization
console.log('\n🗄️  Testing database initialization...');
try {
    const Database = require('./src/utils/Database');
    const database = new Database();
    console.log('✅ Database class initialized successfully');
} catch (error) {
    console.log('❌ Database initialization failed:', error.message);
}

// Test 4: Test logger initialization
console.log('\n📝 Testing logger initialization...');
try {
    const Logger = require('./src/utils/Logger');
    Logger.info('Test log message');
    console.log('✅ Logger initialized successfully');
} catch (error) {
    console.log('❌ Logger initialization failed:', error.message);
}

console.log('\n✅ All tests completed!');
console.log('\nTo start the bot with full functionality:');
console.log('1. Set DISCORD_TOKEN in your .env file');
console.log('2. Optionally set OPENAI_API_KEY for AI features');
console.log('3. Optionally set MONGODB_URI for database features');
console.log('4. Run "npm start"'); 