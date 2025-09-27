# Blood Donation Tracking System

## Overview

This document explains how the blood donation tracking system works in the ProjectBD application. It covers the workflow from donation submission to status updates and how users can track their donations.

## Donation Workflow

### 1. Donation Submission
When a user submits a blood donation application through the website:
- The donation is recorded in the system with a "Pending" status
- Users receive a confirmation message explaining that their application is being reviewed
- The donation will not immediately appear as "Completed" in their profile

### 2. Review Process
After submission, donations go through an approval process:
- Blood bank staff review the application
- Staff can update the status to "Completed", "Cancelled", or "Recorded"
- Users can track the status of their donations in their profile

### 3. Status Explanations
The system uses the following statuses for donations:

- **Pending**: The donation application is being reviewed by our blood bank staff
- **Completed**: The donation has been successfully completed and approved
- **Cancelled**: The donation was cancelled or rejected
- **Recorded**: The donation has been recorded in our system

## Technical Implementation

### Backend (Node.js/Express)
- Donations are stored in MongoDB using the UserDonation model
- The `/api/donors/apply` endpoint handles donation submissions
- Authentication is required to link donations to user profiles
- Proper ObjectId conversion is used to match user IDs

### Frontend (JavaScript)
- The donation form is handled by `frontend/js/donate-page.js` (primary handler)
- `frontend/js/forms.js` handles other forms but avoids conflicts with donate-page.js
- Profile display is managed by `frontend/profile.js`
- Success messages explain the approval process to users

### Form Handler Conflict Resolution
To prevent conflicts between multiple form handlers:
- `forms.js` checks if `donate-page.js` is present before setting up handlers
- If `donate-page.js` is handling the donor application form, `forms.js` skips duplicate handlers
- Only one script handles form submission at a time

## User Experience Guidelines

### After Donation Submission
Users should:
1. See a success message explaining the review process
2. Understand that their donation will appear as "Pending" initially
3. Know they can check their profile for status updates

### In User Profile
Users can:
1. View all their donations with current statuses
2. See explanations for what each status means
3. Track when their donations have been approved

## Troubleshooting

### Common Issues
1. **Donation not appearing in profile**: Check if the user is logged in with the correct account
2. **Status not updating**: May take 2-3 business days for staff approval
3. **Pending status**: This is normal and expected for new donations

### For Developers
1. Ensure the UserDonation model properly links to User profiles via ObjectId
2. Verify authentication tokens are correctly passed in API requests
3. Check that status updates are properly handled in the backend
4. Verify that form handlers don't conflict with each other