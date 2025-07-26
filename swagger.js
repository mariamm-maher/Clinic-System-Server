// swagger.js
const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Clinic System APIs",
      version: "1.0.0",
      description: `
# Clinic Management System API

## Authentication
This API uses a dual-token authentication system:
- **Access Token**: Short-lived JWT for API authorization (included in Authorization header)
- **Refresh Token**: Long-lived JWT stored in HTTP-only cookie for token renewal

## Important Notes
- HTTP-only cookies cannot be tested directly in Swagger UI
- For complete testing, use Postman, curl, or browser-based applications
- The refresh token cookie is automatically sent by browsers when \`credentials: 'include'\` is used

## Testing Guide
1. **Login**: Use the login endpoint to get an access token and set the refresh cookie
2. **API Calls**: Use the access token in the Authorization header
3. **Token Refresh**: The refresh endpoint uses the HTTP-only cookie automatically

For detailed testing instructions, see the COOKIE_AUTHENTICATION_GUIDE.md file.
      `,
      contact: {
        name: "Clinic System Support",
        email: "support@clinicsystem.com",
      },
    },
    servers: [
      {
        url: "http://localhost:4000",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./routes/*.js"], // where your route comments will be
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = { swaggerUi, swaggerSpec };
