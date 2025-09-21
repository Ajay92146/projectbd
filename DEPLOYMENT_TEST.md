# Deployment Test Guide

## Pre-deployment Checklist

Before deploying to Render, ensure you have:

1. [ ] Set all required environment variables in Render dashboard
2. [ ] Verified MongoDB connection string is correct
3. [ ] Tested the application locally in production mode
4. [ ] Confirmed admin credentials work
5. [ ] Verified CORS configuration allows your domain

## Testing in Production Mode Locally

To test your application in production mode locally:

1. Set environment variables:
```bash
export NODE_ENV=production
export PORT=8080
```

2. Run your application:
```bash
node backend/server.js
```

3. Access the application at `http://localhost:8080`

## Environment Variables to Set in Render

In the Render dashboard, set these environment variables:

| Variable Name | Description | Example Value |
|---------------|-------------|---------------|
| ADMIN_EMAIL | Admin login email | admin@yourdomain.com |
| ADMIN_PASSWORD | Admin login password | YourSecurePassword123 |
| ADMIN_AUTH_TOKEN | Admin authentication token | true |
| MONGODB_URI | MongoDB connection string | mongodb+srv://user:pass@cluster.mongodb.net/db |
| JWT_SECRET | JWT secret key | your_jwt_secret_key |
| EMAIL_USER | Email for notifications | notifications@yourdomain.com |
| EMAIL_PASS | Email password | your_email_password |
| FRONTEND_URL | Your frontend URL | https://your-app.onrender.com |
| NODE_ENV | Environment | production |

## Verifying Deployment

After deployment, verify these endpoints work:

1. **Main Page**: `https://your-app.onrender.com/`
2. **API Test**: `https://your-app.onrender.com/api/test`
3. **Admin Login**: `https://your-app.onrender.com/admin-login`
4. **Admin Dashboard**: `https://your-app.onrender.com/admin-dashboard` (after login)

## Troubleshooting Common Issues

### 1. Application Crashes on Startup
Check the logs in Render dashboard for error messages.

### 2. Admin Login Fails
Verify [ADMIN_EMAIL](file://c:\Users\Ajay\Videos\blood%20donation\backend\routes\admin.js#L24-L24) and `ADMIN_PASSWORD` environment variables are set correctly.

### 3. Database Connection Issues
Ensure [MONGODB_URI](file://c:\Users\Ajay\Videos\blood%20donation\backend\server.js#L14-L14) is correct and the database is accessible.

### 4. CORS Errors
Check that `FRONTEND_URL` is set correctly in environment variables.

### 5. Port Issues
Don't hardcode ports in your application. Always use `process.env.PORT`.

## Post-Deployment Testing

1. Test admin login with your credentials
2. Verify dashboard loads and displays data
3. Check that all API endpoints work
4. Test user registration and login
5. Verify email notifications work (if configured)