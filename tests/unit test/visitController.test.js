/**
 * Unit Tests for Visit Controller
 *
 * These tests verify that the visit management functions work correctly.
 * We test creating visits, updating visit information (past history, main complaint,
 * checks, examination, investigations, prescription), and retrieving visit data.
 *
 * Unit tests focus on testing controller logic in isolation by mocking dependencies.
 */

const Visit = require("../../models/visit");
const Patient = require("../../models/patient");
const Checks = require("../../models/checks");
const Examination = require("../../models/examination");
const Investigation = require("../../models/investigation");
const Prescription = require("../../models/prescription");
const visitController = require("../../controllers/visitController");
const createError = require("../../util/createError");

// Mock external dependencies
jest.mock("../../util/sendSucess");
jest.mock("../../util/createError");
jest.mock("../../models/visit");
jest.mock("../../models/patient");
jest.mock("../../models/checks");
jest.mock("../../models/examination");
jest.mock("../../models/investigation");
jest.mock("../../models/prescription");

describe("Visit Controller Unit Tests", () => {
  describe("CreateVisit Function", () => {
    /**
     * Test Case: Successfully create a new visit
     *
     * This test verifies that a visit can be created for an existing patient
     * with valid data and proper validation.
     */
    it("should create visit successfully with valid data", async () => {
      // Arrange: Set up test data
      const patientId = "patient123";
      const visitType = "consultation";

      const req = {
        params: { patientId },
        body: { type: visitType },
      };

      const res = {};
      const next = jest.fn();

      // Mock existing patient
      const mockPatient = {
        _id: patientId,
        generalInfo: { name: "John Doe" },
        visits: [],
        save: jest.fn().mockResolvedValue(true),
      };

      // Mock new visit
      const mockVisit = {
        _id: "visit123",
        patient: patientId,
        type: visitType,
        save: jest.fn().mockResolvedValue(true),
      };

      Patient.findById = jest.fn().mockResolvedValue(mockPatient);
      Visit.mockImplementation(() => mockVisit);

      // Act: Call the create visit function
      await visitController.CreateVisit(req, res, next);

      // Assert: Verify visit creation
      expect(Patient.findById).toHaveBeenCalledWith(patientId);
      expect(mockVisit.save).toHaveBeenCalled();
      expect(mockPatient.visits).toContain(mockVisit._id);
      expect(mockPatient.save).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled(); // No errors
    });

    /**
     * Test Case: Fail when patient not found
     *
     * This test ensures that visit creation fails appropriately
     * when the specified patient doesn't exist.
     */
    it("should fail when patient not found", async () => {
      // Arrange: Set up test data
      const nonExistentPatientId = "nonexistent123";

      const req = {
        params: { patientId: nonExistentPatientId },
        body: { type: "consultation" },
      };

      const res = {};
      const next = jest.fn();

      // Mock patient not found
      Patient.findById = jest.fn().mockResolvedValue(null);

      // Act: Call the create visit function
      await visitController.CreateVisit(req, res, next);

      // Assert: Verify error handling
      expect(Patient.findById).toHaveBeenCalledWith(nonExistentPatientId);
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
     * Test Case: Validate required fields
     *
     * This test ensures that visit creation fails when
     * required fields are missing.
     */
    it("should validate required fields", async () => {
      // Arrange: Set up invalid test data (missing type)
      const req = {
        params: { patientId: "patient123" },
        body: {}, // Missing type field
      };

      const res = {};
      const next = jest.fn();

      // Act: Call the create visit function
      await visitController.CreateVisit(req, res, next);

      // Assert: Verify validation error
      expect(next).toHaveBeenCalled();
      expect(createError).toHaveBeenCalledWith(
        "Patient ID and visit type are required",
        400,
        expect.objectContaining({
          code: "MISSING_FIELDS",
        })
      );
    });
  });

  describe("UpdatePastHistory Function", () => {
    /**
     * Test Case: Successfully update past history
     *
     * This test verifies that visit past history can be updated
     * with valid data using dot notation for nested fields.
     */
    it("should update past history successfully", async () => {
      // Arrange: Set up test data
      const visitId = "visit123";
      const pastHistoryData = {
        medicalHistory: "Diabetes",
        surgicalHistory: "Appendectomy 2020",
        familyHistory: "Heart disease",
      };

      const req = {
        params: { visitId },
        body: { pastHistory: pastHistoryData },
      };

      const res = {};
      const next = jest.fn();

      // Mock updated visit
      const mockUpdatedVisit = {
        _id: visitId,
        pastHistory: pastHistoryData,
      };

      Visit.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUpdatedVisit);

      // Act: Call the update past history function
      await visitController.updatePastHistory(req, res, next);

      // Assert: Verify past history update
      expect(Visit.findByIdAndUpdate).toHaveBeenCalledWith(
        visitId,
        {
          $set: expect.objectContaining({
            "pastHistory.medicalHistory": "Diabetes",
            "pastHistory.surgicalHistory": "Appendectomy 2020",
            "pastHistory.familyHistory": "Heart disease",
          }),
        },
        { new: true }
      );
      expect(next).not.toHaveBeenCalled(); // No errors
    });

    /**
     * Test Case: Validate past history data
     *
     * This test ensures that update fails when no past history
     * data is provided.
     */
    it("should validate past history data is provided", async () => {
      // Arrange: Set up test data without past history
      const req = {
        params: { visitId: "visit123" },
        body: {}, // Missing pastHistory
      };

      const res = {};
      const next = jest.fn();

      // Act: Call the update past history function
      await visitController.updatePastHistory(req, res, next);

      // Assert: Verify validation error
      expect(next).toHaveBeenCalled();
      expect(createError).toHaveBeenCalledWith(
        "Past history data is required",
        400,
        expect.objectContaining({
          code: "MISSING_PAST_HISTORY_DATA",
        })
      );
    });
  });

  describe("UpdateMainComplaint Function", () => {
    /**
     * Test Case: Successfully update main complaint
     *
     * This test verifies that visit main complaint can be updated
     * with valid complaint data.
     */
    it("should update main complaint successfully", async () => {
      // Arrange: Set up test data
      const visitId = "visit123";
      const mainComplaintData = {
        chiefComplaint: "Chest pain",
        duration: "2 days",
        severity: "moderate",
      };

      const req = {
        params: { visitId },
        body: { mainComplaint: mainComplaintData },
      };

      const res = {};
      const next = jest.fn();

      // Mock updated visit
      const mockUpdatedVisit = {
        _id: visitId,
        mainComplaint: mainComplaintData,
      };

      Visit.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUpdatedVisit);

      // Act: Call the update main complaint function
      await visitController.updateMainComplaint(req, res, next);

      // Assert: Verify main complaint update
      expect(Visit.findByIdAndUpdate).toHaveBeenCalledWith(
        visitId,
        {
          $set: expect.objectContaining({
            "mainComplaint.chiefComplaint": "Chest pain",
            "mainComplaint.duration": "2 days",
            "mainComplaint.severity": "moderate",
          }),
        },
        { new: true }
      );
      expect(next).not.toHaveBeenCalled(); // No errors
    });
  });

  describe("UpdateChecks Function", () => {
    /**
     * Test Case: Successfully update checks for existing checks document
     *
     * This test verifies that visit checks can be updated when
     * the visit already has an associated checks document.
     */
    it("should update existing checks document successfully", async () => {
      // Arrange: Set up test data
      const visitId = "visit123";
      const checksData = {
        "vitalSigns.bloodPressure": "120/80",
        "vitalSigns.heartRate": "72",
        "vitalSigns.temperature": "98.6",
      };

      const req = {
        params: { visitId },
        body: { checks: checksData },
      };

      const res = {};
      const next = jest.fn();

      // Mock visit with existing checks
      const mockVisit = {
        _id: visitId,
        checks: "checks123",
        save: jest.fn().mockResolvedValue(true),
      };

      const mockUpdatedVisit = {
        _id: visitId,
        checks: {
          vitalSigns: {
            bloodPressure: "120/80",
            heartRate: "72",
            temperature: "98.6",
          },
        },
      };

      Visit.findById = jest.fn().mockResolvedValue(mockVisit);
      Visit.findById.mockReturnValueOnce(Promise.resolve(mockVisit));
      Checks.findByIdAndUpdate = jest.fn().mockResolvedValue(true);
      Visit.findById.mockReturnValueOnce(Promise.resolve(mockUpdatedVisit));

      // Act: Call the update checks function
      await visitController.updateChecks(req, res, next);

      // Assert: Verify checks update
      expect(Visit.findById).toHaveBeenCalledWith(visitId);
      expect(Checks.findByIdAndUpdate).toHaveBeenCalledWith(
        mockVisit.checks,
        { $set: checksData },
        { new: true, runValidators: true }
      );
      expect(next).not.toHaveBeenCalled(); // No errors
    });

    /**
     * Test Case: Create new checks document when none exists
     *
     * This test verifies that a new checks document is created
     * when the visit doesn't have associated checks yet.
     */
    it("should create new checks document when none exists", async () => {
      // Arrange: Set up test data
      const visitId = "visit123";
      const checksData = {
        "vitalSigns.bloodPressure": "130/85",
      };

      const req = {
        params: { visitId },
        body: { checks: checksData },
      };

      const res = {};
      const next = jest.fn();

      // Mock visit without checks
      const mockVisit = {
        _id: visitId,
        checks: null, // No existing checks
        save: jest.fn().mockResolvedValue(true),
      };

      const mockNewChecks = {
        _id: "newChecks123",
        save: jest.fn().mockResolvedValue(true),
      };

      Visit.findById = jest.fn().mockResolvedValue(mockVisit);
      Checks.mockImplementation(() => mockNewChecks);

      // Act: Call the update checks function
      await visitController.updateChecks(req, res, next);

      // Assert: Verify new checks creation
      expect(Visit.findById).toHaveBeenCalledWith(visitId);
      expect(mockNewChecks.save).toHaveBeenCalled();
      expect(mockVisit.checks).toBe(mockNewChecks._id);
      expect(mockVisit.save).toHaveBeenCalled();
    });
  });

  describe("GetVisitById Function", () => {
    /**
     * Test Case: Successfully retrieve visit by ID
     *
     * This test verifies that a specific visit can be retrieved
     * by its ID with all populated relationships.
     */
    it("should return visit by ID successfully", async () => {
      // Arrange: Set up test data
      const visitId = "visit123";

      const req = {
        params: { visitId },
      };

      const res = {};
      const next = jest.fn();

      // Mock populated visit
      const mockVisit = {
        _id: visitId,
        patient: "patient123",
        type: "consultation",
        checks: { vitalSigns: { bloodPressure: "120/80" } },
        examination: { findings: "Normal" },
        investigations: { bloodTest: "Ordered" },
        prescription: { medications: ["Aspirin"] },
      };

      // Mock the chained methods
      const mockPopulate = jest.fn().mockResolvedValue(mockVisit);
      Visit.findById = jest.fn().mockReturnValue({ populate: mockPopulate });

      // Act: Call the get visit by ID function
      await visitController.GetVisitById(req, res, next);

      // Assert: Verify visit retrieval
      expect(Visit.findById).toHaveBeenCalledWith(visitId);
      expect(mockPopulate).toHaveBeenCalledWith([
        "checks",
        "examination",
        "investigations",
        "prescription",
      ]);
      expect(next).not.toHaveBeenCalled(); // No errors
    });

    /**
     * Test Case: Handle visit not found
     *
     * This test ensures that appropriate error handling occurs
     * when a visit with the given ID doesn't exist.
     */
    it("should handle visit not found error", async () => {
      // Arrange: Set up test data
      const nonExistentId = "nonexistent123";

      const req = {
        params: { visitId: nonExistentId },
      };

      const res = {};
      const next = jest.fn();

      // Mock visit not found
      const mockPopulate = jest.fn().mockResolvedValue(null);
      Visit.findById = jest.fn().mockReturnValue({ populate: mockPopulate });

      // Act: Call the get visit by ID function
      await visitController.GetVisitById(req, res, next);

      // Assert: Verify error handling
      expect(Visit.findById).toHaveBeenCalledWith(nonExistentId);
      expect(next).toHaveBeenCalled();
      expect(createError).toHaveBeenCalledWith(
        "Visit not found",
        404,
        expect.objectContaining({
          code: "VISIT_NOT_FOUND",
        })
      );
    });

    /**
     * Test Case: Validate visit ID is provided
     *
     * This test ensures that the function validates that
     * a visit ID is provided in the request.
     */
    it("should validate visit ID is provided", async () => {
      // Arrange: Set up test data without visit ID
      const req = {
        params: {}, // Missing visitId
      };

      const res = {};
      const next = jest.fn();

      // Act: Call the get visit by ID function
      await visitController.GetVisitById(req, res, next);

      // Assert: Verify validation error
      expect(next).toHaveBeenCalled();
      expect(createError).toHaveBeenCalledWith(
        "Visit ID is required",
        400,
        expect.objectContaining({
          code: "MISSING_VISIT_ID",
        })
      );
    });
  });

  describe("GetAllVisitsOfPatient Function", () => {
    /**
     * Test Case: Successfully retrieve all visits for a patient
     *
     * This test verifies that all visits for a specific patient
     * can be retrieved with populated relationships.
     */
    it("should return all visits for patient successfully", async () => {
      // Arrange: Set up test data
      const patientId = "patient123";

      const req = {
        params: { patientId },
      };

      const res = {};
      const next = jest.fn();

      // Mock patient visits
      const mockVisits = [
        {
          _id: "visit1",
          patient: patientId,
          type: "consultation",
          date: new Date(),
        },
        {
          _id: "visit2",
          patient: patientId,
          type: "follow-up",
          date: new Date(),
        },
      ];

      // Mock the chained methods
      const mockPopulate = jest.fn().mockResolvedValue(mockVisits);
      Visit.find = jest.fn().mockReturnValue({ populate: mockPopulate });

      // Act: Call the get all visits function
      await visitController.GetAllVisitsOfPatient(req, res, next);

      // Assert: Verify visits retrieval
      expect(Visit.find).toHaveBeenCalledWith({ patient: patientId });
      expect(mockPopulate).toHaveBeenCalledWith([
        "checks",
        "examination",
        "investigations",
        "prescription",
      ]);
      expect(next).not.toHaveBeenCalled(); // No errors
    });

    /**
     * Test Case: Validate patient ID is provided
     *
     * This test ensures that the function validates that
     * a patient ID is provided in the request.
     */
    it("should validate patient ID is provided", async () => {
      // Arrange: Set up test data without patient ID
      const req = {
        params: {}, // Missing patientId
      };

      const res = {};
      const next = jest.fn();

      // Act: Call the get all visits function
      await visitController.GetAllVisitsOfPatient(req, res, next);

      // Assert: Verify validation error
      expect(next).toHaveBeenCalled();
      expect(createError).toHaveBeenCalledWith(
        "Patient ID is required",
        400,
        expect.objectContaining({
          code: "MISSING_PATIENT_ID",
        })
      );
    });
  });

  // Clean up mocks after each test
  afterEach(() => {
    jest.clearAllMocks();
  });
});
