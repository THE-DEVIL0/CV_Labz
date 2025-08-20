# Cookie-Based Session Management System

This document describes the implementation of a comprehensive cookie-based session management system for the React frontend.

## 🏗️ Architecture Overview

### Components
- **SessionProvider**: React Context provider managing authentication state
- **ProtectedRoute**: Component for protecting routes that require authentication
- **ApiService**: Centralized API service with cookie handling
- **LoadingSpinner**: Reusable loading component
- **SessionStatus**: Debug component for monitoring session state

### Key Features
- ✅ Automatic session checking on app initialization
- ✅ Cookie-based authentication (no manual session ID handling)
- ✅ Session persistence across page refreshes
- ✅ Protected routes with automatic redirects
- ✅ Loading states during authentication checks
- ✅ Error handling and user feedback
- ✅ Automatic logout on session expiration

## 🔧 Implementation Details

### 1. API Service (`src/services/api.js`)
```javascript
// All API calls include credentials: 'include' for cookie handling
const config = {
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  // ... other options
};
```

**Endpoints:**
- `POST /login` - User authentication
- `POST /register` - User registration  
- `POST /logout` - Session destruction
- `GET /session` - Session validation

### 2. Session Context (`src/contexts/SessionContext.jsx`)
Manages global authentication state using React Context API:

**State:**
- `user`: Current user object
- `isAuthenticated`: Authentication status
- `isLoading`: Loading state
- `error`: Error messages
- `sessionChecked`: Whether initial session check is complete

**Actions:**
- `login(credentials)` - Authenticate user
- `register(userData)` - Register new user
- `logout()` - Destroy session
- `checkSession()` - Validate current session
- `clearError()` - Clear error state

### 3. Protected Route (`src/components/ProtectedRoute.jsx`)
```javascript
// Usage
<ProtectedRoute>
  <YourProtectedComponent />
</ProtectedRoute>
```

**Features:**
- Checks authentication before rendering
- Shows loading spinner during session check
- Redirects to login if not authenticated
- Preserves intended destination for post-login redirect

### 4. Authentication Flow

#### Login Process:
1. User submits credentials
2. API call with `credentials: 'include'`
3. Server sets httpOnly cookie
4. Frontend updates user state
5. Automatic redirect to intended page

#### Session Persistence:
1. App loads with `SessionProvider`
2. Automatic session check on mount
3. Server validates cookie
4. User state updated based on response

#### Logout Process:
1. User clicks logout
2. API call to `/logout`
3. Server destroys session
4. Frontend clears user state
5. Redirect to home page

## 🛡️ Security Features

### Cookie Security
- Uses `credentials: 'include'` for all API calls
- Relies on httpOnly cookies (handled by backend)
- No sensitive data stored in localStorage
- Automatic cookie handling by browser

### Error Handling
- Network error detection
- Session expiration handling
- Graceful fallbacks for failed requests
- User-friendly error messages

### Route Protection
- Automatic redirect for unauthenticated users
- Loading states during authentication checks
- Preserved redirect destinations

## 📱 Usage Examples

### Using Session Context
```javascript
import { useSession } from '../contexts/SessionContext';

const MyComponent = () => {
  const { user, isAuthenticated, login, logout } = useSession();
  
  if (isAuthenticated) {
    return <div>Welcome, {user.email}!</div>;
  }
  
  return <div>Please log in</div>;
};
```

### Protected Routes
```javascript
import ProtectedRoute from '../components/ProtectedRoute';

// In your router
<Route 
  path="/dashboard" 
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  } 
/>
```

### API Calls with Authentication
```javascript
import apiService from '../services/api';

// All calls automatically include cookies
const response = await apiService.apiCall('/protected-endpoint');
```

## 🔍 Testing Checklist

### Authentication Flow
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Registration with valid data
- [ ] Registration with invalid data
- [ ] Logout functionality

### Session Persistence
- [ ] Session persists after page refresh
- [ ] Session persists after browser restart
- [ ] Automatic logout on session expiration
- [ ] Session check on app initialization

### Route Protection
- [ ] Access to protected routes when authenticated
- [ ] Redirect to login when not authenticated
- [ ] Redirect to intended page after login
- [ ] Loading states during authentication checks

### Error Handling
- [ ] Network error handling
- [ ] Invalid credentials error
- [ ] Session expiration error
- [ ] Server error handling

## 🚀 Deployment Considerations

### Backend Requirements
- CORS configured with `credentials: true`
- Session middleware with MongoDB storage
- Proper cookie settings (httpOnly, secure, sameSite)
- Authentication endpoints: `/login`, `/register`, `/logout`, `/session`

### Frontend Requirements
- HTTPS in production (for secure cookies)
- Proper error handling for network issues
- Loading states for better UX
- Session status monitoring

## 🔧 Configuration

### API Base URL
Update `src/services/api.js`:
```javascript
const API_BASE_URL = 'https://your-backend-url.com';
```

### Protected Routes
Update `src/utils/authUtils.js`:
```javascript
export const isProtectedRoute = (pathname) => {
  const protectedRoutes = ['/dashboard', '/profile', '/settings'];
  return protectedRoutes.includes(pathname);
};
```

### Session Status Debug
Remove or disable in production:
```javascript
// In App.jsx
<SessionStatus show={false} /> // Set to false for production
```

## 📝 Troubleshooting

### Common Issues

1. **Cookies not being sent**
   - Ensure `credentials: 'include'` in all fetch calls
   - Check CORS configuration on backend
   - Verify HTTPS in production

2. **Session not persisting**
   - Check backend session configuration
   - Verify cookie settings (httpOnly, secure, sameSite)
   - Ensure session check endpoint is working

3. **Redirect loops**
   - Check ProtectedRoute logic
   - Verify session check response format
   - Ensure proper error handling

4. **Loading states not working**
   - Check SessionContext state management
   - Verify loading state updates
   - Ensure proper error boundaries

## 🎯 Best Practices

1. **Always use the API service** for authenticated requests
2. **Handle loading states** for better UX
3. **Provide clear error messages** to users
4. **Test session persistence** across different scenarios
5. **Monitor session status** during development
6. **Implement proper error boundaries** for production
7. **Use HTTPS in production** for secure cookies
8. **Regular session validation** for security

## 📚 Additional Resources

- [React Context API Documentation](https://reactjs.org/docs/context.html)
- [Fetch API with Credentials](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#sending_a_request_with_credentials_included)
- [HTTP-Only Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#restrict_access_to_cookies)
- [CORS with Credentials](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#requests_with_credentials) 