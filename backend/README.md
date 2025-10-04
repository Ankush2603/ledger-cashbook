# Ledger Cashbook Backend API

A secure Node.js/Express backend API for the Ledger Cashbook application with email/password authentication and Google Drive storage.

## Features

- 🔐 **Email/Password Authentication** with JWT tokens
- 🛡️ **Secure Password Hashing** using bcrypt
- 📱 **Google Drive Integration** for data storage
- 🔄 **Automatic Backups** of user data
- 🚀 **RESTful API** with comprehensive error handling
- 🛡️ **Security Features**: Rate limiting, CORS, Helmet
- ✅ **Input Validation** with express-validator

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `GET /api/auth/verify` - Verify JWT token

### User Data
- `GET /api/user-data/ledger` - Get user's ledger data
- `POST /api/user-data/ledger` - Save ledger data
- `POST /api/user-data/backup` - Create backup
- `GET /api/user-data/backups` - List user backups
- `POST /api/user-data/restore/:backupId` - Restore from backup
- `DELETE /api/user-data/account` - Delete user account

## Setup Instructions

### 1. Prerequisites
- Node.js 18+ installed
- Google Cloud Platform account
- Google Drive API enabled

### 2. Google Cloud Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable the Google Drive API
4. Create OAuth 2.0 credentials (Desktop application type)
5. Download the credentials or note the Client ID and Client Secret

### 3. Installation

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

### 4. Configure Environment Variables

Edit `.env` file with your values:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Add your Google credentials
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

FRONTEND_URL=http://localhost:5173
```

### 5. Google Drive Authentication Setup

Run the setup script to get your refresh token:

```bash
npm run setup
```

Follow the prompts to:
1. Visit the provided Google OAuth URL
2. Grant permissions
3. Copy the authorization code
4. Paste it in the terminal

The setup will provide you with:
- `GOOGLE_REFRESH_TOKEN` - Add this to your .env file
- `GOOGLE_DRIVE_FOLDER_ID` - Add this to your .env file

### 6. Start the Server

```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## Usage Examples

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123",
    "name": "John Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'
```

### Save Ledger Data (requires authentication)
```bash
curl -X POST http://localhost:5000/api/user-data/ledger \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "books": [...],
    "transactions": [...],
    "selectedBookId": "book-id"
  }'
```

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: Prevents abuse and DOS attacks
- **CORS**: Configured for frontend domain
- **Helmet**: Security headers
- **Input Validation**: Validates all input data
- **Error Handling**: Comprehensive error responses

## Data Storage Structure

User data is stored in Google Drive as JSON files:
- `user_{userId}.json` - User account information
- `ledger_{userId}.json` - User's ledger data
- `backup_{userId}_{timestamp}.json` - Backup files

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // Validation errors when applicable
}
```

## Health Check

Check if the API is running:
```bash
curl http://localhost:5000/health
```

## Troubleshooting

### Common Issues

1. **Google API Authentication Errors**
   - Verify your Google credentials in .env
   - Ensure Google Drive API is enabled
   - Check if refresh token is valid

2. **JWT Token Errors**
   - Ensure JWT_SECRET is set in .env
   - Check if token hasn't expired
   - Verify Authorization header format: "Bearer {token}"

3. **CORS Issues**
   - Update FRONTEND_URL in .env to match your frontend
   - Ensure credentials are enabled in frontend requests

4. **Rate Limiting**
   - Adjust RATE_LIMIT_MAX_REQUESTS in .env if needed
   - Wait for the time window to reset

## Development

### Project Structure
```
backend/
├── middleware/          # Authentication & error handling
├── routes/             # API route definitions
├── services/           # Business logic (Google Drive)
├── .env.example        # Environment template
├── .gitignore         # Git ignore rules
├── package.json       # Dependencies & scripts
├── server.js          # Main server file
└── setup.js           # Google Drive setup script
```

### Adding New Features

1. Add routes in `routes/` directory
2. Add business logic in `services/`
3. Add middleware in `middleware/` if needed
4. Update error handling in `errorHandler.js`

## License

MIT License - feel free to use this in your projects!