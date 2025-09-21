# Admin Dashboard Troubleshooting Guide

This guide helps troubleshoot common issues with the admin dashboard not fetching data from the database, especially when deployed to Render.

## Common Issues and Solutions

### 1. Database Connection Issues

**Symptoms:**
- Dashboard shows "Error" in statistics
- Tables show "Failed to load data"
- Console shows database connection errors

**Solutions:**
1. **Check Environment Variables in Render:**
   - Ensure `MONGODB_URI` is set with correct connection string
   - Verify the connection string works locally

2. **Verify MongoDB Atlas Configuration:**
   - Check that your cluster allows connections from Render IP addresses
   - Ensure database user has read/write permissions

3. **Check Render Logs:**
   - Look for "❌ MongoDB Atlas connection failed" messages
   - Verify successful connection with "✅ MongoDB Atlas Connected" messages

### 2. Authentication Issues

**Symptoms:**
- Redirected to login page unexpectedly
- 401 Unauthorized errors in browser console
- Dashboard loads but shows no data

**Solutions:**
1. **Verify Admin Credentials:**
   - Default credentials: admin@bloodconnect.com / Admin@123
   - Check that adminAuthMiddleware in `backend/routes/admin.js` is working

2. **Check Header Configuration:**
   - Ensure frontend sends correct headers:
     ```javascript
     {
       'x-admin-email': 'admin@bloodconnect.com',
       'x-admin-auth': 'true'
     }
     ```

3. **Test Authentication Endpoint:**
   - Visit `/api/admin/verify` with correct headers
   - Should return success response when authenticated

### 3. CORS Issues

**Symptoms:**
- Browser console shows CORS errors
- API calls fail with network errors
- Dashboard appears to load but no data populates

**Solutions:**
1. **Verify FRONTEND_URL in Render:**
   - Should be set to your Render domain: `https://your-app-name.onrender.com`

2. **Check CORS Configuration:**
   - Review `corsOptions` in `server.js`
   - Ensure Render domains are allowed

3. **Test CORS:**
   - Visit `/api/cors-test` endpoint
   - Should return success response

### 4. API Endpoint Issues

**Symptoms:**
- 404 errors for admin endpoints
- Dashboard statistics remain at zero
- Specific data tables fail to load

**Solutions:**
1. **Verify API Routes:**
   - Check that all required endpoints exist in `backend/routes/admin.js`
   - Ensure routes are properly registered in `server.js`

2. **Test Individual Endpoints:**
   - `/api/admin/dashboard-stats`
   - `/api/admin/chart-stats`
   - `/api/admin/users`
   - `/api/admin/donations`
   - `/api/admin/requests`

3. **Check Route Parameters:**
   - Ensure pagination parameters are correctly handled
   - Verify search and filter parameters work

### 5. Network and Timeout Issues

**Symptoms:**
- Dashboard loads slowly
- Some API calls time out
- Intermittent data loading failures

**Solutions:**
1. **Check Render Service Tier:**
   - Free tier may have performance limitations
   - Consider upgrading for better performance

2. **Optimize Database Queries:**
   - Review aggregation pipelines in admin routes
   - Add indexes to frequently queried fields

3. **Implement Caching:**
   - Use the existing caching mechanism in admin-dashboard.js
   - Adjust cache duration as needed

## Debugging Steps

### 1. Check Browser Console
- Open Developer Tools (F12)
- Look for error messages
- Check Network tab for failed API requests
- Verify API responses

### 2. Check Render Logs
- Go to your service in Render dashboard
- Click on "Logs" tab
- Look for error messages
- Check database connection status

### 3. Test API Endpoints Directly
Use curl or Postman to test endpoints:
```bash
# Test health endpoint
curl https://your-app-name.onrender.com/api/health

# Test admin stats (requires authentication headers)
curl -H "x-admin-email: admin@bloodconnect.com" -H "x-admin-auth: true" \
  https://your-app-name.onrender.com/api/admin/dashboard-stats
```

### 4. Verify Environment Variables
Check that all required environment variables are set in Render:
- `MONGODB_URI`
- `JWT_SECRET`
- `FRONTEND_URL`

## Specific Fixes for Render Deployment

### 1. Update Database Configuration
Ensure `backend/config/database.js` properly handles missing environment variables:

```javascript
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
    throw new Error('MONGODB_URI environment variable is not defined');
}
```

### 2. Verify CORS Configuration
Ensure `server.js` allows Render domains:

```javascript
const isRenderDomain = origin && origin.includes('.onrender.com');
if (allowedOrigins.indexOf(origin) !== -1 || isRenderDomain) {
    callback(null, true);
}
```

### 3. Check Port Configuration
Ensure the server uses Render's PORT environment variable:

```javascript
const PORT = process.env.PORT || 3002;
```

## Testing Checklist

### Before Deployment
- [ ] Test locally with production environment variables
- [ ] Verify all API endpoints work correctly
- [ ] Test admin authentication flow
- [ ] Check database connection with production credentials

### After Deployment
- [ ] Verify service is live in Render dashboard
- [ ] Test health check endpoint
- [ ] Test admin dashboard access
- [ ] Check that all statistics load correctly
- [ ] Verify data tables populate with data

## Additional Resources

- Render Documentation: https://render.com/docs
- MongoDB Atlas Documentation: https://docs.atlas.mongodb.com/
- Express.js Documentation: https://expressjs.com/

If issues persist after following this guide, please provide:
1. Render logs showing errors
2. Browser console output
3. Screenshots of the issue
4. Steps to reproduce the problem