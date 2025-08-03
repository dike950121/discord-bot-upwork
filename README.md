# Discord Bot for Upwork Job Management

A sophisticated Discord bot that fetches Upwork jobs in real-time, scores them using OpenAI, and distributes them to appropriate Discord channels based on job categories.

## Features

- **Real-time Job Fetching**: Automatically fetches new Upwork jobs every 5 minutes
- **AI-Powered Scoring**: Uses OpenAI to score jobs (0-10) based on relevance and quality
- **Smart Categorization**: Automatically categorizes jobs into channels (mobile, full-stack, frontend, backend, etc.)
- **Profile Management**: Upload and manage multiple user profiles for job matching
- **Intelligent Matching**: Compares jobs to stored profiles to find the best match
- **Dynamic Channel Creation**: Creates new channels automatically for new job categories
- **Comprehensive Logging**: Detailed logging system for monitoring and debugging

## Prerequisites

- Node.js (v16 or higher)
- Discord Bot Token
- OpenAI API Key
- Discord Server with appropriate permissions

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/dike950121/discord-bot-upwork.git
   cd discord-bot-upwork
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory with the following variables:
   ```
   DISCORD_TOKEN=your_discord_bot_token_here
   DISCORD_CLIENT_ID=your_discord_client_id_here
   DISCORD_GUILD_ID=your_discord_guild_id_here
   OPENAI_API_KEY=your_openai_api_key_here
   DATABASE_PATH=./data/bot.db
   LOG_LEVEL=info
   LOG_FILE=./logs/bot.log
   UPWORK_BASE_URL=https://www.upwork.com
   UPWORK_SEARCH_URL=https://www.upwork.com/nx/search/jobs/
   UPWORK_JOB_URL=https://www.upwork.com/jobs/
   JOB_FETCH_INTERVAL=*/5 * * * *
   MAX_JOBS_PER_FETCH=50
   JOB_CACHE_DURATION=3600000
   MIN_SCORE_THRESHOLD=5
   HIGH_SCORE_THRESHOLD=8
   DEFAULT_CHANNEL_NAME=US ONLY
   CHANNEL_CATEGORY_NAME=Upwork Jobs
   API_RATE_LIMIT=100
   UPWORK_RATE_LIMIT=10
   NODE_ENV=development
   DEBUG=false
   ```

4. **Create necessary directories**
   ```bash
   mkdir -p data logs
   ```

## Usage

### Starting the Bot

**Development mode (with auto-restart):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

### Discord Commands

The bot responds to the following commands:

- `!help` - Shows available commands
- `!jobs` - Lists recent jobs
- `!jobs [category]` - Lists jobs by category
- `!job [id]` - Shows detailed job information
- `!search [query]` - Search jobs by keywords
- `!score [id]` - Re-score a specific job
- `!stats` - Shows job statistics
- `!profile` - Shows your current profile
- `!profiles` - Lists all available profiles
- `!addprofile` - Add a new profile (web interface)
- `!updateprofile` - Update existing profile (web interface)
- `!deleteprofile` - Delete a profile (web interface)
- `!createchannel` - Create a new channel (web interface)
- `!deletechannel` - Delete a channel (web interface)

## Project Structure

```
discord-bot-upwork/
├── src/
│   ├── controllers/     # Request handlers and command processing
│   │   ├── UpworkController.js
│   │   ├── ProfileController.js
│   │   ├── JobController.js
│   │   ├── ChannelController.js
│   │   └── CommandController.js
│   ├── services/        # Business logic and external API integration
│   │   ├── UpworkService.js
│   │   ├── OpenAIService.js
│   │   ├── ScoringService.js
│   │   └── ChannelService.js
│   ├── models/          # Database models and data access
│   │   ├── JobModel.js
│   │   ├── ProfileModel.js
│   │   └── ChannelModel.js
│   ├── utils/           # Utility functions and helpers
│   │   ├── Logger.js
│   │   └── Database.js
│   └── index.js         # Main application entry point
├── data/                # Database files
├── logs/                # Log files
├── package.json
└── README.md
```

## Architecture

The bot follows the **MVC (Model-View-Controller)** architecture:

- **Models**: Handle database operations and data persistence
- **Services**: Contain business logic and external API integrations
- **Controllers**: Handle Discord commands and coordinate between services
- **Utils**: Provide shared utilities like logging and database management

## Key Components

### Job Processing Pipeline

1. **Fetching**: `UpworkService` scrapes job listings from Upwork
2. **Scoring**: `ScoringService` uses OpenAI to score jobs (0-10)
3. **Categorization**: Jobs are categorized into channels (mobile, full-stack, etc.)
4. **Matching**: Jobs are compared to stored profiles for best matches
5. **Distribution**: Jobs are posted to appropriate Discord channels

### Database Schema

- **jobs**: Stores job information, scores, and metadata
- **profiles**: Stores user profiles for job matching
- **channels**: Stores Discord channel information and categories

### AI Integration

- **Job Scoring**: OpenAI analyzes job descriptions and requirements
- **Categorization**: AI determines appropriate job categories
- **Profile Matching**: AI compares job requirements to user profiles

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DISCORD_TOKEN` | Discord bot token | Required |
| `OPENAI_API_KEY` | OpenAI API key | Required |
| `LOG_LEVEL` | Logging level (error, warn, info, debug) | info |
| `JOB_FETCH_INTERVAL` | Cron expression for job fetching | `*/5 * * * *` |
| `MIN_SCORE_THRESHOLD` | Minimum job score to process | 5 |
| `HIGH_SCORE_THRESHOLD` | High score threshold for highlighting | 8 |

### Rate Limiting

The bot includes rate limiting to prevent API abuse:
- OpenAI API: 100 requests per minute
- Upwork scraping: 10 requests per minute

## Monitoring and Logging

The bot includes comprehensive logging:
- Console output for development
- File logging for production
- Different log levels (ERROR, WARN, INFO, DEBUG)
- Structured logging with timestamps

## Error Handling

- Graceful handling of API failures
- Fallback mechanisms for OpenAI service
- Automatic retry logic for failed requests
- Comprehensive error logging

## Security

- Environment variables for sensitive data
- Rate limiting to prevent abuse
- Input validation and sanitization
- Secure database connections

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

ISC License

## Support

For issues and questions, please create an issue on the GitHub repository. 