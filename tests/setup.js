/**
 * Test Setup File
 *
 * This file runs before all tests and sets up the testing environment.
 * It configures the in-memory database connection, environment variables,
 * and global test utilities for both unit and integration tests.
 */

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

// Mock environment variables for testing
process.env.NODE_ENV = "test";
process.env.JWT_ACCESS_SECRET = "test-access-secret-key-for-testing-only-12345";
process.env.JWT_REFRESH_SECRET =
  "test-refresh-secret-key-for-testing-only-67890";
process.env.PORT = "0"; // Use random available port for testing

// Global variables for test database
let mongoServer;

/**
 * Connect to in-memory MongoDB database before all tests
 * This ensures tests don't affect the real database
 */
beforeAll(async () => {
  try {
    // Close any existing mongoose connections
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    // Create in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create({
      binary: {
        version: "7.0.0", // Use a stable MongoDB version
      },
      instance: {
        dbName: "test-clinic-db",
      },
    });

    const mongoUri = mongoServer.getUri();

    // Connect mongoose to the in-memory database
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      bufferCommands: false, // Disable mongoose buffering
      bufferMaxEntries: 0, // Disable mongoose buffering
    });

    console.log("🚀 Test database connected successfully");
  } catch (error) {
    console.error("❌ Test database connection failed:", error);
    throw error;
  }
});

/**
 * Clean up database after each test
 * This ensures tests don't interfere with each other
 */
afterEach(async () => {
  try {
    const collections = mongoose.connection.collections;

    // Clear all collections
    const promises = Object.keys(collections).map(async (key) => {
      const collection = collections[key];
      await collection.deleteMany({});
    });

    await Promise.all(promises);
  } catch (error) {
    console.error("❌ Error cleaning test data:", error);
  }
});

/**
 * Disconnect and clean up after all tests
 */
afterAll(async () => {
  try {
    // Close mongoose connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }

    // Stop the in-memory MongoDB server
    if (mongoServer) {
      await mongoServer.stop();
    }

    console.log("🔥 Test database disconnected successfully");
  } catch (error) {
    console.error("❌ Error during test cleanup:", error);
  }
});

/**
 * Global test utilities
 * These functions can be used across all test files
 */
global.testUtils = {
  /**
   * Create a test user with specified role
   * @param {string} role - User role (admin, doctor, staff)
   * @param {object} customData - Additional user data
   * @returns {object} Created user object
   */
  createTestUser: async (role = "doctor", customData = {}) => {
    const User = require("../models/User");
    const bcrypt = require("bcryptjs");

    const userData = {
      name: `Test ${role} ${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      password: await bcrypt.hash("password123", 10),
      role: role,
      ...customData,
    };

    const user = new User(userData);
    return await user.save();
  },

  /**
   * Create a test patient
   * @param {object} customData - Additional patient data
   * @returns {object} Created patient object
   */
  createTestPatient: async (customData = {}) => {
    const Patient = require("../models/patient");

    const patientData = {
      generalInfo: {
        name: `Test Patient ${Date.now()}`,
        age: 30,
        gender: "male",
        phone: `123456789${Math.floor(Math.random() * 10)}`,
        address: "Test Address",
      },
      personalInfo: {
        occupation: "Test Occupation",
        maritalStatus: "single",
        children: 0,
        habits: ["none"],
      },
      ...customData,
    };

    const patient = new Patient(patientData);
    return await patient.save();
  },

  /**
   * Create a test booking
   * @param {string} patientId - Patient ID
   * @param {string} doctorId - Doctor ID
   * @param {object} customData - Additional booking data
   * @returns {object} Created booking object
   */
  createTestBooking: async (patientId, doctorId, customData = {}) => {
    const Booking = require("../models/booking");

    const bookingData = {
      patientId,
      doctorId,
      date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      time: "10:00",
      status: "confirmed",
      ...customData,
    };

    const booking = new Booking(bookingData);
    return await booking.save();
  },

  /**
   * Generate test JWT tokens
   * @param {object} user - User object
   * @returns {object} Access and refresh tokens
   */
  generateTestTokens: (user) => {
    const {
      generateAccessToken,
      generateRefreshToken,
    } = require("../util/token");

    return {
      accessToken: generateAccessToken(user._id, user.role),
      refreshToken: generateRefreshToken(user._id, user.role),
    };
  },

  /**
   * Create authorization header for requests
   * @param {string} token - JWT token
   * @returns {object} Authorization header object
   */
  authHeader: (token) => ({
    Authorization: `Bearer ${token}`,
  }),

  /**
   * Wait for a specified amount of time
   * @param {number} ms - Milliseconds to wait
   */
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),

  /**
   * Get the Express app for testing
   * @returns {object} Express app instance
   */
  getApp: () => {
    return require("../app");
  },
};

// Increase timeout for async operations
jest.setTimeout(30000);

// Handle unhandled promise rejections in tests
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
