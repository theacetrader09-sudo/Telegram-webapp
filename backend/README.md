# Backend API - Phase 1

Node.js + Express backend for Telegram Web App with Prisma, Redis, and webhook integration.

## Environment Variables

Create `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Required environment variables:

```env
# Server
PORT=5000
NODE_ENV=development

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/telegram_app

# Redis
REDIS_URL=redis://localhost:6379
```

## Installation & Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Generate Prisma Client

```bash
npm run prisma:generate
```

### 3. Run Database Migrations

```bash
npm run prisma:migrate
```

This creates the database schema. For first-time setup, it will prompt for a migration name (e.g., "init").

### 4. Start Development Server

```bash
# Standard start
npm start

# Development mode with auto-reload
npm run dev
```

Server runs on `http://localhost:5000` (or PORT from .env).

## Setting Up Telegram Bot Webhook

### 1. Get Bot Token

- Go to [@BotFather](https://t.me/BotFather)
- Send `/newbot` or use existing bot
- Copy the bot token

### 2. Set Webhook URL

For production/staging:
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-domain.com/bot/webhook",
    "allowed_updates": ["message"]
  }'
```

For local development with ngrok:
```bash
# Terminal 1: Start ngrok
ngrok http 5000

# Terminal 2: Set webhook to ngrok URL
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-ngrok-url.ngrok.io/bot/webhook"
  }'
```

### 3. Verify Webhook

```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

### 4. Delete Webhook (if needed)

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/deleteWebhook"
```

## API Endpoints

### Health Check
```bash
GET /health
```

### Authentication
```bash
POST /auth/telegram-login
Body: { "initData": "<telegram_init_data_string>" }
Response: { "success": true, "token": "...", "user": {...} }
```

### Bot Webhook
```bash
POST /bot/webhook
Body: Telegram Update object
```

## Testing

### Run Unit Tests

```bash
# Run all tests
npm test

# Run in watch mode
npm run test:watch

# Run specific test file
npm test -- src/utils/__tests__/verifyTelegram.test.js
```

### Test Telegram Login Endpoint

```bash
curl -X POST http://localhost:5000/auth/telegram-login \
  -H "Content-Type: application/json" \
  -d '{
    "initData": "user=%7B%22id%22%3A123456789%2C%22first_name%22%3A%22John%22%2C%22username%22%3A%22johndoe%22%7D&auth_date=1704067200&hash=<VALID_HASH>"
  }'
```

**Note:** Replace `<VALID_HASH>` with a real hash from Telegram WebApp. For testing, you can use the test endpoint which will fail validation but show the flow.

### Test Bot Webhook

```bash
curl -X POST http://localhost:5000/bot/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "message_id": 1,
      "chat": {
        "id": 123456789,
        "type": "private"
      },
      "text": "/start REF_12345",
      "date": 1234567890
    }
  }'
```

### Verify Redis Storage

After sending webhook with `/start REF_12345`:

```bash
# Get stored referral code
redis-cli GET "tempReferral:123456789"
# Expected: "REF_12345"

# Check expiration time (should be ~86400 seconds = 24 hours)
redis-cli TTL "tempReferral:123456789"
# Expected: 86399 (or similar, decreasing)

# List all referral keys
redis-cli KEYS "tempReferral:*"
```

## Database Management

### Prisma Commands

```bash
# Generate Prisma Client (after schema changes)
npm run prisma:generate

# Create new migration
npm run prisma:migrate

# Open Prisma Studio (database GUI)
npm run prisma:studio
```

### Database Schema

The schema includes:
- `User` model with telegramId, username, referral chain
- Self-referential relation for referral tracking
- Automatic timestamps (createdAt, updatedAt)

## Project Structure

```
backend/
├── src/
│   ├── app.js                 # Express app setup
│   ├── index.js               # Server entry point
│   ├── controllers/
│   │   └── auth.controller.js # Authentication logic
│   ├── routes/
│   │   ├── auth.routes.js     # Auth routes
│   │   └── bot.routes.js      # Bot webhook routes
│   ├── services/
│   │   └── user.service.js    # User business logic
│   ├── utils/
│   │   └── verifyTelegram.js  # Telegram initData validation
│   ├── bot/
│   │   ├── webhook.controller.js # Webhook handler
│   │   └── bot.service.js     # Redis referral storage
│   └── lib/
│       └── prisma.js          # Prisma client instance
├── prisma/
│   └── schema.prisma          # Database schema
└── package.json
```

## Troubleshooting

### Database Connection Issues
```bash
# Test PostgreSQL connection
psql $DATABASE_URL

# Check if database exists
psql -l | grep telegram_app
```

### Redis Connection Issues
```bash
# Test Redis connection
redis-cli ping
# Should return: PONG

# Check Redis is running
redis-cli INFO server
```

### Prisma Issues
```bash
# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# View migration status
npx prisma migrate status
```

### Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>
```

## Development Tips

1. **Hot Reload**: Use `npm run dev` for automatic server restart on file changes
2. **Database Changes**: Always create migrations for schema changes
3. **Environment Variables**: Never commit `.env` file
4. **Logging**: Check console output for detailed error messages
5. **Testing**: Run tests before committing changes

## Next Steps

See root `README.md` for Phase 2 recommendations and security enhancements.
