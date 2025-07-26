/**
 * Express Application Setup
 *
 * This file creates and configures the Express application without starting the server.
 * This separation allows us to import the app for testing without triggering app.listen().
 */

const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const connectDB = require("./DBConnection");
const cors = require("cors");
const { swaggerUi, swaggerSpec } = require("./swagger");
const errorHandler = require("./middlewares/errorHandler");

// Route imports
const authRoutes = require("./routes/authRoute");
const patientRoutes = require("./routes/patientRoutes");
const ShecduleRoutes = require("./routes/scheduleRoutes");
const BookingRoutes = require("./routes/BookingRoutes");
const visitRoutes = require("./routes/visitRoute");
const staffRoutes = require("./routes/staffRoutes");

// Load environment variables
dotenv.config();

// Create express app
const app = express();

// Connect to MongoDB only if not in test environment
if (process.env.NODE_ENV !== "test") {
  connectDB();
}

// CORS configuration
app.use(
  cors({
    credentials: true, // Allow cookies to be sent with requests
  })
);

// Swagger documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: `
    .swagger-ui .info .title {
      color: #3b82f6;
    }
    .swagger-ui .info .description {
      margin: 20px 0;
    }
    .auth-container {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
    }
  `,
    customSiteTitle: "Clinic System API Documentation",
    customfavIcon: "/favicon.ico",
  })
);

// Middleware
app.use(express.json()); // Parse JSON requests
app.use(cookieParser()); // Parse cookies

// Routes
app.use("/api/auth", authRoutes);
app.use("/api", patientRoutes);
app.use("/api", ShecduleRoutes);
app.use("/api", BookingRoutes);
app.use("/api", visitRoutes);
app.use("/api", staffRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Export the app for testing and server startup
module.exports = app;
