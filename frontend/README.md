# Frontend - Telegram Web App

Next.js frontend for Telegram Web App with auto-login, dashboard, and referral system.

## Environment Variables

Create `.env.local` file (optional, defaults provided):

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_BOT_USERNAME=your_bot_username
```

## Installation & Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### 3. Build for Production

```bash
npm run build
npm start
```

## Testing Locally (Without Telegram)

Since the app requires Telegram WebApp environment, simulate it in the browser:

### Step 1: Start Next.js Dev Server

```bash
cd frontend
npm run dev
```

### Step 2: Open Browser

Navigate to `http://localhost:3000`

### Step 3: Open Browser Console

Press `F12` (Windows/Linux) or `Cmd+Option+I` (Mac)

### Step 4: Simulate Telegram WebApp

Paste this code in the console:

```javascript
// Simulate Telegram WebApp object
window.Telegram = {
  WebApp: {
    ready: () => console.log('Telegram WebApp ready'),
    expand: () => console.log('Telegram WebApp expanded'),
    initDataUnsafe: {
      user: {
        id: 123456789,
        first_name: 'John',
        last_name: 'Doe',
        username: 'johndoe',
        language_code: 'en'
      }
    },
    initData: 'user=%7B%22id%22%3A123456789%2C%22first_name%22%3A%22John%22%2C%22last_name%22%3A%22Doe%22%2C%22username%22%3A%22johndoe%22%7D&auth_date=1704067200&hash=test_hash_placeholder'
  }
};

// Reload the page to trigger auto-login
window.location.reload();
```

**Note:** The `initData` hash is a placeholder. Real authentication requires a valid hash from Telegram. The backend will reject invalid hashes, but you can test the UI flow.

### Step 5: Alternative - Use Test Login Button

When Telegram WebApp is not detected, the page shows a "Test Login" button. Click it to test the authentication flow (note: will fail backend validation without real Telegram initData).

## Testing with Real Telegram WebApp

### 1. Set Up Bot Web App URL

- Go to [@BotFather](https://t.me/BotFather)
- Send `/newapp` command
- Select your bot
- Provide the Web App URL: `https://your-domain.com` (must be HTTPS)

### 2. Open Web App

- Open your bot in Telegram
- Click the Web App button (or send `/start`)
- The app should auto-login and redirect to dashboard

### 3. Test Referral Flow

1. Generate referral link from dashboard: `https://t.me/YourBot?start=REF_<user_id>`
2. Share link with another user
3. User clicks link and sends `/start REF_<user_id>` to bot
4. Referral code stored in Redis
5. User opens Web App
6. Referral code applied during login

## Features

- **Auto-login**: Automatically authenticates when opened in Telegram WebApp
- **Token Storage**: Stores authentication token in `localStorage` as `authToken`
- **User Storage**: Stores user data in `localStorage` as `user`
- **Protected Dashboard**: Dashboard requires authentication (redirects if not logged in)
- **Referral Links**: Generates referral links using user ID from backend
- **Test Mode**: Allows testing without Telegram environment

## Project Structure

```
frontend/
├── app/
│   ├── page.js              # Home page with auto-login
│   └── dashboard/
│       └── page.js          # Protected dashboard page
├── services/
│   └── api.js               # API client with token authentication
└── package.json
```

## API Client Usage

The `services/api.js` provides helper functions:

```javascript
import { post, get } from '../services/api';

// POST request (automatically includes Authorization header if token exists)
const response = await post('/auth/telegram-login', { initData });

// GET request (automatically includes Authorization header if token exists)
const data = await get('/some-endpoint');
```

## Troubleshooting

### Auto-login Not Working

1. Check browser console for errors
2. Verify `NEXT_PUBLIC_API_URL` is correct
3. Ensure backend is running
4. Check `localStorage` for stored token: `localStorage.getItem('authToken')`

### Dashboard Not Loading

1. Check if token exists: `localStorage.getItem('authToken')`
2. Clear localStorage and try again:
   ```javascript
   localStorage.clear();
   window.location.reload();
   ```
3. Verify backend is accessible

### Referral Link Not Working

1. Check `NEXT_PUBLIC_BOT_USERNAME` is set correctly
2. Verify bot username matches your actual bot
3. Test link format: `https://t.me/<bot_username>?start=REF_<user_id>`

### CORS Errors

- Ensure backend CORS is configured correctly
- Check `NEXT_PUBLIC_API_URL` matches backend URL
- Verify backend is running

## Development Tips

1. **Hot Reload**: Next.js automatically reloads on file changes
2. **Browser DevTools**: Use React DevTools for component debugging
3. **Network Tab**: Monitor API requests in browser DevTools
4. **localStorage**: Check Application tab in DevTools for stored data
5. **Console Logs**: Check console for detailed error messages

## Build & Deploy

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

### Environment Variables for Production

Set these in your hosting platform:

- `NEXT_PUBLIC_API_URL` - Your production backend URL
- `NEXT_PUBLIC_BOT_USERNAME` - Your bot username

## Next Steps

See root `README.md` for Phase 2 recommendations and additional features.
