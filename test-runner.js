/**
 * Test Runner and Documentation
 *
 * This file provides comprehensive documentation about the test suite
 * and includes helper scripts to run different types of tests.
 *
 * The clinic management system has a complete test suite covering:
 * - Unit Tests: Testing individual functions in isolation
 * - Integration Tests: Testing complete workflows with database
 * - API Tests: Testing HTTP endpoints with authentication
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

/**
 * Test Configuration
 *
 * This configuration defines how tests are organized and executed.
 */
const testConfig = {
  // Test directories
  unitTestDir: "./tests/unit test",
  integrationTestDir: "./tests/integrated test",

  // Test patterns
  unitTestPattern: "**/*.test.js",
  integrationTestPattern: "**/*.integration.test.js",

  // Coverage settings
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};

/**
 * Test Documentation
 *
 * This section explains what each test file covers and how to interpret results.
 */
const testDocumentation = {
  unitTests: {
    "authController.test.js": {
      description:
        "Tests authentication functions (register, login, refresh token)",
      coverage: [
        "User registration with validation",
        "Password hashing and verification",
        "JWT token generation and validation",
        "Error handling for invalid credentials",
        "Cookie-based refresh token flow",
      ],
      keyTestCases: [
        "Successful user registration",
        "Duplicate email rejection",
        "Login with correct credentials",
        "Login failure with wrong password",
        "Token refresh with valid cookie",
        "Token refresh failure without cookie",
      ],
    },

    "patientController.test.js": {
      description: "Tests patient management functions",
      coverage: [
        "Patient profile creation",
        "Patient data validation",
        "Patient retrieval by ID and list",
        "Role-based access to patient data",
        "Error handling for invalid patient data",
      ],
      keyTestCases: [
        "Create patient with valid data",
        "Validation failure with missing fields",
        "Retrieve all patients for staff",
        "Retrieve patient by ID",
        "Handle patient not found errors",
        "Doctor access to detailed patient profiles",
      ],
    },

    "authorization.test.js": {
      description: "Tests role-based authorization middleware",
      coverage: [
        "Role-based access control",
        "User authentication verification",
        "Permission checking for different roles",
        "Error handling for unauthorized access",
        "Multiple role support",
      ],
      keyTestCases: [
        "Allow access for correct role",
        "Deny access for incorrect role",
        "Handle missing user object",
        "Handle missing user role",
        "Case-sensitive role checking",
      ],
    },
    "bookingController.test.js": {
      description: "Tests booking management functions",
      coverage: [
        "Booking creation and validation",
        "Booking status management",
        "Booking retrieval and updates",
        "Data validation for booking fields",
        "Error handling for booking operations",
      ],
      keyTestCases: [
        "Create booking with valid data",
        "Validation of required fields",
        "Status enum validation",
        "Retrieve bookings by ID",
        "Update booking information",
        "Handle non-existent bookings",
      ],
    },

    "visitController.test.js": {
      description: "Tests visit management functions",
      coverage: [
        "Visit creation for patients",
        "Visit information updates (past history, main complaint, checks)",
        "Medical examination and investigation tracking",
        "Prescription management",
        "Visit retrieval with populated relationships",
      ],
      keyTestCases: [
        "Create visit for existing patient",
        "Update visit past history",
        "Update main complaint details",
        "Manage checks and vital signs",
        "Handle visit not found errors",
        "Retrieve visits by patient ID",
      ],
    },

    "scheduleController.test.js": {
      description: "Tests doctor schedule management functions",
      coverage: [
        "Schedule creation and initialization",
        "Day-specific schedule updates",
        "Schedule retrieval and validation",
        "Schedule deletion and cleanup",
        "Day name validation and error handling",
      ],
      keyTestCases: [
        "Create new doctor schedule",
        "Update specific day availability",
        "Validate day names for updates",
        "Handle schedule not found",
        "Prevent duplicate schedule creation",
        "Delete existing schedules",
      ],
    },

    "staffController.test.js": {
      description: "Tests staff user management functions",
      coverage: [
        "Staff user creation with validation",
        "Staff user retrieval and listing",
        "Staff user deletion and cleanup",
        "Password hashing and security",
        "Role-based access control for staff management",
      ],
      keyTestCases: [
        "Create staff user with valid data",
        "Prevent duplicate email registration",
        "Retrieve all staff users",
        "Retrieve staff user by ID",
        "Delete staff user successfully",
        "Handle staff user not found errors",
      ],
    },
  },

  integrationTests: {
    "auth.integration.test.js": {
      description:
        "Tests complete authentication workflow through HTTP endpoints",
      coverage: [
        "End-to-end registration flow",
        "Complete login process with cookies",
        "Token refresh through HTTP endpoints",
        "Database operations for user management",
        "HTTP status codes and response formats",
      ],
      keyTestCases: [
        "Complete registration workflow",
        "Login with cookie setting",
        "Token refresh using HTTP-only cookies",
        "Authentication error responses",
        "Full authentication workflow integration",
      ],
    },
    "patient.integration.test.js": {
      description:
        "Tests complete patient management workflow through HTTP endpoints",
      coverage: [
        "Patient CRUD operations via HTTP",
        "Role-based endpoint access",
        "Authentication and authorization integration",
        "Database persistence and retrieval",
        "Complete patient management workflow",
      ],
      keyTestCases: [
        "Create patient through API",
        "Retrieve patients with authentication",
        "Role-based access enforcement",
        "Complete patient management workflow",
        "Error handling in HTTP context",
      ],
    },

    "booking.integration.test.js": {
      description:
        "Tests complete booking management workflow through HTTP endpoints",
      coverage: [
        "Booking CRUD operations via HTTP",
        "Booking status workflow management",
        "Data validation through API endpoints",
        "Authentication and authorization for bookings",
        "Complete booking lifecycle management",
      ],
      keyTestCases: [
        "Create booking through API",
        "Retrieve bookings with authentication",
        "Update booking status workflow",
        "Validate booking data through HTTP",
        "Handle booking errors in HTTP context",
        "Complete booking management workflow",
      ],
    },

    "visit.integration.test.js": {
      description:
        "Tests complete visit management workflow through HTTP endpoints",
      coverage: [
        "Visit creation and patient association",
        "Visit information updates through API",
        "Medical data management via HTTP",
        "Visit retrieval with populated data",
        "Complete visit management workflow",
      ],
      keyTestCases: [
        "Create visit for patient through API",
        "Update visit information via HTTP",
        "Retrieve visits with populated relationships",
        "Handle visit errors in HTTP context",
        "Complete visit workflow integration",
        "Medical data persistence and retrieval",
      ],
    },

    "schedule.integration.test.js": {
      description:
        "Tests complete schedule management workflow through HTTP endpoints",
      coverage: [
        "Schedule CRUD operations via HTTP",
        "Day-specific schedule management through API",
        "Doctor role authorization for schedules",
        "Schedule data validation and persistence",
        "Complete schedule management workflow",
      ],
      keyTestCases: [
        "Create doctor schedule through API",
        "Update day schedules via HTTP",
        "Delete schedules with authorization",
        "Handle schedule errors in HTTP context",
        "Role-based schedule access control",
        "Complete schedule workflow integration",
      ],
    },

    "staff.integration.test.js": {
      description:
        "Tests complete staff management workflow through HTTP endpoints",
      coverage: [
        "Staff user CRUD operations via HTTP",
        "Staff user authentication and authorization",
        "Role-based access control for staff management",
        "Staff data validation and security",
        "Complete staff management workflow",
      ],
      keyTestCases: [
        "Create staff user through API",
        "Retrieve staff users with authentication",
        "Delete staff users with authorization",
        "Handle staff management errors in HTTP context",
        "Role-based staff access control",
        "Complete staff workflow integration",
      ],
    },
  },
};

