# 🚀 Blood Donation Website - Deployment Guide

## Deploy to Render using GitHub

### Prerequisites
- GitHub account
- Render account (free tier available)
- MongoDB Atlas account (free tier available)

### Step 1: Prepare Your Repository

1. **Push your code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Blood Donation Website"
   git branch -M main
   git remote add origin https://github.com/yourusername/blood-donation-website.git
   git push -u origin main
   ```

2. **Important files included:**
   - ✅ `package.json` - Dependencies and scripts
   - ✅ `render.yaml` - Render deployment configuration
   - ✅ `.gitignore` - Excludes sensitive files
   - ✅ `env.example` - Environment variables template
   - ✅ `backend/server.js` - Main server file
   - ✅ `frontend/` - All frontend files

### Step 2: Set Up MongoDB Atlas

1. **Create MongoDB Atlas account:**
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create a free cluster
   - Create a database user
   - Get your connection string

2. **Connection string format:**
   ```
   mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
   ```

### Step 3: Deploy to Render

1. **Connect GitHub to Render:**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure the service:**
   - **Name:** `blood-donation-website`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/api/health`

3. **Set Environment Variables:**
   In Render dashboard, go to Environment tab and add:
   ```
   NODE_ENV=production
   MONGODB_URI=your-mongodb-connection-string
   JWT_SECRET=your-super-secret-jwt-key
   FRONTEND_URL=https://your-app-name.onrender.com
   ```

4. **Deploy:**
   - Click "Create Web Service"
   - Render will automatically build and deploy your app
   - Wait for deployment to complete (5-10 minutes)

### Step 4: Post-Deployment

1. **Update CORS settings:**
   - After deployment, update `FRONTEND_URL` in Render dashboard
   - Use your actual Render domain: `https://your-app-name.onrender.com`

2. **Test your deployment:**
   - Visit your Render URL
   - Test all features: registration, login, donation, requests
   - Check admin dashboard

### Step 5: Custom Domain (Optional)

1. **Add custom domain in Render:**
   - Go to your service settings
   - Add your custom domain
   - Update DNS records as instructed

2. **Update environment variables:**
   - Update `FRONTEND_URL` with your custom domain

## 🔧 Troubleshooting

### Common Issues:

1. **Build fails:**
   - Check Node.js version (requires 18+)
   - Verify all dependencies in package.json

2. **Database connection fails:**
   - Verify MongoDB URI is correct
   - Check IP whitelist in MongoDB Atlas
   - Ensure database user has proper permissions

3. **CORS errors:**
   - Update `FRONTEND_URL` environment variable
   - Check CORS configuration in server.js

4. **Static files not loading:**
   - Verify frontend files are in the repository
   - Check file paths in server.js

### Environment Variables Reference:

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `3002` (auto-set by Render) |
| `MONGODB_URI` | Database connection | `mongodb+srv://...` |
| `JWT_SECRET` | JWT signing key | `your-secret-key` |
| `FRONTEND_URL` | Frontend domain | `https://your-app.onrender.com` |

## 📊 Monitoring

- **Health Check:** `https://your-app.onrender.com/api/health`
- **API Status:** `https://your-app.onrender.com/api/test`
- **Logs:** Available in Render dashboard

## 🔄 Updates

To update your deployed app:
1. Push changes to GitHub
2. Render automatically redeploys
3. Check deployment logs for any issues

## 💰 Costs

- **Render Free Tier:** 750 hours/month (sufficient for small projects)
- **MongoDB Atlas Free Tier:** 512MB storage
- **Total Cost:** $0/month (with free tiers)

---

**Need help?** Check the logs in Render dashboard or contact support.