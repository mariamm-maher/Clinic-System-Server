/**
 * Test Environment Configuration
 *
 * This file exports configuration specific to the test environment.
 * It ensures consistent test settings across all test files.
 */

module.exports = {
  // Database configuration
  database: {
    name: "test-clinic-db",
    version: "7.0.0",
  },

  // JWT configuration for tests
  jwt: {
    accessSecret: "test-access-secret-key-for-testing-only-12345",
    refreshSecret: "test-refresh-secret-key-for-testing-only-67890",
    accessExpiry: "15m",
    refreshExpiry: "7d",
  },

  // Server configuration
  server: {
    port: 0, // Use random available port
  },

  // Test data templates
  testData: {
    user: {
      doctor: {
        name: "Test Doctor",
        email: "doctor@test.com",
        password: "password123",
        role: "doctor",
      },
      admin: {
        name: "Test Admin",
        email: "admin@test.com",
        password: "password123",
        role: "admin",
      },
      staff: {
        name: "Test Staff",
        email: "staff@test.com",
        password: "password123",
        role: "staff",
      },
    },
    patient: {
      generalInfo: {
        name: "Test Patient",
        age: 30,
        gender: "male",
        phone: "1234567890",
        address: "Test Address",
      },
      personalInfo: {
        occupation: "Test Occupation",
        maritalStatus: "single",
        children: 0,
        habits: ["none"],
      },
    },
  },

  // Test timeouts
  timeouts: {
    short: 5000, // 5 seconds
    medium: 10000, // 10 seconds
    long: 30000, // 30 seconds
  },
};
