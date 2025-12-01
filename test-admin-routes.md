# Test Admin Routes

Test these endpoints to verify backend is working:

## 1. Test Admin Login (Public - No Auth Required)
```bash
curl -X POST https://telegram-webapp-2w70.onrender.com/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"forfxai@gmail.com","password":"Markus@72"}'
```

Expected: Should return `{"success":true,"token":"admin_...","admin":{...}}`

## 2. Test Health Endpoint
```bash
curl https://telegram-webapp-2w70.onrender.com/health
```

Expected: Should return `{"status":"ok","timestamp":"..."}`

## 3. Test Admin Verify (Requires Token)
```bash
# First get token from login, then:
curl -X GET https://telegram-webapp-2w70.onrender.com/admin/auth/verify \
  -H "Authorization: Bearer admin_<your_token_here>"
```

Expected: Should return `{"success":true,"admin":{...}}`

## 4. Test Admin Deposits (Requires Token)
```bash
curl -X GET https://telegram-webapp-2w70.onrender.com/admin/deposits/pending \
  -H "Authorization: Bearer admin_<your_token_here>"
```

Expected: Should return `{"success":true,"deposits":[]}`

