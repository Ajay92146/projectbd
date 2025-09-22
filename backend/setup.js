/**
 * Blood Donation Website - Setup Script
 * Helps with initial setup and data seeding
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Donor = require('./backend/models/Donor');
const Request = require('./backend/models/Request');
const User = require('./backend/models/User');

// Sample data
const sampleData = require('./sample-data.json');

/**
 * Connect to MongoDB
 */
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB Atlas');
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        process.exit(1);
    }
}

/**
 * Create database indexes
 */
async function createIndexes() {
    try {
        console.log('📊 Creating database indexes...');
        
        // Donor indexes
        await Donor.collection.createIndex({ bloodGroup: 1, city: 1, isAvailable: 1 });
        await Donor.collection.createIndex({ email: 1 }, { unique: true });
        await Donor.collection.createIndex({ contactNumber: 1 });
        
        // Request indexes
        await Request.collection.createIndex({ bloodGroup: 1, location: 1, status: 1 });
        await Request.collection.createIndex({ urgency: 1, requiredBy: 1 });
        await Request.collection.createIndex({ status: 1, isActive: 1 });
        
        // User indexes
        await User.collection.createIndex({ email: 1 }, { unique: true });
        await User.collection.createIndex({ role: 1, isActive: 1 });
        await User.collection.createIndex({ bloodGroup: 1, city: 1 });
        
        console.log('✅ Database indexes created successfully');
    } catch (error) {
        console.error('❌ Error creating indexes:', error.message);
    }
}

/**
 * Seed sample data
 */
async function seedData() {
    try {
        console.log('🌱 Seeding sample data...');
        
        // Clear existing data
        await Donor.deleteMany({});
        await Request.deleteMany({});
        await User.deleteMany({});
        
        console.log('🗑️  Cleared existing data');
        
        // Insert sample donors
        const donors = await Donor.insertMany(sampleData.donors);
        console.log(`✅ Inserted ${donors.length} sample donors`);
        
        // Insert sample requests
        const requests = await Request.insertMany(sampleData.requests);
        console.log(`✅ Inserted ${requests.length} sample requests`);
        
        // Insert sample users
        const users = await User.insertMany(sampleData.users);
        console.log(`✅ Inserted ${users.length} sample users`);
        
        console.log('🎉 Sample data seeded successfully!');
        
        // Display login credentials
        console.log('\n📋 Sample Login Credentials:');
        console.log('Admin: admin@bloodconnect.com / Admin@123');
        console.log('User: john.doe@example.com / User@123');
        console.log('Donor: jane.smith@example.com / User@123');
        console.log('Hospital: sarah.wilson@hospital.com / Doctor@123');
        
    } catch (error) {
        console.error('❌ Error seeding data:', error.message);
    }
}

/**
 * Check environment configuration
 */
function checkEnvironment() {
    console.log('🔍 Checking environment configuration...');
    
    const requiredVars = [
        'MONGODB_URI',
        'JWT_SECRET',
        'PORT'
    ];
    
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        console.error('❌ Missing required environment variables:');
        missingVars.forEach(varName => {
            console.error(`   - ${varName}`);
        });
        console.log('\n💡 Please check your .env file and ensure all required variables are set.');
        return false;
    }
    
    console.log('✅ Environment configuration looks good!');
    return true;
}

/**
 * Create .env file from template
 */
function createEnvFile() {
    const envTemplate = `# Environment Variables for Blood Donation Website

# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Atlas Configuration
# Replace with your actual MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/blooddonation?retryWrites=true&w=majority

# JWT Secret for Authentication
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production

# Email Configuration (for future email notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=blooddonation657@gmail.com
EMAIL_PASS=your_email_password_here

# Application Settings
APP_NAME=Blood Donation Website
CONTACT_EMAIL=blooddonation657@gmail.com
CONTACT_PHONE=9136706650

# Security Settings
BCRYPT_ROUNDS=12
SESSION_SECRET=your_session_secret_here

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
`;

    if (!fs.existsSync('.env')) {
        fs.writeFileSync('.env', envTemplate);
        console.log('✅ Created .env file from template');
        console.log('⚠️  Please update the .env file with your actual configuration values');
        return false;
    }
    
    return true;
}

/**
 * Display setup instructions
 */
function displayInstructions() {
    console.log('\n📚 Setup Instructions:');
    console.log('1. Update your .env file with actual MongoDB Atlas connection string');
    console.log('2. Replace JWT_SECRET with a strong secret key');
    console.log('3. Configure email settings if you plan to use email notifications');
    console.log('4. Run "npm install" to install dependencies');
    console.log('5. Run "npm start" to start the server');
    console.log('6. Open http://localhost:3000 in your browser');
    
    console.log('\n🔗 MongoDB Atlas Setup:');
    console.log('1. Create account at https://www.mongodb.com/atlas');
    console.log('2. Create a new cluster (free tier available)');
    console.log('3. Create database user with read/write permissions');
    console.log('4. Add your IP address to IP Access List');
    console.log('5. Get connection string and update MONGODB_URI in .env');
    
    console.log('\n🧪 Testing:');
    console.log('- Use sample login credentials provided above');
    console.log('- Test donor registration and blood request forms');
    console.log('- Try searching for donors by blood group and location');
    console.log('- Verify all pages are working correctly');
}

/**
 * Main setup function
 */
async function setup() {
    console.log('🩸 Blood Donation Website Setup\n');
    
    // Check if .env file exists, create if not
    const envExists = createEnvFile();
    
    if (!envExists) {
        console.log('\n⚠️  Please update the .env file and run setup again.');
        return;
    }
    
    // Check environment configuration
    if (!checkEnvironment()) {
        return;
    }
    
    try {
        // Connect to database
        await connectDB();
        
        // Create indexes
        await createIndexes();
        
        // Seed sample data
        await seedData();
        
        console.log('\n🎉 Setup completed successfully!');
        
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
    } finally {
        // Close database connection
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
    }
    
    // Display instructions
    displayInstructions();
}

/**
 * Command line interface
 */
const command = process.argv[2];

switch (command) {
    case 'seed':
        connectDB().then(seedData).then(() => mongoose.connection.close());
        break;
    case 'indexes':
        connectDB().then(createIndexes).then(() => mongoose.connection.close());
        break;
    case 'env':
        createEnvFile();
        break;
    case 'check':
        checkEnvironment();
        break;
    default:
        setup();
}

module.exports = {
    connectDB,
    createIndexes,
    seedData,
    checkEnvironment,
    createEnvFile
};
