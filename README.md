# Clinic Management System Server

A comprehensive clinic management system backend built with Node.js, Express, and MongoDB.

## Features

### 🔐 Authentication & Authorization

- **Dual-Token System**: Access tokens + HTTP-only refresh tokens
- **Role-Based Access Control**: Admin, Doctor, Staff roles
- **Google OAuth Integration**: Social login support
- **JWT Security**: Industry-standard token-based authentication

### 🏥 Core Functionality

- **Patient Management**: Complete patient profiles and medical history
- **Visit Management**: Consultation tracking with detailed medical records
- **Booking System**: Appointment scheduling and management
- **Schedule Management**: Doctor availability and time slot management
- **Staff Management**: User administration and role management

### 📚 API Documentation

- **Swagger UI**: Interactive API documentation
- **Comprehensive Schemas**: Detailed request/response models
- **Authentication Guide**: HTTP-only cookie implementation details

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd Clinic-System-Server

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start the server
npm start
```

### Environment Variables

```env
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb://localhost:27017/clinic-system
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## API Documentation

### Access Swagger UI

Visit: `http://localhost:4000/api-docs`

### Authentication System

#### Login Process

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "doctor@clinic.com",
  "password": "password123"
}
```

**Response:**

- Returns access token in response body
- Sets HTTP-only refresh token cookie
- Provides user information and role

#### Using Access Tokens

Include in Authorization header for protected endpoints:

```bash
Authorization: Bearer <your-access-token>
```

#### Token Refresh

```bash
GET /api/auth/refresh-token
```

- Automatically uses HTTP-only cookie
- Returns new access token

### Testing Authentication

#### Option 1: Use the Test Script

```bash
node test-auth.js
```

#### Option 2: Manual Testing with curl

```bash
# Login and save cookie
curl -c cookies.txt -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"doctor@clinic.com","password":"password123"}'

# Use access token for API calls
curl -H "Authorization: Bearer <token>" \
  http://localhost:4000/api/patients/staff

# Refresh token using saved cookie
curl -b cookies.txt -X GET http://localhost:4000/api/auth/refresh-token
```

#### Option 3: Frontend JavaScript

```javascript
// Login
const response = await fetch("/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include", // Important for cookies
  body: JSON.stringify({ email, password }),
});

// API calls with token
const apiResponse = await fetch("/api/patients/staff", {
  headers: { Authorization: `Bearer ${accessToken}` },
  credentials: "include",
});

// Token refresh
const refreshResponse = await fetch("/api/auth/refresh-token", {
  credentials: "include", // Automatically sends HTTP-only cookie
});
```

## API Endpoints

### Authentication (`/api/auth`)

- `POST /register` - Register new user
- `POST /login` - User login
- `GET /refresh-token` - Refresh access token
- `GET /google/callback` - Google OAuth callback

### Patients (`/api/patients`)

- `GET /patients/staff` - Get all patients (staff access)
- `GET /patients/staff/:id` - Get patient by ID (staff access)
- `GET /patients/doctor/:id` - Get patient profile (doctor access)
- `POST /patients` - Create patient profile

### Bookings (`/api/booking`)

- `GET /booking` - Get all bookings
- `GET /booking/:id` - Get booking by ID
- `POST /booking` - Create new booking
- `PUT /booking/:id` - Update booking

### Visits (`/api/visit`)

- `GET /visit/patient/:patientId` - Get patient visits (doctor only)
- `POST /visit/:patientId` - Create new visit (doctor only)
- `GET /visit/:visitId` - Get visit details (doctor only)
- `PUT /visit/:visitId/past-history` - Update past history (doctor only)
- `PUT /visit/:visitId/main-complaint` - Update main complaint (doctor only)
- `PUT /visit/:visitId/checks` - Update checks (doctor only)
- `PUT /visit/:visitId/examination` - Update examination (doctor only)
- `PUT /visit/:visitId/investigations` - Update investigations (doctor only)
- `PUT /visit/:visitId/prescription` - Update prescription (doctor only)

### Schedule (`/api/schedule`)

- `GET /schedule` - Get doctor schedule
- `POST /schedule` - Create schedule (doctor only)
- `PUT /schedule/:day` - Update day schedule (doctor only)
- `DELETE /schedule` - Delete schedule (doctor only)

### Staff Management (`/api/doctor/staff`)

- `GET /doctor/staff` - Get all staff (doctor only)
- `GET /doctor/staff/:id` - Get staff by ID (doctor only)
- `POST /doctor/staff` - Create staff user (doctor only)
- `DELETE /doctor/staff/:id` - Delete staff user (doctor only)

## Security Features

### HTTP-Only Cookies

- Refresh tokens stored in HTTP-only cookies
- Protection against XSS attacks
- Automatic browser management
- CSRF protection with SameSite policy

### Role-Based Access Control

- **Admin**: Full system access
- **Doctor**: Medical operations, staff management
- **Staff**: Patient management, booking operations

### Token Security

- Short-lived access tokens (15-60 minutes)
- Long-lived refresh tokens (30 days)
- Separate signing secrets
- Automatic token rotation

## Project Structure

```
Clinic-System-Server/
├── controllers/          # Request handlers
├── models/              # MongoDB schemas
├── routes/              # API route definitions
├── middlewares/         # Authentication, authorization, error handling
├── util/                # Utilities and validations
├── API_DOCUMENTATION.md # Complete API reference
├── COOKIE_AUTHENTICATION_GUIDE.md # Detailed auth guide
└── test-auth.js        # Authentication test script
```

## Development

### Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm test           # Run tests
```

### Adding New Features

1. Create model in `/models`
2. Add validation in `/util/validations`
3. Implement controller in `/controllers`
4. Define routes in `/routes`
5. Add Swagger documentation
6. Update this README

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Update documentation
6. Submit a pull request

## License

MIT License - see LICENSE file for details
