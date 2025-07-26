/**
 * Integration Tests for Patient Management Routes
 *
 * These tests verify that the complete patient management flow works correctly
 * including authentication, authorization, validation, and database operations.
 *
 * We test the actual HTTP endpoints with real database operations and
 * role-based access control to ensure the entire system works as expected.
 */

const request = require("supertest");
const express = require("express");
const cookieParser = require("cookie-parser");
const Patient = require("../../models/patient");
const patientRoutes = require("../../routes/patientRoutes");
const verifyToken = require("../../middlewares/verifyToken");
const errorHandler = require("../../middlewares/errorHandler");

describe("Patient Management Integration Tests", () => {
  let app;
  let doctorUser, staffUser, adminUser;
  let doctorToken, staffToken, adminToken;

  /**
   * Setup Express app and test users for testing
   *
   * This creates a minimal Express application with authentication
   * and creates test users with different roles.
   */
  beforeAll(async () => {
    // Setup Express app
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use("/api", patientRoutes);
    app.use(errorHandler);

    // Create test users with different roles
    doctorUser = await testUtils.createTestUser("doctor", {
      email: "doctor.patient@test.com",
    });

    staffUser = await testUtils.createTestUser("staff", {
      email: "staff.patient@test.com",
    });

    adminUser = await testUtils.createTestUser("admin", {
      email: "admin.patient@test.com",
    });

    // Generate tokens for each user
    const doctorTokens = testUtils.generateTestTokens(doctorUser);
    const staffTokens = testUtils.generateTestTokens(staffUser);
    const adminTokens = testUtils.generateTestTokens(adminUser);

    doctorToken = doctorTokens.accessToken;
    staffToken = staffTokens.accessToken;
    adminToken = adminTokens.accessToken;
  });

  describe("POST /api/patients - Create Patient Profile", () => {
    /**
     * Test Case: Staff creates patient profile successfully
     *
     * This test verifies that authenticated staff can create
     * new patient profiles with valid data.
     */
    it("should create patient profile successfully with valid data", async () => {
      // Arrange: Prepare valid patient data
      const patientData = {
        generalInfo: {
          name: "John Integration Test",
          age: 35,
          dateOfBirth: "1989-05-15",
          gender: "male",
          phone: "1234567890",
          address: "123 Test Street, Test City",
        },
        personalInfo: {
          occupation: "Software Engineer",
          maritalStatus: "married",
          children: 2,
          habits: ["non-smoker", "exercises regularly"],
          other: "No additional information",
        },
      };

      // Act: Send create patient request with staff token
      const response = await request(app)
        .post("/api/patients")
        .set("Authorization", `Bearer ${staffToken}`)
        .send(patientData)
        .expect(201);

      // Assert: Verify response and database state
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        "Patient profile created successfully"
      );
      expect(response.body.data).toHaveProperty("_id");
      expect(response.body.data.generalInfo.name).toBe(
        patientData.generalInfo.name
      );
      expect(response.body.data.generalInfo.phone).toBe(
        patientData.generalInfo.phone
      );

      // Verify patient was saved to database
      const savedPatient = await Patient.findById(response.body.data._id);
      expect(savedPatient).toBeTruthy();
      expect(savedPatient.generalInfo.name).toBe(patientData.generalInfo.name);
      expect(savedPatient.personalInfo.occupation).toBe(
        patientData.personalInfo.occupation
      );
      expect(savedPatient.createdAt).toBeDefined();
    });

    /**
     * Test Case: Doctor can also create patient profile
     *
     * This test verifies that doctors have permission to create
     * patient profiles as well.
     */
    it("should allow doctor to create patient profile", async () => {
      // Arrange: Prepare patient data
      const patientData = {
        generalInfo: {
          name: "Doctor Created Patient",
          age: 28,
          gender: "female",
          phone: "9876543210",
        },
      };

      // Act: Send create patient request with doctor token
      const response = await request(app)
        .post("/api/patients")
        .set("Authorization", `Bearer ${doctorToken}`)
        .send(patientData)
        .expect(201);

      // Assert: Verify successful creation
      expect(response.body.success).toBe(true);
      expect(response.body.data.generalInfo.name).toBe(
        patientData.generalInfo.name
      );
    });

    /**
     * Test Case: Validation fails with missing required fields
     *
     * This test verifies that patient creation fails when
     * required fields are missing from the request.
     */
    it("should reject patient creation with missing required fields", async () => {
      // Arrange: Prepare invalid patient data (missing required fields)
      const invalidPatientData = {
        generalInfo: {
          name: "Incomplete Patient",
          // Missing gender and phone (required fields)
        },
      };

      // Act: Send create patient request with invalid data
      const response = await request(app)
        .post("/api/patients")
        .set("Authorization", `Bearer ${staffToken}`)
        .send(invalidPatientData)
        .expect(400);

      // Assert: Verify validation error
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation Error");
      expect(response.body.code).toBe("VALIDATION_FAILED");
      expect(response.body.details).toBeInstanceOf(Array);
    });

    /**
     * Test Case: Unauthorized access without token
     *
     * This test verifies that patient creation requires authentication.
     */
    it("should reject patient creation without authentication", async () => {
      // Arrange: Prepare patient data
      const patientData = {
        generalInfo: {
          name: "Unauthorized Patient",
          gender: "male",
          phone: "1111111111",
        },
      };

      // Act: Send create patient request without token
      const response = await request(app)
        .post("/api/patients")
        .send(patientData)
        .expect(401);

      // Assert: Verify authentication error
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("token");
    });
  });

  describe("GET /api/patients/staff - Get All Patients for Staff", () => {
    /**
     * Test Case: Staff retrieves all patients successfully
     *
     * This test verifies that staff can retrieve a list of all patients.
     */
    it("should return all patients for authenticated staff", async () => {
      // Arrange: Create test patients
      const patient1 = await testUtils.createTestPatient({
        generalInfo: {
          name: "Test Patient 1",
          gender: "male",
          phone: "1111111111",
        },
      });

      const patient2 = await testUtils.createTestPatient({
        generalInfo: {
          name: "Test Patient 2",
          gender: "female",
          phone: "2222222222",
        },
      });

      // Act: Send get all patients request
      const response = await request(app)
        .get("/api/patients/staff")
        .set("Authorization", `Bearer ${staffToken}`)
        .expect(200);

      // Assert: Verify response contains patients
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);

      // Verify patient data structure
      const patientNames = response.body.data.map((p) => p.generalInfo.name);
      expect(patientNames).toContain("Test Patient 1");
      expect(patientNames).toContain("Test Patient 2");
    });

    /**
     * Test Case: Doctor can also retrieve all patients
     *
     * This test verifies that doctors have access to patient lists.
     */
    it("should allow doctor to retrieve all patients", async () => {
      // Act: Send get all patients request with doctor token
      const response = await request(app)
        .get("/api/patients/staff")
        .set("Authorization", `Bearer ${doctorToken}`)
        .expect(200);

      // Assert: Verify successful retrieval
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    /**
     * Test Case: Unauthorized access without token
     *
     * This test verifies that patient list requires authentication.
     */
    it("should reject request without authentication", async () => {
      // Act: Send get all patients request without token
      const response = await request(app)
        .get("/api/patients/staff")
        .expect(401);

      // Assert: Verify authentication error
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("token");
    });
  });

  describe("GET /api/patients/staff/:patientId - Get Patient by ID for Staff", () => {
    let testPatient;

    /**
     * Setup test patient before each test in this group
     */
    beforeEach(async () => {
      testPatient = await testUtils.createTestPatient({
        generalInfo: {
          name: "Staff Access Patient",
          age: 42,
          gender: "male",
          phone: "5555555555",
          address: "Staff Test Address",
        },
        personalInfo: {
          occupation: "Teacher",
          maritalStatus: "single",
          children: 0,
        },
      });
    });

    /**
     * Test Case: Staff retrieves patient by ID successfully
     *
     * This test verifies that staff can retrieve specific patient details by ID.
     */
    it("should return patient by ID for authenticated staff", async () => {
      // Act: Send get patient by ID request
      const response = await request(app)
        .get(`/api/patients/staff/${testPatient._id}`)
        .set("Authorization", `Bearer ${staffToken}`)
        .expect(200);

      // Assert: Verify response contains correct patient
      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testPatient._id.toString());
      expect(response.body.data.generalInfo.name).toBe("Staff Access Patient");
      expect(response.body.data.generalInfo.phone).toBe("5555555555");
      expect(response.body.data.personalInfo.occupation).toBe("Teacher");
    });

    /**
     * Test Case: Patient not found with invalid ID
     *
     * This test verifies proper error handling when patient doesn't exist.
     */
    it("should return 404 for non-existent patient ID", async () => {
      // Arrange: Use a valid ObjectId format but non-existent ID
      const nonExistentId = "507f1f77bcf86cd799439011";

      // Act: Send get patient by ID request with non-existent ID
      const response = await request(app)
        .get(`/api/patients/staff/${nonExistentId}`)
        .set("Authorization", `Bearer ${staffToken}`)
        .expect(404);

      // Assert: Verify error response
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Patient not found");
      expect(response.body.code).toBe("PATIENT_NOT_FOUND");
    });

    /**
     * Test Case: Invalid patient ID format
     *
     * This test verifies error handling for malformed patient IDs.
     */
    it("should return 400 for invalid patient ID format", async () => {
      // Arrange: Use invalid ObjectId format
      const invalidId = "invalid-id-format";

      // Act: Send get patient by ID request with invalid ID
      const response = await request(app)
        .get(`/api/patients/staff/${invalidId}`)
        .set("Authorization", `Bearer ${staffToken}`)
        .expect(400);

      // Assert: Verify error response
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Invalid patient ID format");
      expect(response.body.code).toBe("INVALID_ID_FORMAT");
    });
  });

  describe("GET /api/patients/doctor/:patientId - Get Patient Profile for Doctor", () => {
    let testPatientWithVisits;

    /**
     * Setup test patient with visits before each test
     */
    beforeEach(async () => {
      testPatientWithVisits = await testUtils.createTestPatient({
        generalInfo: {
          name: "Doctor Access Patient",
          age: 45,
          gender: "female",
          phone: "7777777777",
        },
        personalInfo: {
          occupation: "Nurse",
          maritalStatus: "married",
          children: 1,
          habits: ["non-smoker"],
        },
      });
    });

    /**
     * Test Case: Doctor retrieves detailed patient profile
     *
     * This test verifies that doctors can access detailed patient information
     * including medical history and visit records.
     */
    it("should return detailed patient profile for doctor", async () => {
      // Act: Send get patient profile request with doctor token
      const response = await request(app)
        .get(`/api/patients/doctor/${testPatientWithVisits._id}`)
        .set("Authorization", `Bearer ${doctorToken}`)
        .expect(200);

      // Assert: Verify response contains detailed patient information
      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testPatientWithVisits._id.toString());
      expect(response.body.data.generalInfo.name).toBe("Doctor Access Patient");
      expect(response.body.data.personalInfo.occupation).toBe("Nurse");
      expect(response.body.data).toHaveProperty("visits"); // Should include visits array
    });

    /**
     * Test Case: Staff cannot access doctor-only endpoint
     *
     * This test verifies that staff users cannot access doctor-specific
     * patient information endpoints.
     */
    it("should deny access to staff for doctor-only endpoint", async () => {
      // Act: Send get patient profile request with staff token
      const response = await request(app)
        .get(`/api/patients/doctor/${testPatientWithVisits._id}`)
        .set("Authorization", `Bearer ${staffToken}`)
        .expect(403);

      // Assert: Verify access denied error
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Access denied. Insufficient permissions."
      );
      expect(response.body.code).toBe("INSUFFICIENT_PERMISSIONS");
    });

    /**
     * Test Case: Admin can access doctor endpoint
     *
     * This test verifies that admin users have access to all endpoints.
     */
    it("should allow admin access to doctor endpoint", async () => {
      // Act: Send get patient profile request with admin token
      const response = await request(app)
        .get(`/api/patients/doctor/${testPatientWithVisits._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      // Assert: Verify successful access
      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testPatientWithVisits._id.toString());
    });
  });

  describe("Patient Management Workflow", () => {
    /**
     * Test Case: Complete patient management workflow
     *
     * This test verifies the entire patient management flow:
     * Create Patient → Retrieve All → Retrieve by ID → Doctor Access
     */
    it("should complete full patient management workflow", async () => {
      // Step 1: Staff creates a new patient
      const newPatientData = {
        generalInfo: {
          name: "Workflow Test Patient",
          age: 33,
          gender: "male",
          phone: "9999999999",
          address: "Workflow Test Address",
        },
        personalInfo: {
          occupation: "Workflow Tester",
          maritalStatus: "single",
          children: 0,
          habits: ["testing enthusiast"],
        },
      };

      const createResponse = await request(app)
        .post("/api/patients")
        .set("Authorization", `Bearer ${staffToken}`)
        .send(newPatientData)
        .expect(201);

      const patientId = createResponse.body.data._id;

      // Step 2: Staff retrieves all patients (should include new patient)
      const allPatientsResponse = await request(app)
        .get("/api/patients/staff")
        .set("Authorization", `Bearer ${staffToken}`)
        .expect(200);

      const patientNames = allPatientsResponse.body.data.map(
        (p) => p.generalInfo.name
      );
      expect(patientNames).toContain("Workflow Test Patient");

      // Step 3: Staff retrieves specific patient by ID
      const patientByIdResponse = await request(app)
        .get(`/api/patients/staff/${patientId}`)
        .set("Authorization", `Bearer ${staffToken}`)
        .expect(200);

      expect(patientByIdResponse.body.data.generalInfo.name).toBe(
        "Workflow Test Patient"
      );

      // Step 4: Doctor accesses detailed patient profile
      const doctorAccessResponse = await request(app)
        .get(`/api/patients/doctor/${patientId}`)
        .set("Authorization", `Bearer ${doctorToken}`)
        .expect(200);

      expect(doctorAccessResponse.body.data.generalInfo.name).toBe(
        "Workflow Test Patient"
      );
      expect(doctorAccessResponse.body.data).toHaveProperty("visits");

      console.log("✅ Complete patient management workflow test passed");
    });
  });
});
