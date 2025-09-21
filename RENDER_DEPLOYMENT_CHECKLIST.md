# Render Deployment Checklist

This checklist will help you ensure all necessary steps are completed for a successful deployment to Render.

## Pre-Deployment Checklist

### 1. Environment Variables Configuration
- [ ] Set `MONGODB_URI` in Render dashboard with your actual MongoDB connection string
- [ ] Set `JWT_SECRET` in Render dashboard with a strong secret
- [ ] Set `EMAIL_USER` and `EMAIL_PASS` for email notifications
- [ ] Set `FRONTEND_URL` to your Render domain (e.g., `https://your-app-name.onrender.com`)
- [ ] Verify all environment variables are correctly set in Render

### 2. Database Configuration
- [ ] Ensure MongoDB Atlas cluster allows connections from Render
- [ ] Verify database user credentials are correct
- [ ] Check that the database has the required collections

### 3. GitHub Repository
- [ ] Ensure all necessary files are committed and pushed to GitHub
- [ ] Verify `.env` files are in `.gitignore` (should not be committed)
- [ ] Check that `package.json` has correct start script

### 4. Render Configuration
- [ ] Verify `render.yaml` is correctly configured
- [ ] Check that build and start commands are correct
- [ ] Confirm health check path is set to `/api/health`

## Deployment Steps

### 1. Connect to Render
- [ ] Log in to your Render account
- [ ] Connect your GitHub repository
- [ ] Select the correct branch for deployment

### 2. Configure Service
- [ ] Set service name (e.g., `blood-donation-website`)
- [ ] Verify environment is set to `node`
- [ ] Confirm region (Oregon is recommended)

### 3. Set Environment Variables
- [ ] Add all required environment variables as listed in Pre-Deployment Checklist
- [ ] Double-check values are correct

### 4. Deploy
- [ ] Click "Create Web Service"
- [ ] Wait for build to complete
- [ ] Monitor deployment logs for any errors

## Post-Deployment Verification

### 1. Check Service Status
- [ ] Verify service is "Live" in Render dashboard
- [ ] Check that health check is passing
- [ ] Confirm service is accessible via browser

### 2. Test API Endpoints
- [ ] Visit `https://your-app-name.onrender.com/api/health` (should return success)
- [ ] Visit `https://your-app-name.onrender.com/api/test` (should return success)
- [ ] Test admin endpoints (should return 401 Unauthorized when not authenticated)

### 3. Test Frontend Pages
- [ ] Visit homepage (`/`)
- [ ] Test login page (`/login`)
- [ ] Test admin login page (`/admin-login`)
- [ ] Verify CSS and JavaScript assets are loading correctly

### 4. Test Admin Dashboard
- [ ] Log in to admin dashboard
- [ ] Verify dashboard loads without errors
- [ ] Check that statistics are displayed
- [ ] Test data tables (users, donations, requests)

### 5. Monitor Logs
- [ ] Check for any error messages in logs
- [ ] Look for database connection success messages
- [ ] Monitor for any runtime errors

## Troubleshooting Common Issues

### Database Connection Issues
- [ ] Verify `MONGODB_URI` is correctly set
- [ ] Check MongoDB Atlas network access settings
- [ ] Ensure database user has correct permissions

### CORS Issues
- [ ] Verify `FRONTEND_URL` is set correctly
- [ ] Check that CORS configuration in `server.js` allows your domain
- [ ] Look for CORS error messages in browser console

### Admin Authentication Issues
- [ ] Verify admin credentials are correct
- [ ] Check that admin headers are being sent correctly
- [ ] Look for authentication error messages in logs

### Performance Issues
- [ ] Check if service is on free tier (may have limitations)
- [ ] Monitor response times in Render dashboard
- [ ] Check for any timeout errors

## Additional Recommendations

### Security
- [ ] Rotate JWT secrets periodically
- [ ] Use strong passwords for database users
- [ ] Enable MongoDB Atlas security features

### Monitoring
- [ ] Set up custom domains if needed
- [ ] Configure SSL certificates (Render provides automatically)
- [ ] Set up monitoring alerts for downtime

### Optimization
- [ ] Consider upgrading from free tier for better performance
- [ ] Implement caching strategies
- [ ] Optimize database queries if needed

## Support Resources

If you encounter issues:
1. Check Render documentation: https://render.com/docs
2. Review application logs in Render dashboard
3. Verify all environment variables are correctly set
4. Check MongoDB Atlas connection settings
5. Review CORS configuration in server.js

For additional help, you can:
- Check the Render community forums
- Contact Render support
- Review the application documentation