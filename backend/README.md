# Blood Donation Website

A complete blood donation management system built with HTML, CSS, JavaScript, Node.js, Express, and MongoDB Atlas.

## Project Structure

```
blood-donation/
├── frontend/
│   ├── index.html              # Home page
│   ├── donate.html             # Want to Donate Blood page
│   ├── request.html            # Request Blood page
│   ├── about.html              # About page
│   ├── contact.html            # Contact page
│   ├── login.html              # Login page
│   ├── css/
│   │   ├── style.css           # Main stylesheet
│   │   ├── animations.css      # Animation styles
│   │   └── responsive.css      # Responsive design
│   ├── js/
│   │   ├── main.js             # Main JavaScript functionality
│   │   ├── forms.js            # Form handling and validation
│   │   ├── animations.js       # Animation controls
│   │   └── api.js              # API communication
│   └── assets/
│       ├── images/
│       └── icons/
├── backend/
│   ├── server.js               # Main server file
│   ├── config/
│   │   └── database.js         # MongoDB connection
│   ├── models/
│   │   ├── Donor.js            # Donor schema
│   │   ├── Request.js          # Blood request schema
│   │   └── User.js             # User schema
│   ├── routes/
│   │   ├── donors.js           # Donor routes
│   │   ├── requests.js         # Request routes
│   │   └── auth.js             # Authentication routes
│   ├── middleware/
│   │   └── auth.js             # Authentication middleware
│   └── utils/
│       └── validation.js       # Input validation utilities
├── package.json                # Project dependencies
├── .env                        # Environment variables
├── .gitignore                  # Git ignore file
└── README.md                   # Project documentation
```

## Features

- **Home Page**: Comprehensive blood donation information with FAQs
- **Donor Registration**: Complete form for blood donors
- **Blood Request**: Search and request blood by location and type
- **User Authentication**: Login system for users
- **Responsive Design**: Mobile-friendly interface
- **Modern UI**: Smooth animations and red/white theme

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas
- **Styling**: Custom CSS with animations
- **Theme**: Red and white color scheme

## Installation and Setup

### Prerequisites

- Node.js (v14.0.0 or higher)
- MongoDB Atlas account
- Git

### Step-by-Step Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd blood-donation
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env`
   - Update the following variables in `.env`:
   ```env
   PORT=3000
   MONGODB_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_super_secret_jwt_key_here
   EMAIL_USER=blooddonation657@gmail.com
   EMAIL_PASS=your_email_password
   CONTACT_PHONE=9136706650
   ```

4. **Set up MongoDB Atlas**
   - Create a MongoDB Atlas account at https://www.mongodb.com/atlas
   - Create a new cluster
   - Create a database user
   - Get your connection string and update `MONGODB_URI` in `.env`

5. **Start the development server**
   ```bash
   npm run dev
   ```
   Or for production:
   ```bash
   npm start
   ```

6. **Access the application**
   - Open your browser and go to `http://localhost:3000`

## Deployment (Render)

This repo includes a `render.yaml` Blueprint for one-click deployment of the full stack (backend serves the frontend).

### Quick steps

1. Push this repository to GitHub.
2. Go to Render → New → Blueprint → select your GitHub repo.
3. When prompted, set environment variables:
   - `NODE_ENV=production`
   - `MONGODB_URI` = Your MongoDB Atlas connection string
   - `JWT_SECRET` = A strong random secret
   - `FRONTEND_URL` = Your Render service URL (e.g., `https://your-app.onrender.com`)
4. Deploy. Render will use:
   - Build: `npm install`
   - Start: `node backend/server.js`
   - Health check: `/api/health`

Notes:
- The backend serves static files from `frontend/`, so a single Web Service is enough.
- The server reads `process.env.PORT` (Render injects this automatically).
- Update `FRONTEND_URL` later if you add a custom domain.

### MongoDB Atlas Setup Guide

1. **Create Account**: Sign up at https://www.mongodb.com/atlas
2. **Create Cluster**: Choose the free tier (M0 Sandbox)
3. **Configure Security**:
   - Add your IP address to the IP Access List
   - Create a database user with read/write permissions
4. **Get Connection String**:
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `blooddonation`

### Sample Environment Configuration

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/blooddonation?retryWrites=true&w=majority

