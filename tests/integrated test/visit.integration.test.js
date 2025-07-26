/**
 * Integration Tests for Visit Management Workflow
 *
 * These tests verify that the complete visit management workflow works correctly
 * from end to end. We test the full HTTP request/response cycle including:
 * - Creating visits for patients
 * - Updating visit information (past history, main complaint, checks, etc.)
 * - Retrieving visit data with populated relationships
 * - Error handling for invalid requests
 *
 * Integration tests use a real test database and test the complete flow
 * including middleware, controllers, and database operations.
 */

const request = require("supertest");
const app = require("../../index");
const Visit = require("../../models/visit");
const Patient = require("../../models/patient");
const Checks = require("../../models/checks");
const { generateTokens } = require("../setup");

describe("Visit Management Integration Tests", () => {
  let authTokens;
  let testPatient;
  let testVisit;

  /**
   * Setup: Create test user and patient before running tests
   *
   * This setup ensures we have authenticated users and test data
   * required for visit management tests.
   */
  beforeEach(async () => {
    // Create authenticated test user (doctor role for visit management)
    authTokens = await generateTokens({
      id: "doctor123",
      email: "doctor@clinic.com",
      role: "doctor",
    });

    // Create test patient for visit association
    testPatient = await Patient.create({
      generalInfo: {
        name: "Test Patient",
        age: 35,
        gender: "male",
        phone: "1234567890",
        email: "patient@test.com",
      },
      visits: [],
    });
  });

  /**
   * Cleanup: Remove test data after each test
   *
   * This ensures each test starts with a clean database state
   * and prevents test interference.
   */
  afterEach(async () => {
    await Visit.deleteMany({});
    await Patient.deleteMany({});
    await Checks.deleteMany({});
  });

  describe("Visit Creation Workflow", () => {
    /**
     * Test Case: Successfully create a new visit
     *
     * This test verifies the complete workflow of creating a new visit
     * for an existing patient with proper authentication.
     */
    it("should create new visit successfully", async () => {
      // Arrange: Set up visit data
      const visitData = {
        type: "consultation",
      };

      // Act: Send POST request to create visit
      const response = await request(app)
        .post(`/api/visit/${testPatient._id}`)
        .set("Authorization", `Bearer ${authTokens.accessToken}`)
        .send(visitData)
        .expect(201);

      // Assert: Verify response structure
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Visit created successfully"
      );
      expect(response.body.data).toHaveProperty("visit");
      expect(response.body.data.visit).toHaveProperty(
        "patient",
        testPatient._id.toString()
      );
      expect(response.body.data.visit).toHaveProperty("type", "consultation");

      // Verify visit was saved to database
      const savedVisit = await Visit.findById(response.body.data.visit._id);
      expect(savedVisit).toBeTruthy();
      expect(savedVisit.patient.toString()).toBe(testPatient._id.toString());

      // Verify patient's visits array was updated
      const updatedPatient = await Patient.findById(testPatient._id);
      expect(updatedPatient.visits).toContain(savedVisit._id);
    });

    /**
     * Test Case: Fail to create visit for non-existent patient
     *
     * This test ensures that visit creation fails appropriately
     * when trying to create a visit for a patient that doesn't exist.
     */
    it("should fail to create visit for non-existent patient", async () => {
      // Arrange: Use non-existent patient ID
      const nonExistentPatientId = "507f1f77bcf86cd799439011";
      const visitData = {
        type: "follow-up",
      };

      // Act: Send POST request with non-existent patient ID
      const response = await request(app)
        .post(`/api/visit/${nonExistentPatientId}`)
        .set("Authorization", `Bearer ${authTokens.accessToken}`)
        .send(visitData)
        .expect(404);

      // Assert: Verify error response
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "PATIENT_NOT_FOUND");
    });

    /**
     * Test Case: Require authentication for visit creation
     *
     * This test ensures that visit creation requires proper authentication
     * and fails when no auth token is provided.
     */
    it("should require authentication for visit creation", async () => {
      // Arrange: Set up visit data
      const visitData = {
        type: "consultation",
      };

      // Act: Send POST request without authentication
      const response = await request(app)
        .post(`/api/visit/${testPatient._id}`)
        .send(visitData)
        .expect(401);

      // Assert: Verify unauthorized response
      expect(response.body).toHaveProperty("success", false);
    });

    /**
     * Test Case: Validate required fields
     *
     * This test ensures that visit creation validates required fields
     * and provides appropriate error messages.
     */
    it("should validate required fields for visit creation", async () => {
      // Arrange: Send request without required type field
      const invalidVisitData = {};

      // Act: Send POST request with missing required fields
      const response = await request(app)
        .post(`/api/visit/${testPatient._id}`)
        .set("Authorization", `Bearer ${authTokens.accessToken}`)
        .send(invalidVisitData)
        .expect(400);

      // Assert: Verify validation error
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "MISSING_FIELDS");
    });
  });

  describe("Visit Update Workflow", () => {
    /**
     * Setup: Create a test visit before update tests
     */
    beforeEach(async () => {
      testVisit = await Visit.create({
        patient: testPatient._id,
        type: "consultation",
        date: new Date(),
      });
    });

    /**
     * Test Case: Successfully update visit past history
     *
     * This test verifies that visit past history can be updated
     * with proper validation and database persistence.
     */
    it("should update visit past history successfully", async () => {
      // Arrange: Set up past history data
      const pastHistoryData = {
        pastHistory: {
          medicalHistory: "Hypertension, Diabetes Type 2",
          surgicalHistory: "Appendectomy 2019",
          familyHistory: "Heart disease (father)",
          allergies: "Penicillin",
        },
      };

      // Act: Send PUT request to update past history
      const response = await request(app)
        .put(`/api/visit/${testVisit._id}/past-history`)
        .set("Authorization", `Bearer ${authTokens.accessToken}`)
        .send(pastHistoryData)
        .expect(200);

      // Assert: Verify response structure
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Visit updated successfully"
      );
      expect(response.body.data).toHaveProperty("visit");
      expect(response.body.data.visit.pastHistory).toMatchObject(
        pastHistoryData.pastHistory
      );

      // Verify changes were saved to database
      const updatedVisit = await Visit.findById(testVisit._id);
      expect(updatedVisit.pastHistory.medicalHistory).toBe(
        "Hypertension, Diabetes Type 2"
      );
      expect(updatedVisit.pastHistory.surgicalHistory).toBe(
        "Appendectomy 2019"
      );
    });

    /**
     * Test Case: Successfully update visit main complaint
     *
     * This test verifies that visit main complaint can be updated
     * with appropriate data validation.
     */
    it("should update visit main complaint successfully", async () => {
      // Arrange: Set up main complaint data
      const mainComplaintData = {
        mainComplaint: {
          chiefComplaint: "Chest pain radiating to left arm",
          duration: "2 hours",
          severity: "severe",
          location: "substernal",
          quality: "crushing",
          associatedSymptoms: "shortness of breath, nausea",
        },
      };

      // Act: Send PUT request to update main complaint
      const response = await request(app)
        .put(`/api/visit/${testVisit._id}/main-complaint`)
        .set("Authorization", `Bearer ${authTokens.accessToken}`)
        .send(mainComplaintData)
        .expect(200);

      // Assert: Verify response structure
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Main complaint updated successfully"
      );
      expect(response.body.data.visit.mainComplaint).toMatchObject(
        mainComplaintData.mainComplaint
      );

      // Verify changes were saved to database
      const updatedVisit = await Visit.findById(testVisit._id);
      expect(updatedVisit.mainComplaint.chiefComplaint).toBe(
        "Chest pain radiating to left arm"
      );
      expect(updatedVisit.mainComplaint.severity).toBe("severe");
    });

    /**
     * Test Case: Successfully update visit checks
     *
     * This test verifies that visit checks can be updated and that
     * a new checks document is created when none exists.
     */
    it("should update visit checks successfully", async () => {
      // Arrange: Set up checks data
      const checksData = {
        checks: {
          "vitalSigns.bloodPressure": "140/90",
          "vitalSigns.heartRate": "85",
          "vitalSigns.temperature": "99.2",
          "vitalSigns.respiratoryRate": "18",
          "vitalSigns.oxygenSaturation": "98%",
        },
      };

      // Act: Send PUT request to update checks
      const response = await request(app)
        .put(`/api/visit/${testVisit._id}/checks`)
        .set("Authorization", `Bearer ${authTokens.accessToken}`)
        .send(checksData)
        .expect(200);

      // Assert: Verify response structure
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Checks updated successfully"
      );
      expect(response.body.data).toHaveProperty("visit");

      // Verify visit now has checks reference
      const updatedVisit = await Visit.findById(testVisit._id);
      expect(updatedVisit.checks).toBeTruthy();

      // Verify checks document was created in database
      const checksDocument = await Checks.findById(updatedVisit.checks);
      expect(checksDocument).toBeTruthy();
    });

    /**
     * Test Case: Require valid visit ID for updates
     *
     * This test ensures that visit updates fail appropriately
     * when an invalid visit ID is provided.
     */
    it("should require valid visit ID for updates", async () => {
      // Arrange: Use non-existent visit ID
      const nonExistentVisitId = "507f1f77bcf86cd799439011";
      const updateData = {
        pastHistory: {
          medicalHistory: "Test history",
        },
      };

      // Act: Send PUT request with non-existent visit ID
      const response = await request(app)
        .put(`/api/visit/${nonExistentVisitId}/past-history`)
        .set("Authorization", `Bearer ${authTokens.accessToken}`)
        .send(updateData)
        .expect(404);

      // Assert: Verify error response
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "VISIT_NOT_FOUND");
    });

    /**
     * Test Case: Validate update data is provided
     *
     * This test ensures that visit updates require actual data
     * and fail when empty update objects are sent.
     */
    it("should validate update data is provided", async () => {
      // Arrange: Send request with empty past history
      const emptyUpdateData = {
        pastHistory: {},
      };

      // Act: Send PUT request with empty data
      const response = await request(app)
        .put(`/api/visit/${testVisit._id}/past-history`)
        .set("Authorization", `Bearer ${authTokens.accessToken}`)
        .send(emptyUpdateData)
        .expect(400);

      // Assert: Verify validation error
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty(
        "code",
        "MISSING_PAST_HISTORY_DATA"
      );
    });
  });

  describe("Visit Retrieval Workflow", () => {
    /**
     * Setup: Create test visits with related data
     */
    beforeEach(async () => {
      // Create visit with checks
      const checksDoc = await Checks.create({
        vitalSigns: {
          bloodPressure: "120/80",
          heartRate: "72",
          temperature: "98.6",
        },
      });

      testVisit = await Visit.create({
        patient: testPatient._id,
        type: "consultation",
        date: new Date(),
        checks: checksDoc._id,
        pastHistory: {
          medicalHistory: "Diabetes",
          surgicalHistory: "None",
        },
        mainComplaint: {
          chiefComplaint: "Headache",
          duration: "3 days",
        },
      });

      // Update patient to include visit
      testPatient.visits.push(testVisit._id);
      await testPatient.save();
    });

    /**
     * Test Case: Successfully retrieve visit by ID
     *
     * This test verifies that a specific visit can be retrieved
     * with all populated relationships and complete data.
     */
    it("should retrieve visit by ID successfully", async () => {
      // Act: Send GET request to retrieve visit by ID
      const response = await request(app)
        .get(`/api/visit/${testVisit._id}`)
        .set("Authorization", `Bearer ${authTokens.accessToken}`)
        .expect(200);

      // Assert: Verify response structure and data
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Visit retrieved successfully"
      );
      expect(response.body.data).toHaveProperty("visit");

      const visit = response.body.data.visit;
      expect(visit).toHaveProperty("_id", testVisit._id.toString());
      expect(visit).toHaveProperty("type", "consultation");
      expect(visit).toHaveProperty("pastHistory");
      expect(visit).toHaveProperty("mainComplaint");
      expect(visit).toHaveProperty("checks");

      // Verify populated checks data
      expect(visit.checks).toHaveProperty("vitalSigns");
      expect(visit.checks.vitalSigns).toHaveProperty("bloodPressure", "120/80");
    });

    /**
     * Test Case: Successfully retrieve all visits for a patient
     *
     * This test verifies that all visits for a specific patient
     * can be retrieved with proper filtering and population.
     */
    it("should retrieve all visits for patient successfully", async () => {
      // Create additional visit for the same patient
      const secondVisit = await Visit.create({
        patient: testPatient._id,
        type: "follow-up",
        date: new Date(),
      });

      // Act: Send GET request to retrieve all patient visits
      const response = await request(app)
        .get(`/api/visit/patient/${testPatient._id}`)
        .set("Authorization", `Bearer ${authTokens.accessToken}`)
        .expect(200);

      // Assert: Verify response structure and data
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Visits retrieved successfully"
      );
      expect(response.body.data).toHaveProperty("visits");

      const visits = response.body.data.visits;
      expect(Array.isArray(visits)).toBe(true);
      expect(visits).toHaveLength(2);

      // Verify both visits belong to the same patient
      visits.forEach((visit) => {
        expect(visit.patient).toBe(testPatient._id.toString());
      });

      // Verify different visit types are included
      const visitTypes = visits.map((visit) => visit.type);
      expect(visitTypes).toContain("consultation");
      expect(visitTypes).toContain("follow-up");
    });

    /**
     * Test Case: Handle visit not found
     *
     * This test ensures that appropriate error handling occurs
     * when trying to retrieve a non-existent visit.
     */
    it("should handle visit not found", async () => {
      // Arrange: Use non-existent visit ID
      const nonExistentVisitId = "507f1f77bcf86cd799439011";

      // Act: Send GET request with non-existent visit ID
      const response = await request(app)
        .get(`/api/visit/${nonExistentVisitId}`)
        .set("Authorization", `Bearer ${authTokens.accessToken}`)
        .expect(404);

      // Assert: Verify error response
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "VISIT_NOT_FOUND");
    });

    /**
     * Test Case: Require authentication for visit retrieval
     *
     * This test ensures that visit retrieval requires proper authentication
     * and fails when no auth token is provided.
     */
    it("should require authentication for visit retrieval", async () => {
      // Act: Send GET request without authentication
      const response = await request(app)
        .get(`/api/visit/${testVisit._id}`)
        .expect(401);

      // Assert: Verify unauthorized response
      expect(response.body).toHaveProperty("success", false);
    });
  });
});
