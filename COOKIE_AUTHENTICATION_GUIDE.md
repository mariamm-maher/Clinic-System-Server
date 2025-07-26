# HTTP-Only Cookie Authentication Guide

## Overview

This clinic system uses a dual-token authentication strategy:

1. **Access Token**: Short-lived JWT sent in response body (used for API authorization)
2. **Refresh Token**: Long-lived JWT stored in HTTP-only cookie (used for token renewal)

## How HTTP-Only Cookies Work

### What is an HTTP-Only Cookie?

- A cookie that cannot be accessed by JavaScript (`document.cookie`)
- Automatically sent by the browser with every request to the same domain
- Provides protection against XSS attacks
- Perfect for storing sensitive tokens like refresh tokens

### Cookie Configuration in Your System

```javascript
res.cookie("refreshToken", refreshToken, {
  httpOnly: true, // Prevents JavaScript access
  secure: process.env.NODE_ENV === "production", // HTTPS only in production
  sameSite: "Strict", // CSRF protection
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days expiration
});
```

## Authentication Flow

### 1. Login Process

```
POST /api/auth/login
{
  "email": "doctor@clinic.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",  // Use this for API calls
    "userId": "674b9f081a923ec40f14b135",
    "name": "Dr. John Smith",
    "role": "doctor"
  }
}

Set-Cookie: refreshToken=eyJhbGciOiJIUzI1NiIs...; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000; Path=/
```

### 2. Using Access Token

Include the access token in the Authorization header for protected endpoints:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### 3. Token Refresh Process

When the access token expires, use the refresh endpoint:

```
GET /api/auth/refresh-token
(Cookie automatically sent: refreshToken=eyJhbGciOiJIUzI1NiIs...)

Response:
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."  // New access token
  }
}
```

## Testing with Different Tools

### 1. Testing with Swagger UI

**Limitations:**

- Swagger UI cannot set or send HTTP-only cookies
- You can test login and get the access token
- You cannot test the refresh-token endpoint directly

**Workaround for Login Testing:**

1. Use the login endpoint in Swagger
2. Copy the `accessToken` from the response
3. Click "Authorize" button in Swagger
4. Enter: `Bearer <your-access-token>`
5. Now you can test other protected endpoints

### 2. Testing with Postman

**Step 1: Login and Save Cookie**

```
POST http://localhost:4000/api/auth/login
Content-Type: application/json

{
  "email": "doctor@clinic.com",
  "password": "password123"
}
```

- Postman will automatically save the HTTP-only cookie
- Copy the `accessToken` for other requests

**Step 2: Use Access Token**

```
GET http://localhost:4000/api/patients/staff
Authorization: Bearer <your-access-token>
```

**Step 3: Test Refresh Token**

```
GET http://localhost:4000/api/auth/refresh-token
```

- The cookie is automatically sent
- No need to manually add anything

### 3. Testing with curl

**Login and Save Cookie:**

```bash
curl -c cookies.txt -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@clinic.com",
    "password": "password123"
  }'
```

**Use Access Token:**

```bash
curl -H "Authorization: Bearer <your-access-token>" \
  http://localhost:4000/api/patients/staff
```

**Refresh Token:**

```bash
curl -b cookies.txt -X GET http://localhost:4000/api/auth/refresh-token
```

### 4. Testing with Frontend JavaScript

**Login:**

```javascript
const response = await fetch("http://localhost:4000/api/auth/login", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  credentials: "include", // Important: This sends cookies
  body: JSON.stringify({
    email: "doctor@clinic.com",
    password: "password123",
  }),
});

const data = await response.json();
const accessToken = data.data.accessToken;

// Store access token (localStorage, sessionStorage, or state)
localStorage.setItem("accessToken", accessToken);
```

**Use Access Token:**

```javascript
const accessToken = localStorage.getItem("accessToken");

const response = await fetch("http://localhost:4000/api/patients/staff", {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
  credentials: "include", // This sends the HTTP-only cookie too
});
```

**Refresh Token:**

```javascript
const response = await fetch("http://localhost:4000/api/auth/refresh-token", {
  method: "GET",
  credentials: "include", // This automatically sends the HTTP-only cookie
});

if (response.ok) {
  const data = await response.json();
  const newAccessToken = data.data.accessToken;
  localStorage.setItem("accessToken", newAccessToken);
}
```

## Security Benefits

### 1. XSS Protection

- Refresh token cannot be accessed by malicious scripts
- Even if XSS occurs, attacker cannot steal the refresh token
- Access token exposure is limited by its short lifespan

### 2. CSRF Protection

- `SameSite: Strict` prevents cross-site request forgery
- Cookie only sent with same-site requests

### 3. Token Rotation

- Access tokens expire quickly (typically 15-60 minutes)
- Refresh tokens can be rotated for additional security

## Best Practices

### 1. Frontend Implementation

```javascript
// Automatically refresh token when needed
async function apiCall(url, options = {}) {
  let accessToken = localStorage.getItem("accessToken");

  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: "include",
  });

  if (response.status === 401) {
    // Token might be expired, try to refresh
    const refreshResponse = await fetch("/api/auth/refresh-token", {
      credentials: "include",
    });

    if (refreshResponse.ok) {
      const refreshData = await refreshResponse.json();
      const newAccessToken = refreshData.data.accessToken;
      localStorage.setItem("accessToken", newAccessToken);

      // Retry original request with new token
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${newAccessToken}`,
        },
        credentials: "include",
      });
    } else {
      // Refresh failed, redirect to login
      window.location.href = "/login";
    }
  }

  return response;
}
```

### 2. Environment Configuration

```env
NODE_ENV=production
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
```

## Troubleshooting

### Common Issues:

1. **Cookie not being sent:**

   - Ensure `credentials: 'include'` in fetch requests
   - Check CORS configuration allows credentials

2. **Swagger testing limitations:**

   - Use Postman or curl for complete testing
   - Swagger UI good for access token endpoints only

3. **CORS issues:**

   - Ensure your CORS configuration allows credentials
   - Set proper allowed origins

4. **Secure flag issues:**
   - In development (HTTP), set `secure: false`
   - In production (HTTPS), set `secure: true`

## Summary

Your HTTP-only cookie implementation provides excellent security for refresh tokens while maintaining usability. The cookie is automatically managed by the browser, and the dual-token approach gives you the best of both worlds: security and flexibility.