# JWT Secret (generate a strong secret)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=blooddonation657@gmail.com
EMAIL_PASS=your_app_specific_password

# Contact Information
CONTACT_EMAIL=blooddonation657@gmail.com
CONTACT_PHONE=9136706650

# Security
BCRYPT_ROUNDS=12
SESSION_SECRET=your_session_secret_here

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

## API Documentation

### Authentication Endpoints

#### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "phoneNumber": "9876543210",
  "bloodGroup": "O+",
  "city": "Mumbai",
  "state": "Maharashtra"
}
```

#### POST /api/auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

### Donor Endpoints

#### POST /api/donors
Register as a blood donor.

**Request Body:**
```json
{
  "name": "John Doe",
  "age": 25,
  "gender": "Male",
  "bloodGroup": "O+",
  "contactNumber": "9876543210",
  "email": "john@example.com",
  "city": "Mumbai",
  "state": "Maharashtra",
  "dateOfDonation": "2024-01-15"
}
```

#### GET /api/donors/search
Search for blood donors.

**Query Parameters:**
- `bloodGroup` (required): Blood group to search for
- `location` (optional): City or state to search in

### Blood Request Endpoints

#### POST /api/requests
Submit a blood request.

**Request Body:**
```json
{
  "patientName": "Jane Smith",
  "bloodGroup": "A+",
  "requiredUnits": 2,
  "hospitalName": "City Hospital",
  "location": "Mumbai, Maharashtra",
  "contactNumber": "9876543210",
  "urgency": "High",
  "requiredBy": "2024-01-20T10:00:00Z"
}
```

#### GET /api/requests/search
Search blood requests.

**Query Parameters:**
- `bloodGroup` (required): Blood group needed
- `location` (optional): Location to search in

## Usage Guidelines

### For Blood Donors

1. **Registration**: Fill out the donor registration form with accurate information
2. **Eligibility**: Ensure you meet the criteria (18-65 years, good health, 50kg+ weight)
3. **Availability**: Keep your contact information updated
4. **Donation Frequency**: Wait at least 3 months between donations

### For Blood Recipients

1. **Search**: Use the search feature to find donors in your area
2. **Request**: Submit detailed blood requests with urgency level
3. **Contact**: Use the provided contact information to reach donors
4. **Emergency**: Call 9136706650 for urgent blood requirements

### For Hospitals

1. **Partnership**: Contact us for institutional partnerships
2. **Bulk Requests**: Submit multiple requests for different blood types
3. **Verification**: Provide hospital verification for credibility

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check your MongoDB Atlas connection string
   - Ensure your IP is whitelisted
   - Verify database user credentials

2. **Port Already in Use**
   - On Windows PowerShell:
     - `taskkill /f /im node.exe`
     - Verify: `netstat -an | findstr :3000` (should be empty for PORT=3000)
   - On macOS/Linux:
     - `lsof -ti:3000 | xargs kill -9`

3. **Email Not Working**
   - Use app-specific passwords for Gmail
   - Check email configuration in `.env`

4. **Forms Not Submitting**
   - Check browser console for JavaScript errors
   - Ensure all required fields are filled
   - Verify API endpoints are running

### Development Tips

1. **Hot Reload**: Use `npm run dev` for development with auto-restart
2. **Debugging**: Check browser console and server logs
3. **Database**: Use MongoDB Compass to view database contents
4. **Testing**: Test all forms and API endpoints thoroughly

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -m "Add feature"`
5. Push to the branch: `git push origin feature-name`
6. Submit a pull request

## Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **JWT Secrets**: Use strong, unique secrets in production
3. **Input Validation**: All inputs are validated on both client and server
4. **Rate Limiting**: Consider adding rate limiting for production
5. **HTTPS**: Use HTTPS in production environments

## Contact

- **Email**: blooddonation657@gmail.com
- **Phone**: 9136706650
- **Emergency**: Available 24/7 for urgent blood requests

## License

This project is for educational and humanitarian purposes. Feel free to use and modify for non-commercial blood donation initiatives.

## Acknowledgments

- Thanks to all blood donors who save lives
- MongoDB Atlas for database hosting
- Font Awesome for icons
- Google Fonts for typography
