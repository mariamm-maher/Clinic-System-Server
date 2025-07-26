/**
 * Jest Configuration for Clinic Management System
 *
 * This file configures Jest testing framework for our Node.js application.
 * It sets up the testing environment, file patterns, and coverage settings.
 */

module.exports = {
  // Test environment - use Node.js environment for backend testing
  testEnvironment: "node",

  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // Collect coverage information from these files
  collectCoverageFrom: [
    "controllers/**/*.js", // Test all controller files
    "middlewares/**/*.js", // Test all middleware files
    "models/**/*.js", // Test all model files
    "util/**/*.js", // Test all utility files
    "app.js", // Include the main app file
    "!**/node_modules/**", // Exclude node_modules
    "!**/tests/**", // Exclude test files themselves
    "!**/coverage/**", // Exclude coverage directory
    "!index.js", // Exclude server startup file
  ],

  // Coverage directory
  coverageDirectory: "coverage",

  // Coverage reporters
  coverageReporters: [
    "text", // Console output
    "lcov", // For IDE integration
    "html", // HTML report
    "json-summary", // JSON summary
  ],

  // Test file patterns
  testMatch: [
    "**/tests/**/*.test.js", // All .test.js files in tests directory
    "**/tests/**/*.spec.js", // All .spec.js files in tests directory
  ],

  // Setup files to run before tests
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],

  // Module paths
  roots: ["<rootDir>"],

  // Timeout for tests (in milliseconds)
  testTimeout: 30000,

  // Verbose output
  verbose: true,

  // Force exit after tests complete (helps with hanging processes)
  forceExit: true,

  // Detect open handles (helps identify what's keeping the process alive)
  detectOpenHandles: true,

  // Maximum number of workers
  maxWorkers: 1, // Use single worker to avoid database conflicts

  // Test environment options
  testEnvironmentOptions: {
    // Set NODE_ENV to test
    NODE_ENV: "test",
  },

  // Global setup and teardown
  globalSetup: undefined,
  globalTeardown: undefined,

  // Transform files (if needed for ES modules)
  transform: {},

  // Module file extensions
  moduleFileExtensions: ["js", "json"],

  // Paths to ignore
  testPathIgnorePatterns: ["/node_modules/", "/coverage/"],

  // Coverage thresholds (optional - uncomment to enforce minimum coverage)
  // coverageThreshold: {
  //   global: {
  //     branches: 80,
  //     functions: 80,
  //     lines: 80,
  //     statements: 80
  //   }
  // },
};
