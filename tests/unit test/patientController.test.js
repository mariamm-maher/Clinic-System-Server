/**
 * Unit Tests for Patient Controller
 *
 * These tests verify that the patient management functions work correctly.
 * We test creating patients, retrieving patient data, and role-based access.
 *
 * Unit tests focus on testing controller logic without database integration.
 */

const Patient = require("../../models/patient");
const patientController = require("../../controllers/patientController");
const createError = require("../../util/createError");

// Mock external dependencies
jest.mock("../../util/sendSucess");
jest.mock("../../util/createError");
jest.mock("../../models/patient");

describe("Patient Controller Unit Tests", () => {
  describe("CreatePatientProfile Function", () => {
    /**
     * Test Case: Successfully create a new patient profile
     *
     * This test verifies that a patient profile can be created
     * with valid data and proper validation.
     */
    it("should create patient profile successfully with valid data", async () => {
      // Arrange: Set up test data
      const validPatientData = {
        generalInfo: {
          name: "John Doe",
          age: 35,
          gender: "male",
          phone: "1234567890",
          address: "123 Main St",
        },
        personalInfo: {
          occupation: "Engineer",
          maritalStatus: "married",
          children: 2,
          habits: ["non-smoker"],
        },
      };

      const req = {
        body: validPatientData,
      };

      const res = {};
      const next = jest.fn();

      // Mock successful patient save
      const mockPatient = {
        _id: "patient123",
        ...validPatientData,
        createdAt: new Date(),
      };

      Patient.prototype.save = jest.fn().mockResolvedValue(mockPatient);

      // Act: Call the create patient function
      await patientController.CreatePatientProfile(req, res, next);

      // Assert: Verify patient creation
      expect(Patient.prototype.save).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled(); // No errors should occur
    });

    /**
     * Test Case: Validation fails with invalid data
     *
     * This test ensures that patient creation is rejected when
     * required fields are missing or invalid.
     */
    it("should fail validation with missing required fields", async () => {
      // Arrange: Set up invalid test data (missing required fields)
      const invalidPatientData = {
        generalInfo: {
          name: "John Doe",
          // Missing gender and phone (required fields)
          address: "123 Main St",
        },
      };

      const req = {
        body: invalidPatientData,
      };

      const res = {};
      const next = jest.fn();

      // Act: Call the create patient function
      await patientController.CreatePatientProfile(req, res, next);

      // Assert: Verify validation error
      expect(next).toHaveBeenCalled();
      expect(createError).toHaveBeenCalledWith(
        "Validation Error",
        400,
        expect.objectContaining({
          code: "VALIDATION_FAILED",
        })
      );
    });

    /**
     * Test Case: Handle database errors during patient creation
     *
     * This test ensures that database errors are properly handled
     * and don't crash the application.
     */
    it("should handle database errors gracefully", async () => {
      // Arrange: Set up test data
      const validPatientData = {
        generalInfo: {
          name: "Jane Doe",
          age: 28,
          gender: "female",
          phone: "0987654321",
        },
      };

      const req = {
        body: validPatientData,
      };

      const res = {};
      const next = jest.fn();

      // Mock database error
      const dbError = new Error("Database connection failed");
      Patient.prototype.save = jest.fn().mockRejectedValue(dbError);

      // Act: Call the create patient function
      await patientController.CreatePatientProfile(req, res, next);

      // Assert: Verify error handling
      expect(next).toHaveBeenCalled();
      expect(createError).toHaveBeenCalledWith(
        "Failed to create patient profile",
        500,
        expect.objectContaining({
          code: "DATABASE_ERROR",
        })
      );
    });
  });

  describe("GetAllPatientsForStaff Function", () => {
    /**
     * Test Case: Successfully retrieve all patients for staff
     *
     * This test verifies that staff can retrieve a list of all patients
     * with appropriate data fields.
     */
    it("should return all patients for staff successfully", async () => {
      // Arrange: Set up test data
      const mockPatients = [
        {
          _id: "patient1",
          generalInfo: {
            name: "Patient One",
            age: 30,
            gender: "male",
            phone: "1111111111",
          },
          createdAt: new Date(),
        },
        {
          _id: "patient2",
          generalInfo: {
            name: "Patient Two",
            age: 25,
            gender: "female",
            phone: "2222222222",
          },
          createdAt: new Date(),
        },
      ];

      const req = {};
      const res = {};
      const next = jest.fn();

      // Mock Patient.find to return mock patients
      Patient.find = jest.fn().mockResolvedValue(mockPatients);

      // Act: Call the get all patients function
      await patientController.GetAllPatientsForStaff(req, res, next);

      // Assert: Verify patients retrieval
      expect(Patient.find).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled(); // No errors
    });

    /**
     * Test Case: Handle empty patient list
     *
     * This test ensures that the function handles the case where
     * no patients exist in the database.
     */
    it("should handle empty patient list gracefully", async () => {
      // Arrange: Set up empty data
      const req = {};
      const res = {};
      const next = jest.fn();

      // Mock Patient.find to return empty array
      Patient.find = jest.fn().mockResolvedValue([]);

      // Act: Call the get all patients function
      await patientController.GetAllPatientsForStaff(req, res, next);

      // Assert: Verify empty list handling
      expect(Patient.find).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled(); // No errors, empty list is valid
    });
  });

  describe("GetPatientByIdForStaff Function", () => {
    /**
     * Test Case: Successfully retrieve patient by ID
     *
     * This test verifies that a specific patient can be retrieved
     * by their ID with all necessary information.
     */
    it("should return patient by ID successfully", async () => {
      // Arrange: Set up test data
      const patientId = "patient123";
      const mockPatient = {
        _id: patientId,
        generalInfo: {
          name: "John Smith",
          age: 40,
          gender: "male",
          phone: "5555555555",
        },
        personalInfo: {
          occupation: "Teacher",
          maritalStatus: "single",
        },
        visits: [],
      };

      const req = {
        params: { patientId },
      };

      const res = {};
      const next = jest.fn();

      // Mock Patient.findById to return mock patient
      Patient.findById = jest.fn().mockResolvedValue(mockPatient);

      // Act: Call the get patient by ID function
      await patientController.GetPatientByIdForStaff(req, res, next);

      // Assert: Verify patient retrieval
      expect(Patient.findById).toHaveBeenCalledWith(patientId);
      expect(next).not.toHaveBeenCalled(); // No errors
    });

    /**
     * Test Case: Handle patient not found
     *
     * This test ensures that appropriate error handling occurs
     * when a patient with the given ID doesn't exist.
     */
    it("should handle patient not found error", async () => {
      // Arrange: Set up test data
      const nonExistentId = "nonexistent123";

      const req = {
        params: { patientId: nonExistentId },
      };

      const res = {};
      const next = jest.fn();

      // Mock Patient.findById to return null (not found)
      Patient.findById = jest.fn().mockResolvedValue(null);

      // Act: Call the get patient by ID function
      await patientController.GetPatientByIdForStaff(req, res, next);

      // Assert: Verify error handling
      expect(Patient.findById).toHaveBeenCalledWith(nonExistentId);
      expect(next).toHaveBeenCalled();
      expect(createError).toHaveBeenCalledWith(
        "Patient not found",
        404,
        expect.objectContaining({
          code: "PATIENT_NOT_FOUND",
        })
      );
    });

    /**
     * Test Case: Handle invalid patient ID format
     *
     * This test ensures that invalid MongoDB ObjectId formats
     * are handled gracefully.
     */
    it("should handle invalid patient ID format", async () => {
      // Arrange: Set up test data with invalid ID
      const invalidId = "invalid-id-format";

      const req = {
        params: { patientId: invalidId },
      };

      const res = {};
      const next = jest.fn();

      // Mock Patient.findById to throw error for invalid ID
      const invalidIdError = new Error("Cast to ObjectId failed");
      Patient.findById = jest.fn().mockRejectedValue(invalidIdError);

      // Act: Call the get patient by ID function
      await patientController.GetPatientByIdForStaff(req, res, next);

      // Assert: Verify error handling
      expect(next).toHaveBeenCalled();
      expect(createError).toHaveBeenCalledWith(
        "Invalid patient ID format",
        400,
        expect.objectContaining({
          code: "INVALID_ID_FORMAT",
        })
      );
    });
  });

  describe("GetPatientProfileForDoctor Function", () => {
    /**
     * Test Case: Doctor successfully retrieves patient profile with visits
     *
     * This test verifies that doctors can access detailed patient information
     * including medical history and visit records.
     */
    it("should return detailed patient profile for doctor", async () => {
      // Arrange: Set up test data
      const patientId = "patient123";
      const mockPatientWithVisits = {
        _id: patientId,
        generalInfo: {
          name: "Medical Patient",
          age: 45,
          gender: "female",
          phone: "7777777777",
        },
        personalInfo: {
          occupation: "Nurse",
          maritalStatus: "married",
          habits: ["non-smoker", "exercises regularly"],
        },
        visits: [
          {
            _id: "visit1",
            date: new Date(),
            type: "consultation",
            mainComplaint: {
              description: "Chest pain",
            },
          },
        ],
      };

      const req = {
        params: { patientId },
      };

      const res = {};
      const next = jest.fn();

      // Mock Patient.findById with population
      Patient.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockPatientWithVisits),
      });

      // Act: Call the get patient profile for doctor function
      await patientController.GetPatientProfileForDoctor(req, res, next);

      // Assert: Verify detailed profile retrieval
      expect(Patient.findById).toHaveBeenCalledWith(patientId);
      expect(next).not.toHaveBeenCalled(); // No errors
    });
  });

  // Clean up mocks after each test
  afterEach(() => {
    jest.clearAllMocks();
  });
});