/**
 * Test Runner Functions
 *
 * These functions provide different ways to run the test suite.
 */
const testRunner = {
  /**
   * Run all unit tests
   *
   * Executes all unit tests that test individual functions in isolation.
   */
  runUnitTests: () => {
    console.log("🧪 Running Unit Tests...");
    console.log("=".repeat(50));

    try {
      execSync("npm run test:unit", { stdio: "inherit" });
      console.log("✅ Unit tests completed successfully");
    } catch (error) {
      console.log("❌ Unit tests failed");
      process.exit(1);
    }
  },

  /**
   * Run all integration tests
   *
   * Executes all integration tests that test complete workflows.
   */
  runIntegrationTests: () => {
    console.log("🔗 Running Integration Tests...");
    console.log("=".repeat(50));

    try {
      execSync("npm run test:integration", { stdio: "inherit" });
      console.log("✅ Integration tests completed successfully");
    } catch (error) {
      console.log("❌ Integration tests failed");
      process.exit(1);
    }
  },

  /**
   * Run all tests with coverage
   *
   * Executes complete test suite and generates coverage report.
   */
  runAllTestsWithCoverage: () => {
    console.log("📊 Running All Tests with Coverage...");
    console.log("=".repeat(50));

    try {
      execSync("npm run test:coverage", { stdio: "inherit" });
      console.log("✅ All tests completed with coverage report");
    } catch (error) {
      console.log("❌ Tests failed");
      process.exit(1);
    }
  },

  /**
   * Run tests in watch mode
   *
   * Runs tests continuously, re-running when files change.
   */
  runTestsInWatchMode: () => {
    console.log("👀 Running Tests in Watch Mode...");
    console.log("=".repeat(50));
    console.log("Press Ctrl+C to stop watching");

    try {
      execSync("npm run test:watch", { stdio: "inherit" });
    } catch (error) {
      console.log("❌ Watch mode terminated");
    }
  },
};

/**
 * Test Helper Functions
 *
 * These functions provide utilities for working with tests.
 */
