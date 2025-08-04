# Discord Bot for Upwork Job Monitoring

A sophisticated Discord bot that monitors Upwork for new job postings and provides AI-powered scoring and filtering capabilities.

## Features

- **Real-time Job Monitoring**: Automatically fetches new jobs from Upwork at configurable intervals
- **AI-Powered Scoring**: Uses OpenAI to analyze and score job postings based on relevance and quality
- **Smart Filtering**: Filters jobs based on skills, budget, experience level, and custom criteria
- **Discord Integration**: Posts high-scoring jobs directly to Discord channels
- **MongoDB Database**: Robust data storage with Mongoose ODM for scalability
- **Profile Management**: Create and manage freelancer profiles for better job matching
- **Channel Management**: Organize job postings into different Discord channels by category

## Prerequisites

- Node.js (v16 or higher)
- Discord Bot Token
- MongoDB (optional - bot will work without it)
- OpenAI API Key (optional - AI features will be disabled without it)

## Quick Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/discord-bot-upwork.git
   cd discord-bot-upwork
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the setup script**
   ```bash
   npm run setup
   ```
   This will create a `.env` file with template values.

4. **Configure your environment**
   Edit the `.env` file with your actual values:
   ```env
   # Discord Bot Configuration
   DISCORD_TOKEN=your_actual_discord_bot_token
   
   # OpenAI Configuration (optional)
   OPENAI_API_KEY=your_openai_api_key_here
   
   # MongoDB Configuration (optional)
   MONGODB_URI=mongodb://localhost:27017/discord-bot-upwork
   
   # Logging Configuration
   LOG_LEVEL=info
   ```

5. **Start the bot**
   ```bash
   npm start
   ```

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DISCORD_TOKEN` | Discord bot token | ✅ Yes | - |
| `OPENAI_API_KEY` | OpenAI API key for job scoring | ❌ No | AI features disabled |
| `MONGODB_URI` | MongoDB connection string | ❌ No | `mongodb://localhost:27017/discord-bot-upwork` |
| `LOG_LEVEL` | Logging level | ❌ No | `info` |

### MongoDB Setup

The bot uses MongoDB with Mongoose ODM for data persistence. The database automatically creates the following collections:

- **jobs**: Stores job postings with scoring and metadata
- **profiles**: Stores freelancer profiles for job matching
- **channels**: Stores Discord channel configurations

## Usage

### Discord Commands

- `!help` - Show available commands
- `!jobs` - List recent high-scoring jobs
- `!job <id>` - Show details of a specific job
- `!search <keyword>` - Search jobs by keyword
- `!profile create` - Create a new freelancer profile
- `!profile update` - Update your profile
- `!channel setup` - Set up job posting channels

### Job Monitoring

The bot automatically:
- Fetches new jobs from Upwork every 5 minutes
- Scores jobs using AI analysis
- Posts high-scoring jobs to configured Discord channels
- Maintains job history and statistics

### Profile Management

Create detailed freelancer profiles to improve job matching:
- Skills and expertise
- Experience level and years
- Hourly rate expectations
- Portfolio links
- Preferred job categories

## Architecture

### Models

- **JobModel**: Manages job data with MongoDB/Mongoose
- **ProfileModel**: Handles freelancer profiles
- **ChannelModel**: Manages Discord channel configurations

### Services

- **UpworkService**: Fetches and parses job data from Upwork
- **OpenAIService**: Provides AI-powered job scoring
- **ScoringService**: Analyzes job relevance and quality
- **ChannelService**: Manages Discord channel operations

### Controllers

- **UpworkController**: Orchestrates job monitoring
- **ProfileController**: Handles profile operations
- **JobController**: Manages job data operations
- **ChannelController**: Manages Discord channels
- **CommandController**: Processes Discord commands

## Development

### Running in Development Mode

```bash
npm run dev
```

### Database Operations

The bot includes database utilities for:
- Health checks
- Statistics and analytics
- Backup and restore operations
- Index optimization

### Adding New Features

1. Create Mongoose schemas in `src/models/schemas/`
2. Update models in `src/models/`
3. Add services in `src/services/`
4. Create controllers in `src/controllers/`
5. Update command handling in `CommandController`

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Verify MongoDB is running
   - Check connection string in `.env`
   - Ensure network access to MongoDB

2. **Discord Bot Not Responding**
   - Verify bot token is correct
   - Check bot permissions in Discord
   - Ensure bot is added to server

3. **Job Scoring Errors**
   - Verify OpenAI API key
   - Check API rate limits
   - Review job data format

### Logs

Check logs in `./logs/bot.log` for detailed error information.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For issues and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the logs for error details 