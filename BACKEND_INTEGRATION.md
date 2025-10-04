# Frontend-Backend Integration Guide

## Overview

The Ledger Cashbook application now includes a complete backend API with authentication and Google Drive storage. This guide explains how to integrate the frontend with the backend.

## Backend Features

✅ **Complete Backend API Built:**
- ✅ Email/Password authentication with JWT tokens
- ✅ Secure password hashing with bcrypt
- ✅ Google Drive integration for data storage
- ✅ User registration and login
- ✅ Automatic data synchronization
- ✅ Backup and restore functionality
- ✅ Account management
- ✅ Security features (rate limiting, CORS, validation)

## Quick Start

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your Google credentials (see backend README.md)

# Run setup script for Google Drive authentication
npm run setup

# Start the backend server
npm run dev
```

### 2. Frontend Setup

```bash
# In the main project directory
# Copy environment file
cp .env.example .env

# Install any additional dependencies if needed
npm install

# Start frontend
npm run dev
```

## Integration Status

### ✅ Backend Services Created:
- **Authentication Service**: Complete JWT-based auth
- **Google Drive Service**: File storage and management
- **API Routes**: All endpoints implemented
- **Security**: Rate limiting, CORS, validation
- **Error Handling**: Comprehensive error responses

### 🔄 Frontend Integration (Ready to implement):
- **API Service**: Created (`src/services/api.ts`)
- **Auth Components**: Ready (`src/components/AuthForm.tsx`)
- **Auth Context**: Ready (`src/contexts/AuthContext.tsx`)
- **Environment Config**: Ready (`.env.example`)

## Implementation Steps

### Step 1: Install Additional Frontend Dependencies

The backend integration requires some additional frontend packages:

```bash
# If you want TypeScript environment types
npm install --save-dev @types/node
```

### Step 2: Update Main App Component

You'll need to modify `src/App.tsx` to include the AuthProvider:

```tsx
import { AuthProvider } from "@/contexts/AuthContext";
// ... other imports

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);
```

### Step 3: Update Index Page for Authentication

Modify `src/pages/Index.tsx` to handle authentication:

```tsx
import { useAuth } from "@/contexts/AuthContext";
import { AuthForm } from "@/components/AuthForm";

const Index = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthForm onAuthSuccess={() => {}} />;
  }

  // Your existing Index component code here
  return (
    // ... existing ledger interface
  );
};
```

### Step 4: Add Backend Data Synchronization

The `apiService` is ready to sync data with the backend. You can modify your existing localStorage usage to also sync with the backend:

```tsx
// Example: Save to both localStorage and backend
const handleAddTransaction = async (transaction) => {
  // Add to local state
  setTransactions(prev => [newTransaction, ...prev]);
  
  // Sync with backend
  try {
    await apiService.saveLedgerData({
      books,
      transactions: [newTransaction, ...transactions],
      selectedBookId
    });
  } catch (error) {
    console.error('Backend sync failed:', error);
    // Handle gracefully - data is still saved locally
  }
};
```

### Step 5: Environment Configuration

Create `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:5000
```

## API Endpoints Available

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user  
- `GET /api/auth/profile` - Get user profile
- `GET /api/auth/verify` - Verify token

### User Data
- `GET /api/user-data/ledger` - Get ledger data
- `POST /api/user-data/ledger` - Save ledger data
- `POST /api/user-data/backup` - Create backup
- `GET /api/user-data/backups` - List backups
- `POST /api/user-data/restore/:id` - Restore backup
- `DELETE /api/user-data/account` - Delete account

## Benefits of Backend Integration

### 🔐 **Security**
- Secure authentication with JWT tokens
- Password hashing with bcrypt
- Rate limiting and security headers
- Input validation

### ☁️ **Cloud Storage**
- All data stored in Google Drive
- Automatic backups
- Data persistence across devices
- No data loss

### 👥 **Multi-User Support**
- Each user has isolated data
- User management
- Profile information

### 🔄 **Data Management**
- Automatic synchronization
- Backup and restore
- Data export capabilities
- Version control

## Current Implementation

The backend is **fully functional** and ready to use. The frontend integration components are created and ready to be implemented. 

### What's Ready:
- ✅ Complete backend API
- ✅ Google Drive integration
- ✅ Authentication system
- ✅ Frontend API service
- ✅ Authentication components
- ✅ Context providers

### Next Steps:
1. Run the backend setup script
2. Configure Google Drive credentials
3. Update frontend components to use authentication
4. Test the integration

## Testing the Backend

You can test the backend API directly:

```bash
# Health check
curl http://localhost:5000/health

# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123","name":"Test User"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123"}'
```

The backend is production-ready with proper error handling, security measures, and comprehensive API documentation.