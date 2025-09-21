# Admin Login Instructions

## Default Admin Credentials

- **Email**: admin@bloodconnect.com
- **Password**: Admin@123

## How to Test Admin Login

### Method 1: Using the Test HTML Page

1. Open `test-admin-frontend.html` in your browser
2. Click the "Test Admin Login" button
3. Check the results displayed on the page

### Method 2: Using Node.js Script

1. Open a terminal in the project directory
2. Run the following command:
   ```
   node test-admin-login.js
   ```

### Method 3: Using cURL

```bash
curl -X POST http://localhost:3002/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bloodconnect.com","password":"Admin@123"}'
```

## How to Access Admin Dashboard

1. Navigate to `admin-login.html` in your browser
2. Enter the admin credentials:
   - Email: admin@bloodconnect.com
   - Password: Admin@123
3. Click "Access Dashboard"
4. You should be redirected to `admin-dashboard.html`

## Troubleshooting

### If Login Fails

1. Check that the backend server is running on port 3002
2. Verify the `.env` file exists with correct credentials
3. Check browser console for any JavaScript errors
4. Check server logs for authentication errors

### If Dashboard Doesn't Load

1. Ensure you're successfully logged in (check localStorage for admin data)
2. Verify all JavaScript files are loaded correctly
3. Check browser console for errors
4. Make sure the server is running and accessible

### Common Issues

1. **CORS Errors**: Make sure the backend is configured to accept requests from your frontend origin
2. **Authentication Headers**: The frontend sends `x-admin-email` and `x-admin-auth` headers for authentication
3. **Session Timeout**: Admin sessions expire after 30 minutes of inactivity

## Environment Variables

The application uses the following environment variables:

- `ADMIN_EMAIL`: Admin email address (default: admin@bloodconnect.com)
- `ADMIN_PASSWORD`: Admin password (default: Admin@123)
- `ADMIN_AUTH_TOKEN`: Authentication token (default: true)
- `MONGODB_URI`: MongoDB connection string
- `PORT`: Server port (default: 3002)
- `NODE_ENV`: Environment (development/production)

## File Locations

- Admin Login Page: `frontend/admin-login.html`
- Admin Dashboard: `frontend/admin-dashboard.html`
- Admin Login JavaScript: `frontend/js/admin-login.js`
- Admin Dashboard JavaScript: `frontend/js/admin-dashboard.js`
- Admin Backend Routes: `backend/routes/admin.js`
- Environment Configuration: `.env`