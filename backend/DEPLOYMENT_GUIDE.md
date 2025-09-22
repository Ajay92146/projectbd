# Deployment Guide for BloodConnect Admin Panel

## Render Deployment Configuration

When deploying to Render, you need to configure the following environment variables in the Render dashboard:

### Required Environment Variables

1. **ADMIN_EMAIL** - Admin email address for login
2. **ADMIN_PASSWORD** - Admin password for login
3. **ADMIN_AUTH_TOKEN** - Authentication token for admin API calls
4. **MONGODB_URI** - MongoDB connection string
5. **JWT_SECRET** - Secret key for JWT token generation
6. **EMAIL_USER** - Email address for sending notifications
7. **EMAIL_PASS** - Password for email account
8. **FRONTEND_URL** - URL of the frontend application
9. **NODE_ENV** - Set to "production"

### Port Configuration

Render automatically sets the PORT environment variable. Your application should use `process.env.PORT` for the server port.

In your server.js file, make sure you have:
```javascript
const PORT = process.env.PORT || 3002;
```

### Build Commands

For Render deployment, use these build commands:

**Build Command:**
```
npm install
```

**Start Command:**
```
node backend/server.js
```

## Environment-Specific Configuration

### Production Environment

In production, the frontend and backend are served from the same domain. The API calls should use the same origin:

```javascript
// For production environments
if (process.env.NODE_ENV === 'production') {
    // API is served from the same domain
    const apiUrl = `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}/api`;
}
```

### Development Environment

In development, the frontend runs on a different port than the backend:

```javascript
// For development (localhost)
if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//${hostname}:3002/api`;
}
```

## Admin Panel Access

After deployment, access the admin panel at:
`https://your-app-name.onrender.com/admin-login.html`

Use the credentials you set in the environment variables:
- Email: [ADMIN_EMAIL](file://c:\Users\Ajay\Videos\blood%20donation\backend\routes\admin.js#L24-L24)
- Password: `ADMIN_PASSWORD`

## Troubleshooting Deployment Issues

### 1. Environment Variables Not Set
Make sure all required environment variables are configured in the Render dashboard.

### 2. Port Conflicts
Don't hardcode ports in your application. Always use `process.env.PORT`.

### 3. CORS Issues
Ensure your backend is configured to accept requests from your frontend domain.

### 4. Database Connection
Verify that [MONGODB_URI](file://c:\Users\Ajay\Videos\blood%20donation\backend\server.js#L14-L14) is correctly set and the database is accessible.

### 5. Admin Authentication
Check that [ADMIN_EMAIL](file://c:\Users\Ajay\Videos\blood%20donation\backend\routes\admin.js#L24-L24) and `ADMIN_PASSWORD` are correctly set in environment variables.

## Testing Deployment

Before deploying to production, test your configuration locally by setting:
```bash
export NODE_ENV=production
export PORT=80
```

Then run your application to verify it works in production mode.