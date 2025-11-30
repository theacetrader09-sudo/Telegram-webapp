# Telegram Web App - Phase 1

Full-stack Telegram Web App with authentication, referral system, and bot webhook integration.

## Project Structure

```
.
├── backend/          # Node.js + Express API with Prisma & Redis
├── frontend/         # Next.js frontend
├── infra/            # Docker configuration
└── README.md
```

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Redis server
- Telegram Bot Token (from [@BotFather](https://t.me/BotFather))

## Quick Start

### 1. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your configuration (see backend/README.md)
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend
npm install
# Optional: Create .env.local with NEXT_PUBLIC_API_URL and NEXT_PUBLIC_BOT_USERNAME
npm run dev
```

### 3. Access Applications

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/health

## Docker Compose (Alternative)

```bash
cd infra
export TELEGRAM_BOT_TOKEN=your_bot_token_here
export DATABASE_URL=postgresql://user:password@localhost:5432/telegram_app
export REDIS_URL=redis://localhost:6379
docker-compose up --build
```

## Environment Variables

### Backend (.env)
- `PORT=5000` - Server port
- `TELEGRAM_BOT_TOKEN` - Telegram bot token from BotFather
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string (default: `redis://localhost:6379`)
- `NODE_ENV=development` - Environment mode

### Frontend (.env.local)
- `NEXT_PUBLIC_API_URL=http://localhost:5000` - Backend API URL
- `NEXT_PUBLIC_BOT_USERNAME` - Your bot username for referral links

## Testing

### Run Tests

```bash
# Backend tests
cd backend
npm test

# Test specific file
npm test -- src/utils/__tests__/verifyTelegram.test.js
```

### Manual Testing

See `backend/README.md` and `frontend/README.md` for detailed testing instructions.

## Staging Checklist

### 1. Create Staging Bot
- Go to [@BotFather](https://t.me/BotFather)
- Send `/newbot` command
- Follow prompts to create staging bot
- Save the bot token to staging `.env`

### 2. Set Up Staging Database
```bash
# Create PostgreSQL database
createdb telegram_app_staging

# Update DATABASE_URL in staging .env
DATABASE_URL=postgresql://user:password@staging-db-host:5432/telegram_app_staging
```

### 3. Configure Staging Environment
- Copy `.env.example` to `.env.staging`
- Set all required environment variables
- Ensure Redis is accessible at staging URL

### 4. Deploy Backend
- Deploy backend to staging server
- Run Prisma migrations: `npm run prisma:migrate`
- Verify health endpoint: `curl https://staging-api.example.com/health`

### 5. Set Telegram Webhook
```bash
curl -X POST "https://api.telegram.org/bot<STAGING_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://staging-api.example.com/bot/webhook",
    "allowed_updates": ["message"]
  }'
```

### 6. Configure Bot Web App URL
- Send `/newapp` to [@BotFather](https://t.me/BotFather)
- Select your staging bot
- Set Web App URL: `https://staging-frontend.example.com`

### 7. Test Deep Link Flow
- Send `/start REF_TEST123` to your staging bot
- Verify Redis key: `redis-cli GET "tempReferral:<telegram_id>"`
- Open Web App from bot
- Verify referral code is applied during login

### 8. Verify Endpoints
- [ ] Health check: `GET /health`
- [ ] Telegram login: `POST /auth/telegram-login`
- [ ] Bot webhook: `POST /bot/webhook`
- [ ] Frontend auto-login flow
- [ ] Dashboard referral link generation

## Security Notes

### Current Phase 1 Security Status

⚠️ **Important Security Considerations:**

1. **JWT Tokens**: Currently using placeholder tokens. Implement proper JWT with:
   - Secret key stored in environment variables
   - Token expiration (recommended: 7-30 days)
   - Refresh token mechanism

2. **Environment Variables**: Never commit `.env` files. Use `.env.example` as template.

3. **Telegram Bot Token**: Keep bot token secure. Rotate if compromised.

4. **Database**: Use strong passwords and SSL connections in production.

5. **Redis**: Secure Redis with authentication and firewall rules.

6. **CORS**: Configure CORS properly for production (currently allows all origins).

7. **Rate Limiting**: Not implemented. Add rate limiting for API endpoints.

8. **Input Validation**: Basic validation exists. Add more comprehensive validation.

9. **Error Handling**: Avoid exposing sensitive error details in production.

10. **HTTPS**: Always use HTTPS in production. Telegram requires HTTPS for Web Apps.

### Recommended Security Enhancements (Phase 2)

- Implement proper JWT authentication with refresh tokens
- Add rate limiting middleware
- Implement request logging and monitoring
- Add input sanitization and validation
- Set up CORS whitelist for production
- Add API key authentication for webhook endpoints
- Implement database connection pooling
- Add health check monitoring
- Set up error tracking (e.g., Sentry)

## Phase 2 Recommended Tasks

### Authentication & Security
- [ ] Implement real JWT tokens with `jsonwebtoken`
- [ ] Add refresh token mechanism
- [ ] Implement token blacklist/revocation
- [ ] Add rate limiting (express-rate-limit)
- [ ] Implement CORS whitelist
- [ ] Add request validation middleware

### Features
- [ ] User profile management
- [ ] Referral statistics and analytics
- [ ] Admin dashboard
- [ ] Notification system
- [ ] Multi-language support

### Infrastructure
- [ ] Production deployment setup
- [ ] CI/CD pipeline
- [ ] Database backups
- [ ] Monitoring and logging (e.g., Winston, PM2)
- [ ] Error tracking (e.g., Sentry)
- [ ] Load balancing

### Testing
- [ ] Integration tests
- [ ] E2E tests (Playwright/Cypress)
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Performance testing

## Troubleshooting

### Backend Issues
- Check database connection: `psql $DATABASE_URL`
- Check Redis connection: `redis-cli ping`
- Verify Prisma client: `npm run prisma:generate`
- Check logs for detailed errors

### Frontend Issues
- Clear browser cache and localStorage
- Check browser console for errors
- Verify `NEXT_PUBLIC_API_URL` is correct
- Ensure backend is running

### Telegram Issues
- Verify bot token is correct
- Check webhook status: `curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"`
- Ensure Web App URL is HTTPS
- Check bot permissions in BotFather

## Support

For issues and questions:
1. Check backend/README.md for backend-specific details
2. Check frontend/README.md for frontend-specific details
3. Review logs for error messages
4. Verify all environment variables are set correctly