const testHelpers = {
  /**
   * Display test documentation
   *
   * Shows detailed information about what each test file covers.
   */
  showTestDocumentation: () => {
    console.log("📚 Test Documentation");
    console.log("=".repeat(50));

    console.log("\n🔬 Unit Tests:");
    Object.entries(testDocumentation.unitTests).forEach(([fileName, info]) => {
      console.log(`\n  📁 ${fileName}`);
      console.log(`     ${info.description}`);
      console.log(`     Coverage: ${info.coverage.length} areas`);
      console.log(`     Test Cases: ${info.keyTestCases.length} scenarios`);
    });

    console.log("\n🔗 Integration Tests:");
    Object.entries(testDocumentation.integrationTests).forEach(
      ([fileName, info]) => {
        console.log(`\n  📁 ${fileName}`);
        console.log(`     ${info.description}`);
        console.log(`     Coverage: ${info.coverage.length} areas`);
        console.log(`     Test Cases: ${info.keyTestCases.length} scenarios`);
      }
    );
  },

  /**
   * Check test file structure
   *
   * Verifies that all expected test files exist.
   */
  checkTestStructure: () => {
    console.log("🏗️  Checking Test Structure...");
    console.log("=".repeat(50));
    const requiredFiles = [
      "tests/setup.js",
      "tests/unit test/authController.test.js",
      "tests/unit test/patientController.test.js",
      "tests/unit test/authorization.test.js",
      "tests/unit test/bookingController.test.js",
      "tests/unit test/visitController.test.js",
      "tests/unit test/scheduleController.test.js",
      "tests/unit test/staffController.test.js",
      "tests/integrated test/auth.integration.test.js",
      "tests/integrated test/patient.integration.test.js",
      "tests/integrated test/booking.integration.test.js",
      "tests/integrated test/visit.integration.test.js",
      "tests/integrated test/schedule.integration.test.js",
      "tests/integrated test/staff.integration.test.js",
      "jest.config.js",
    ];

    let allFilesExist = true;

    requiredFiles.forEach((filePath) => {
      if (fs.existsSync(filePath)) {
        console.log(`✅ ${filePath}`);
      } else {
        console.log(`❌ ${filePath} - MISSING`);
        allFilesExist = false;
      }
    });

    if (allFilesExist) {
      console.log("\n✅ All test files are present");
    } else {
      console.log("\n❌ Some test files are missing");
    }
  },

  /**
   * Generate test report
   *
   * Creates a summary of test coverage and results.
   */
  generateTestReport: () => {
    console.log("📋 Generating Test Report...");
    console.log("=".repeat(50));

    try {
      // Run tests and capture output
      execSync("npm run test:coverage -- --silent", { stdio: "pipe" });

      // Check if coverage directory exists
      if (fs.existsSync("coverage")) {
        console.log("✅ Coverage report generated in ./coverage directory");
        console.log("📄 Open ./coverage/index.html to view detailed coverage");
      }

      // Count test files
      const unitTestFiles = fs
        .readdirSync("tests/unit test")
        .filter((f) => f.endsWith(".test.js"));
      const integrationTestFiles = fs
        .readdirSync("tests/integrated test")
        .filter((f) => f.endsWith(".test.js"));

      console.log(`\n📊 Test Summary:`);
      console.log(`   Unit Test Files: ${unitTestFiles.length}`);
      console.log(`   Integration Test Files: ${integrationTestFiles.length}`);
      console.log(
        `   Total Test Files: ${
          unitTestFiles.length + integrationTestFiles.length
        }`
      );
    } catch (error) {
      console.log("❌ Failed to generate test report");
    }
  },
};

/**
 * Command Line Interface
 *
 * This section handles command line arguments to run specific test operations.
 */
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case "unit":
      testRunner.runUnitTests();
      break;

    case "integration":
      testRunner.runIntegrationTests();
      break;

    case "coverage":
      testRunner.runAllTestsWithCoverage();
      break;

    case "watch":
      testRunner.runTestsInWatchMode();
      break;

    case "docs":
      testHelpers.showTestDocumentation();
      break;

    case "check":
      testHelpers.checkTestStructure();
      break;

    case "report":
      testHelpers.generateTestReport();
      break;

    default:
      console.log("🧪 Clinic System Test Suite");
      console.log("=".repeat(50));
      console.log("Available commands:");
      console.log("  node test-runner.js unit        - Run unit tests");
      console.log("  node test-runner.js integration - Run integration tests");
      console.log(
        "  node test-runner.js coverage    - Run all tests with coverage"
      );
      console.log(
        "  node test-runner.js watch       - Run tests in watch mode"
      );
      console.log(
        "  node test-runner.js docs        - Show test documentation"
      );
      console.log(
        "  node test-runner.js check       - Check test file structure"
      );
      console.log("  node test-runner.js report      - Generate test report");
      console.log("\nOr use npm scripts:");
      console.log("  npm test           - Run all tests");
      console.log("  npm run test:unit  - Run unit tests only");
      console.log("  npm run test:integration - Run integration tests only");
      console.log("  npm run test:coverage - Run tests with coverage");
      console.log("  npm run test:watch - Run tests in watch mode");
  }
}

module.exports = {
  testConfig,
  testDocumentation,
  testRunner,
  testHelpers,
};
