/**
 * Frontend Development Server
 * This script serves only the frontend static files for development
 * The backend API runs separately on port 3002
 */

const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 5500;

// Enable CORS for development
app.use(cors({
    origin: ['http://localhost:3002', 'http://127.0.0.1:3002'],
    credentials: true
}));

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, 'frontend')));

// Serve HTML files for frontend routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'login.html'));
});

app.get('/donate', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'donate.html'));
});

app.get('/request', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'request.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'about.html'));
});

app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'contact.html'));
});

app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'profile.html'));
});

app.get('/admin-login', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'admin-login.html'));
});

app.get('/admin-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'admin-dashboard.html'));
});

// Catch all handler for SPA routing (serve index.html for unknown routes)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.listen(PORT, () => {
    console.log('🌐 Frontend Development Server Started Successfully!');
    console.log(`📱 Frontend URL: http://localhost:${PORT}`);
    console.log('🔗 Backend API: http://localhost:3002/api');
    console.log('\n📋 Available Frontend Pages:');
    console.log(`   Home: http://localhost:${PORT}`);
    console.log(`   Login: http://localhost:${PORT}/login`);
    console.log(`   Donate: http://localhost:${PORT}/donate`);
    console.log(`   Request: http://localhost:${PORT}/request`);
    console.log(`   About: http://localhost:${PORT}/about`);
    console.log(`   Contact: http://localhost:${PORT}/contact`);
    console.log(`   Profile: http://localhost:${PORT}/profile`);
    console.log(`   Admin Login: http://localhost:${PORT}/admin-login`);
    console.log(`   Admin Dashboard: http://localhost:${PORT}/admin-dashboard`);
    console.log('\n⚠️  IMPORTANT: Make sure your backend is running on port 3002!');
    console.log('   Run: npm start (in another terminal)');
    console.log('   Or: node backend/server.js');
    console.log('\n💡 This frontend server only serves static files.');
    console.log('   All API calls will be made to the backend on port 3002.');
});
