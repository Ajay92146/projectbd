@echo off
echo 🩸 BloodConnect Server Startup
echo =============================
echo.
echo Starting BloodConnect backend server...
echo.
cd /d "%~dp0backend"
echo Current directory: %cd%
echo.
echo Starting server on http://localhost:3000
echo Profile page will be available at: http://localhost:3000/profile
echo Test page will be available at: http://localhost:3000/profile-test.html
echo.
echo Press Ctrl+C to stop the server
echo.
node server.js
pause