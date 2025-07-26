/**
 * Unit Tests for Schedule Controller
 *
 * These tests verify that the schedule management functions work correctly.
 * We test getting schedules, adding new schedules, updating day-specific schedules,
 * and deleting schedules with proper validation and error handling.
 *
 * Unit tests focus on testing controller logic in isolation by mocking dependencies.
 */

const Schedule = require("../../models/Schedule");
const scheduleController = require("../../controllers/scheduleController");
const createError = require("../../util/createError");

// Mock external dependencies
jest.mock("../../util/sendSucess");
jest.mock("../../util/createError");
jest.mock("../../models/Schedule");

describe("Schedule Controller Unit Tests", () => {
  describe("GetSchedule Function", () => {
    /**
     * Test Case: Successfully retrieve schedule
     *
     * This test verifies that existing schedule data can be
     * retrieved successfully.
     */
    it("should return schedule successfully", async () => {
      // Arrange: Set up test data
      const req = {};
      const res = {};
      const next = jest.fn();

      // Mock schedule data
      const mockSchedule = [
        {
          _id: "schedule123",
          doctor: "doctor123",
          Sunday: { available: true, startTime: "09:00", endTime: "17:00" },
          Monday: { available: true, startTime: "09:00", endTime: "17:00" },
          Tuesday: { available: false },
        },
      ];

      Schedule.find = jest.fn().mockResolvedValue(mockSchedule);

      // Act: Call the get schedule function
      await scheduleController.GetSchedule(req, res, next);

      // Assert: Verify schedule retrieval
      expect(Schedule.find).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled(); // No errors
    });

    /**
     * Test Case: Handle no schedule found
     *
     * This test ensures that appropriate error handling occurs
     * when no schedule data exists.
     */
    it("should handle no schedule found", async () => {
      // Arrange: Set up test data
      const req = {};
      const res = {};
      const next = jest.fn();

      // Mock empty schedule
      Schedule.find = jest.fn().mockResolvedValue([]);

      // Act: Call the get schedule function
      await scheduleController.GetSchedule(req, res, next);

      // Assert: Verify error handling
      expect(Schedule.find).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
      expect(createError).toHaveBeenCalledWith(
        "No schedule found",
        404,
        expect.objectContaining({
          code: "SCHEDULE_NOT_FOUND",
        })
      );
    });

    /**
     * Test Case: Handle database error
     *
     * This test ensures that database errors are handled
     * appropriately during schedule retrieval.
     */
    it("should handle database error during retrieval", async () => {
      // Arrange: Set up test data
      const req = {};
      const res = {};
      const next = jest.fn();

      // Mock database error
      const dbError = new Error("Database connection failed");
      Schedule.find = jest.fn().mockRejectedValue(dbError);

      // Act: Call the get schedule function
      await scheduleController.GetSchedule(req, res, next);

      // Assert: Verify error handling
      expect(Schedule.find).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
      expect(createError).toHaveBeenCalledWith(
        "Failed to retrieve schedule",
        500,
        expect.objectContaining({
          code: "SCHEDULE_RETRIEVAL_ERROR",
        })
      );
    });
  });

  describe("AddSchedule Function", () => {
    /**
     * Test Case: Successfully create new schedule
     *
     * This test verifies that a new schedule can be created
     * when no existing schedule exists.
     */
    it("should create new schedule successfully", async () => {
      // Arrange: Set up test data
      const req = {};
      const res = {};
      const next = jest.fn();

      // Mock no existing schedule
      Schedule.find = jest.fn().mockResolvedValue([]);

      // Mock new schedule creation
      const mockNewSchedule = {
        _id: "newSchedule123",
        doctor: "doctor123",
        save: jest.fn().mockResolvedValue(true),
      };

      Schedule.mockImplementation(() => mockNewSchedule);

      // Act: Call the add schedule function
      await scheduleController.AddSchedule(req, res, next);

      // Assert: Verify schedule creation
      expect(Schedule.find).toHaveBeenCalled();
      expect(mockNewSchedule.save).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled(); // No errors
    });

    /**
     * Test Case: Prevent duplicate schedule creation
     *
     * This test ensures that schedule creation fails when
     * a schedule already exists.
     */
    it("should prevent duplicate schedule creation", async () => {
      // Arrange: Set up test data
      const req = {};
      const res = {};
      const next = jest.fn();

      // Mock existing schedule
      const existingSchedule = [
        { _id: "existingSchedule123", doctor: "doctor123" },
      ];

      Schedule.find = jest.fn().mockResolvedValue(existingSchedule);

      // Act: Call the add schedule function
      await scheduleController.AddSchedule(req, res, next);

      // Assert: Verify error handling
      expect(Schedule.find).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
      expect(createError).toHaveBeenCalledWith(
        "Schedule already exists",
        400,
        expect.objectContaining({
          code: "SCHEDULE_EXISTS",
        })
      );
    });
  });

  describe("UpdateSchedule Function", () => {
    /**
     * Test Case: Successfully update schedule for valid day
     *
     * This test verifies that schedule can be updated for
     * a specific day with valid data.
     */
    it("should update schedule for valid day successfully", async () => {
      // Arrange: Set up test data
      const validDay = "Monday";
      const updateData = {
        available: true,
        startTime: "10:00",
        endTime: "18:00",
        slots: ["10:00", "11:00", "12:00"],
      };

      const req = {
        params: { day: validDay },
        body: updateData,
      };

      const res = {};
      const next = jest.fn();

      // Mock updated schedule
      const mockUpdatedSchedule = {
        _id: "schedule123",
        [validDay]: updateData,
      };

      Schedule.findOneAndUpdate = jest
        .fn()
        .mockResolvedValue(mockUpdatedSchedule);

      // Act: Call the update schedule function
      await scheduleController.UpdateSchedule(req, res, next);

      // Assert: Verify schedule update
      expect(Schedule.findOneAndUpdate).toHaveBeenCalledWith(
        {},
        { [validDay]: updateData },
        { new: true, runValidators: true }
      );
      expect(next).not.toHaveBeenCalled(); // No errors
    });

    /**
     * Test Case: Validate day name
     *
     * This test ensures that schedule update fails when
     * an invalid day name is provided.
     */
    it("should validate day name", async () => {
      // Arrange: Set up test data with invalid day
      const invalidDay = "InvalidDay";
      const updateData = {
        available: true,
        startTime: "09:00",
        endTime: "17:00",
      };

      const req = {
        params: { day: invalidDay },
        body: updateData,
      };

      const res = {};
      const next = jest.fn();

      // Act: Call the update schedule function
      await scheduleController.UpdateSchedule(req, res, next);

      // Assert: Verify validation error
      expect(next).toHaveBeenCalled();
      expect(createError).toHaveBeenCalledWith(
        "Invalid day name",
        400,
        expect.objectContaining({
          code: "INVALID_DAY",
        })
      );
    });

    /**
     * Test Case: Handle schedule not found during update
     *
     * This test ensures that appropriate error handling occurs
     * when trying to update a non-existent schedule.
     */
    it("should handle schedule not found during update", async () => {
      // Arrange: Set up test data
      const validDay = "Tuesday";
      const updateData = {
        available: false,
      };

      const req = {
        params: { day: validDay },
        body: updateData,
      };

      const res = {};
      const next = jest.fn();

      // Mock schedule not found
      Schedule.findOneAndUpdate = jest.fn().mockResolvedValue(null);

      // Act: Call the update schedule function
      await scheduleController.UpdateSchedule(req, res, next);

      // Assert: Verify error handling
      expect(Schedule.findOneAndUpdate).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
      expect(createError).toHaveBeenCalledWith(
        "Schedule not found",
        404,
        expect.objectContaining({
          code: "SCHEDULE_NOT_FOUND",
        })
      );
    });

    /**
     * Test Case: Test all valid day names
     *
     * This test verifies that all valid day names are accepted
     * for schedule updates.
     */
    it("should accept all valid day names", async () => {
      // Arrange: Set up test data for all valid days
      const validDays = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];

      const updateData = { available: true };
      const mockUpdatedSchedule = { _id: "schedule123" };

      Schedule.findOneAndUpdate = jest
        .fn()
        .mockResolvedValue(mockUpdatedSchedule);

      // Act & Assert: Test each valid day
      for (const day of validDays) {
        const req = {
          params: { day },
          body: updateData,
        };

        const res = {};
        const next = jest.fn();

        await scheduleController.UpdateSchedule(req, res, next);

        // Verify no validation error for valid days
        expect(next).not.toHaveBeenCalled();
      }
    });
  });

  describe("DropSchedule Function", () => {
    /**
     * Test Case: Successfully delete schedule
     *
     * This test verifies that existing schedule can be
     * deleted successfully.
     */
    it("should delete schedule successfully", async () => {
      // Arrange: Set up test data
      const req = {};
      const res = {};
      const next = jest.fn();

      // Mock successful deletion
      const deleteResult = {
        deletedCount: 1,
      };

      Schedule.deleteMany = jest.fn().mockResolvedValue(deleteResult);

      // Act: Call the drop schedule function
      await scheduleController.DropSchedule(req, res, next);

      // Assert: Verify schedule deletion
      expect(Schedule.deleteMany).toHaveBeenCalledWith({});
      expect(next).not.toHaveBeenCalled(); // No errors
    });

    /**
     * Test Case: Handle no schedule to delete
     *
     * This test ensures that appropriate error handling occurs
     * when trying to delete non-existent schedule.
     */
    it("should handle no schedule to delete", async () => {
      // Arrange: Set up test data
      const req = {};
      const res = {};
      const next = jest.fn();

      // Mock no documents to delete
      const deleteResult = {
        deletedCount: 0,
      };

      Schedule.deleteMany = jest.fn().mockResolvedValue(deleteResult);

      // Act: Call the drop schedule function
      await scheduleController.DropSchedule(req, res, next);

      // Assert: Verify error handling
      expect(Schedule.deleteMany).toHaveBeenCalledWith({});
      expect(next).toHaveBeenCalled();
      expect(createError).toHaveBeenCalledWith(
        "No schedule found to delete",
        404,
        expect.objectContaining({
          code: "SCHEDULE_NOT_FOUND",
        })
      );
    });

    /**
     * Test Case: Handle database error during deletion
     *
     * This test ensures that database errors are handled
     * appropriately during schedule deletion.
     */
    it("should handle database error during deletion", async () => {
      // Arrange: Set up test data
      const req = {};
      const res = {};
      const next = jest.fn();

      // Mock database error
      const dbError = new Error("Database error during deletion");
      Schedule.deleteMany = jest.fn().mockRejectedValue(dbError);

      // Act: Call the drop schedule function
      await scheduleController.DropSchedule(req, res, next);

      // Assert: Verify error handling
      expect(Schedule.deleteMany).toHaveBeenCalledWith({});
      expect(next).toHaveBeenCalled();
      expect(createError).toHaveBeenCalledWith(
        "Failed to delete schedule",
        500,
        expect.objectContaining({
          code: "SCHEDULE_DELETION_ERROR",
        })
      );
    });
  });

  // Clean up mocks after each test
  afterEach(() => {
    jest.clearAllMocks();
  });
});
