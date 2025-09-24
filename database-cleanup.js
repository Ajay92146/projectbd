/**
 * Direct database cleanup script to remove test/demo data
 * This connects directly to MongoDB to clean up test entries
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./backend/models/User');
const Donor = require('./backend/models/Donor');
const Request = require('./backend/models/Request');
const UserDonation = require('./backend/models/UserDonation');
const UserRequest = require('./backend/models/UserRequest');

async function connectToDatabase() {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://ajc54875:WCX8kDhsJtVxat7e@ajaykadatabase.ru1ft8v.mongodb.net/blooddonation?retryWrites=true&w=majority&appName=Ajaykadatabase';
        await mongoose.connect(mongoURI);
        console.log('✅ Connected to MongoDB');
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
}

async function cleanupTestData() {
    console.log('🧹 Starting direct database cleanup...\n');
    
    try {
        // Connect to database
        const connected = await connectToDatabase();
        if (!connected) {
            return;
        }
        
        console.log('1. Removing test users...');
        const testUserResult = await User.deleteMany({
            $or: [
                { email: { $regex: /test/i } },
                { email: { $regex: /demo/i } },
                { firstName: { $regex: /test/i } },
                { firstName: { $regex: /demo/i } },
                { lastName: { $regex: /test/i } },
                { lastName: { $regex: /demo/i } }
            ]
        });
        console.log(`   ✅ Removed ${testUserResult.deletedCount} test users`);
        
        console.log('2. Removing test donors...');
        const testDonorResult = await Donor.deleteMany({
            $or: [
                { name: { $regex: /test/i } },
                { name: { $regex: /demo/i } },
                { email: { $regex: /test/i } },
                { email: { $regex: /demo/i } }
            ]
        });
        console.log(`   ✅ Removed ${testDonorResult.deletedCount} test donors`);
        
        console.log('3. Removing test user donations...');
        const testUserDonationResult = await UserDonation.deleteMany({
            $or: [
                { name: { $regex: /test/i } },
                { name: { $regex: /demo/i } },
                { email: { $regex: /test/i } },
                { email: { $regex: /demo/i } }
            ]
        });
        console.log(`   ✅ Removed ${testUserDonationResult.deletedCount} test user donations`);
        
        console.log('4. Removing test requests...');
        const testRequestResult = await Request.deleteMany({
            $or: [
                { patientName: { $regex: /test/i } },
                { patientName: { $regex: /demo/i } },
                { requesterName: { $regex: /test/i } },
                { requesterName: { $regex: /demo/i } },
                { hospitalName: { $regex: /test/i } },
                { hospitalName: { $regex: /demo/i } },
                { hospital: { $regex: /test/i } },
                { hospital: { $regex: /demo/i } },
                { location: { $regex: /test/i } },
                { location: { $regex: /demo/i } }
            ]
        });
        console.log(`   ✅ Removed ${testRequestResult.deletedCount} test requests`);
        
        console.log('5. Removing test user requests...');
        const testUserRequestResult = await UserRequest.deleteMany({
            $or: [
                { patientName: { $regex: /test/i } },
                { patientName: { $regex: /demo/i } },
                { requesterName: { $regex: /test/i } },
                { requesterName: { $regex: /demo/i } },
                { hospitalName: { $regex: /test/i } },
                { hospitalName: { $regex: /demo/i } },
                { hospital: { $regex: /test/i } },
                { hospital: { $regex: /demo/i } },
                { location: { $regex: /test/i } },
                { location: { $regex: /demo/i } }
            ]
        });
        console.log(`   ✅ Removed ${testUserRequestResult.deletedCount} test user requests`);
        
        console.log('\n📊 CLEANUP SUMMARY:');
        console.log('='.repeat(50));
        console.log(`Test Users Removed: ${testUserResult.deletedCount}`);
        console.log(`Test Donors Removed: ${testDonorResult.deletedCount}`);
        console.log(`Test User Donations Removed: ${testUserDonationResult.deletedCount}`);
        console.log(`Test Requests Removed: ${testRequestResult.deletedCount}`);
        console.log(`Test User Requests Removed: ${testUserRequestResult.deletedCount}`);
        
        const totalRemoved = testUserResult.deletedCount + 
                           testDonorResult.deletedCount + 
                           testUserDonationResult.deletedCount + 
                           testRequestResult.deletedCount + 
                           testUserRequestResult.deletedCount;
        
        console.log(`\n🎉 Total Test Entries Removed: ${totalRemoved}`);
        console.log('✅ Database cleanup completed successfully!');
        console.log('\n💡 The admin dashboard should now show only REAL DATA');
        
    } catch (error) {
        console.error('❌ Error during cleanup:', error.message);
    } finally {
        // Close database connection
        await mongoose.disconnect();
        console.log('📤 Disconnected from MongoDB');
    }
}

// Run the cleanup
cleanupTestData();