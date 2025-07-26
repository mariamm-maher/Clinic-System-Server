# Clinic System API Documentation

## Overview
This document provides a comprehensive overview of the Clinic Management System API documentation implemented using Swagger/OpenAPI 3.0.

## Swagger UI Access
- **URL**: http://localhost:4000/api-docs
- **Server**: Development server running on port 4000

## Authentication
All protected endpoints require Bearer JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints Documentation

### 1. Authentication APIs (`/api/auth`)
- **POST** `/api/auth/register` - Register a new user
- **POST** `/api/auth/login` - Login user
- **GET** `/api/auth/refresh-token` - Refresh access token
- **GET** `/api/auth/google/callback` - Google OAuth callback

### 2. Patient Management APIs (`/api/patients`)
- **GET** `/api/patients/staff` - Get all patients (staff access)
- **GET** `/api/patients/staff/{patientId}` - Get patient by ID (staff access)
- **GET** `/api/patients/doctor/{patientId}` - Get patient profile (doctor access)
- **POST** `/api/patients` - Create new patient profile

### 3. Booking Management APIs (`/api/booking`)
- **POST** `/api/booking` - Create new booking
- **GET** `/api/booking` - Get all bookings
- **GET** `/api/booking/{bookingId}` - Get booking by ID
- **PUT** `/api/booking/{bookingId}` - Update booking

### 4. Visit Management APIs (`/api/visit`)
- **GET** `/api/visit/patient/{patientId}` - Get all visits for a patient (doctor only)
- **POST** `/api/visit/{patientId}` - Create new visit (doctor only)
- **GET** `/api/visit/{visitId}` - Get visit by ID (doctor only)
- **PUT** `/api/visit/{visitId}/past-history` - Update past history (doctor only)
- **PUT** `/api/visit/{visitId}/main-complaint` - Update main complaint (doctor only)
- **PUT** `/api/visit/{visitId}/checks` - Update checks (doctor only)
- **PUT** `/api/visit/{visitId}/examination` - Update examination (doctor only)
- **PUT** `/api/visit/{visitId}/investigations` - Update investigations (doctor only)
- **PUT** `/api/visit/{visitId}/prescription` - Update prescription (doctor only)

### 5. Schedule Management APIs (`/api/schedule`)
- **GET** `/api/schedule` - Get doctor's schedule
- **POST** `/api/schedule` - Add new schedule (doctor only)
- **PUT** `/api/schedule/{day}` - Update schedule for specific day (doctor only)
- **DELETE** `/api/schedule` - Delete doctor's schedule (doctor only)

### 6. Staff Management APIs (`/api/doctor/staff`)
- **POST** `/api/doctor/staff` - Create new staff user (doctor only)
- **GET** `/api/doctor/staff` - Get all staff users (doctor only)
- **GET** `/api/doctor/staff/{userId}` - Get staff user by ID (doctor only)
- **DELETE** `/api/doctor/staff/{userId}` - Delete staff user (doctor only)

## Data Models

### Core Schemas Documented:

1. **User/Staff Schema**
   - Authentication and user management
   - Role-based access (admin, doctor, staff)

2. **Patient Schema**
   - General information (name, age, gender, contact)
   - Personal information (occupation, marital status, habits)
   - Visit history references

3. **Booking Schema**
   - Patient information
   - Appointment scheduling
   - Status tracking (pending, confirmed, canceled, done)
   - Source tracking (clinic, phone, website)

4. **Visit Schema**
   - Patient reference
   - Visit type (consultation, follow-up)
   - Complete medical record structure

5. **Medical Record Components**:
   - **Past History**: Medical history, medications, surgeries, allergies
   - **Main Complaint**: Detailed symptom documentation
   - **Checks**: Systematic review of systems
   - **Examination**: Physical examination findings
   - **Investigation**: Lab tests, imaging, procedures
   - **Prescription**: Medications and medical advice

6. **Schedule Schema**
   - Weekly schedule management
   - Time slots and availability
   - Day-specific configurations

## Security Features
- JWT Bearer token authentication
- Role-based authorization
- Protected endpoints with appropriate access levels
- Secure password handling

## Response Format
All API responses follow a standardized format:
```json
{
  "success": boolean,
  "data": object|array,
  "message": string (optional)
}
```

## Error Handling
Comprehensive error responses with appropriate HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request/Validation Error
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Implementation Features
- Complete CRUD operations for all entities
- Relationship management between models
- Comprehensive validation schemas
- Proper HTTP status codes
- Detailed error descriptions
- Request/response examples
- Parameter documentation

## Usage Instructions
1. Start the server: `npm start`
2. Navigate to http://localhost:4000/api-docs
3. Use the "Authorize" button to add your JWT token
4. Test endpoints directly from the Swagger UI
5. View detailed schemas and examples

## Tags Organization
- Authentication
- Patients
- Bookings
- Visits
- Schedule
- Staff Management

This documentation provides a complete reference for developers and API consumers to understand and interact with the Clinic Management System API.
