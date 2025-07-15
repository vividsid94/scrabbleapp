# Game Submission System for Mack Meller

This system allows Mack Meller's subscribers to submit Cross-Tables and Woogles game URLs for analysis in his videos. It uses a simple file-based approach perfect for small-scale usage (~20 submissions).

## Features

### For Subscribers
- **Submit Game URLs**: Users can submit Cross-Tables or Woogles game URLs
- **URL Validation**: Automatic validation of game URL formats
- **Game Type Detection**: Automatically detects if it's a Cross-Tables or Woogles game
- **Success Feedback**: Clear confirmation when submission is successful
- **Duplicate Prevention**: Prevents the same game from being submitted multiple times

### For Mack (Admin)
- **Review Submissions**: View all submitted games in a table format
- **Approve/Reject**: Mark submissions as approved or rejected
- **Add Notes**: Add review notes for each submission
- **Secure Access**: Protected with admin token authentication

## Setup Instructions

### 1. Environment Variables

Set this environment variable in your Netlify dashboard:

```
ADMIN_TOKEN=your-secure-admin-token-here
```

### 2. Data Directory

The system automatically creates a `data/` directory and `game_submissions.json` file to store submissions. No additional setup required!

### 3. Install Dependencies

No additional dependencies needed! The system uses Node.js built-in modules.

### 4. Deploy to Netlify

The system uses Netlify Functions for the backend API. Deploy your site to Netlify and the functions will be automatically available.

## Usage

### For Subscribers

1. Navigate to `/submit-game` in your app
2. Paste a Cross-Tables or Woogles game URL
3. Click "Submit Game"
4. Wait for confirmation

### For Mack (Admin)

1. Navigate to `/admin-submissions`
2. Enter the admin token (set in environment variables)
3. View all submissions in the table
4. Click "Review" on any pending submission
5. Add notes and approve or reject

## API Endpoints

### Submit Game
- **URL**: `/.netlify/functions/submitGame`
- **Method**: POST
- **Body**: 
  ```json
  {
    "gameUrl": "https://cross-tables.com/results.html?g=12345",
    "gameType": "cross-tables",
    "submittedBy": "anonymous"
  }
  ```

### Get Submissions (Admin)
- **URL**: `/.netlify/functions/getSubmissions`
- **Method**: GET
- **Headers**: `Authorization: Bearer <admin-token>`
- **Query Params**: `?status=pending&limit=50&skip=0`

### Update Submission (Admin)
- **URL**: `/.netlify/functions/updateSubmission`
- **Method**: PUT
- **Headers**: `Authorization: Bearer <admin-token>`
- **Body**:
  ```json
  {
    "submissionId": "mongo-object-id",
    "status": "approved",
    "notes": "Great game for analysis"
  }
  ```

## Data Structure

```json
[
  {
    "id": "1701234567890abc123",
    "gameUrl": "https://cross-tables.com/results.html?g=12345",
    "gameType": "cross-tables",
    "submittedBy": "anonymous",
    "submittedAt": "2024-01-01T12:00:00.000Z",
    "status": "pending",
    "reviewedBy": null,
    "reviewedAt": null,
    "notes": "",
    "ipAddress": "192.168.1.1"
  }
]
```

## Security Considerations

1. **Admin Token**: Use a strong, randomly generated token
2. **Rate Limiting**: Consider adding rate limiting to prevent spam
3. **Input Validation**: All URLs are validated before storage
4. **CORS**: Properly configured for your domain

## Future Enhancements

1. **Email Notifications**: Notify Mack when new submissions arrive
2. **User Accounts**: Allow subscribers to create accounts and track their submissions
3. **Submission History**: Let users see the status of their previous submissions
4. **Game Preview**: Show a preview of the game before submission
5. **Bulk Operations**: Allow Mack to approve/reject multiple submissions at once

## Troubleshooting

### Common Issues

1. **Admin Access Denied**: Verify your `ADMIN_TOKEN` environment variable
2. **Function Not Found**: Ensure all Netlify Functions are properly deployed
3. **CORS Errors**: Check that your domain is properly configured
4. **File Permission Error**: Ensure the `data/` directory is writable

### Testing

You can test the system locally by:
1. Setting up environment variables in a `.env` file
2. Running `netlify dev` to test functions locally
3. Using the frontend at `http://localhost:3000`

## Support

For issues or questions, check the Netlify Functions logs in your Netlify dashboard or the browser console for frontend errors. 