/**
 * Integration Tests for Schedule Management Workflow
 *
 * These tests verify that the complete schedule management workflow works correctly
 * from end to end. We test the full HTTP request/response cycle including:
 * - Creating doctor schedules with day-specific availability
 * - Retrieving schedule data with complete information
 * - Updating day-specific schedule settings
 * - Deleting schedules with proper authorization
 *
 * Integration tests use a real test database and test the complete flow
 * including middleware, controllers, and database operations.
 */

const request = require("supertest");
const app = require("../../index");
const Schedule = require("../../models/Schedule");
const { generateTokens } = require("../setup");

describe("Schedule Management Integration Tests", () => {
  let doctorTokens;
  let staffTokens;
  let testSchedule;

  /**
   * Setup: Create test users before running tests
   *
   * This setup ensures we have authenticated users with different roles
   * required for schedule management tests.
   */
  beforeEach(async () => {
    // Create authenticated doctor user (required for schedule management)
    doctorTokens = await generateTokens({
      id: "doctor123",
      email: "doctor@clinic.com",
      role: "doctor",
    });

    // Create authenticated staff user (for testing authorization)
    staffTokens = await generateTokens({
      id: "staff123",
      email: "staff@clinic.com",
      role: "staff",
    });
  });

  /**
   * Cleanup: Remove test data after each test
   *
   * This ensures each test starts with a clean database state
   * and prevents test interference.
   */
  afterEach(async () => {
    await Schedule.deleteMany({});
  });

  describe("Schedule Creation Workflow", () => {
    /**
     * Test Case: Successfully create new schedule
     *
     * This test verifies that a doctor can create a new schedule
     * when no existing schedule exists.
     */
    it("should create new schedule successfully", async () => {
      // Act: Send POST request to create schedule
      const response = await request(app)
        .post("/api/schedule")
        .set("Authorization", `Bearer ${doctorTokens.accessToken}`)
        .expect(201);

      // Assert: Verify response structure
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Schedule created successfully"
      );
      expect(response.body.data).toHaveProperty("schedule");

      const schedule = response.body.data.schedule;
      expect(schedule).toHaveProperty("_id");

      // Verify schedule was saved to database
      const savedSchedule = await Schedule.findById(schedule._id);
      expect(savedSchedule).toBeTruthy();
    });

    /**
     * Test Case: Prevent duplicate schedule creation
     *
     * This test ensures that schedule creation fails when
     * a schedule already exists for the doctor.
     */
    it("should prevent duplicate schedule creation", async () => {
      // Arrange: Create existing schedule
      await Schedule.create({
        doctor: "doctor123",
        Sunday: { available: false },
        Monday: { available: true, startTime: "09:00", endTime: "17:00" },
      });

      // Act: Try to create another schedule
      const response = await request(app)
        .post("/api/schedule")
        .set("Authorization", `Bearer ${doctorTokens.accessToken}`)
        .expect(400);

      // Assert: Verify error response
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "SCHEDULE_EXISTS");
    });

    /**
     * Test Case: Require doctor role for schedule creation
     *
     * This test ensures that only users with doctor role can create schedules
     * and staff users are properly rejected.
     */
    it("should require doctor role for schedule creation", async () => {
      // Act: Try to create schedule with staff token
      const response = await request(app)
        .post("/api/schedule")
        .set("Authorization", `Bearer ${staffTokens.accessToken}`)
        .expect(403);

      // Assert: Verify forbidden response
      expect(response.body).toHaveProperty("success", false);
    });

    /**
     * Test Case: Require authentication for schedule creation
     *
     * This test ensures that schedule creation requires proper authentication
     * and fails when no auth token is provided.
     */
    it("should require authentication for schedule creation", async () => {
      // Act: Send POST request without authentication
      const response = await request(app).post("/api/schedule").expect(401);

      // Assert: Verify unauthorized response
      expect(response.body).toHaveProperty("success", false);
    });
  });

  describe("Schedule Retrieval Workflow", () => {
    /**
     * Setup: Create test schedule before retrieval tests
     */
    beforeEach(async () => {
      testSchedule = await Schedule.create({
        doctor: "doctor123",
        Sunday: {
          available: false,
        },
        Monday: {
          available: true,
          startTime: "09:00",
          endTime: "17:00",
          slots: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
        },
        Tuesday: {
          available: true,
          startTime: "10:00",
          endTime: "18:00",
          slots: ["10:00", "11:00", "12:00", "15:00", "16:00", "17:00"],
        },
        Wednesday: {
          available: true,
          startTime: "09:00",
          endTime: "17:00",
          slots: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
        },
        Thursday: {
          available: false,
        },
        Friday: {
          available: true,
          startTime: "08:00",
          endTime: "16:00",
          slots: ["08:00", "09:00", "10:00", "13:00", "14:00", "15:00"],
        },
        Saturday: {
          available: false,
        },
      });
    });

    /**
     * Test Case: Successfully retrieve schedule
     *
     * This test verifies that existing schedule can be retrieved
     * with complete day-specific information.
     */
    it("should retrieve schedule successfully", async () => {
      // Act: Send GET request to retrieve schedule
      const response = await request(app)
        .get("/api/schedule")
        .set("Authorization", `Bearer ${doctorTokens.accessToken}`)
        .expect(200);

      // Assert: Verify response structure
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Schedule retrieved successfully"
      );
      expect(response.body.data).toHaveProperty("schedule");

      const schedules = response.body.data.schedule;
      expect(Array.isArray(schedules)).toBe(true);
      expect(schedules).toHaveLength(1);

      const schedule = schedules[0];
      expect(schedule).toHaveProperty("_id", testSchedule._id.toString());

      // Verify day-specific schedule data
      expect(schedule).toHaveProperty("Sunday");
      expect(schedule.Sunday).toHaveProperty("available", false);

      expect(schedule).toHaveProperty("Monday");
      expect(schedule.Monday).toHaveProperty("available", true);
      expect(schedule.Monday).toHaveProperty("startTime", "09:00");
      expect(schedule.Monday).toHaveProperty("endTime", "17:00");
      expect(schedule.Monday).toHaveProperty("slots");
      expect(Array.isArray(schedule.Monday.slots)).toBe(true);
      expect(schedule.Monday.slots).toContain("09:00");
      expect(schedule.Monday.slots).toContain("16:00");

      expect(schedule).toHaveProperty("Friday");
      expect(schedule.Friday).toHaveProperty("available", true);
      expect(schedule.Friday).toHaveProperty("startTime", "08:00");
      expect(schedule.Friday).toHaveProperty("endTime", "16:00");
    });

    /**
     * Test Case: Handle no schedule found
     *
     * This test ensures that appropriate error handling occurs
     * when no schedule exists for retrieval.
     */
    it("should handle no schedule found", async () => {
      // Arrange: Remove the test schedule
      await Schedule.deleteMany({});

      // Act: Send GET request when no schedule exists
      const response = await request(app)
        .get("/api/schedule")
        .set("Authorization", `Bearer ${doctorTokens.accessToken}`)
        .expect(404);

      // Assert: Verify error response
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "SCHEDULE_NOT_FOUND");
    });

    /**
     * Test Case: Allow staff to view schedule
     *
     * This test verifies that staff members can view the schedule
     * (read-only access) for booking purposes.
     */
    it("should allow staff to view schedule", async () => {
      // Act: Send GET request with staff token
      const response = await request(app)
        .get("/api/schedule")
        .set("Authorization", `Bearer ${staffTokens.accessToken}`)
        .expect(200);

      // Assert: Verify staff can access schedule
      expect(response.body).toHaveProperty("success", true);
      expect(response.body.data).toHaveProperty("schedule");
    });
  });

  describe("Schedule Update Workflow", () => {
    /**
     * Setup: Create test schedule before update tests
     */
    beforeEach(async () => {
      testSchedule = await Schedule.create({
        doctor: "doctor123",
        Sunday: { available: false },
        Monday: {
          available: true,
          startTime: "09:00",
          endTime: "17:00",
          slots: ["09:00", "10:00", "11:00"],
        },
        Tuesday: { available: false },
        Wednesday: { available: false },
        Thursday: { available: false },
        Friday: { available: false },
        Saturday: { available: false },
      });
    });

    /**
     * Test Case: Successfully update schedule for specific day
     *
     * This test verifies that schedule can be updated for a specific day
     * with new availability, times, and slots.
     */
    it("should update schedule for specific day successfully", async () => {
      // Arrange: Set up update data for Tuesday
      const updateData = {
        available: true,
        startTime: "10:00",
        endTime: "18:00",
        slots: ["10:00", "11:00", "12:00", "15:00", "16:00", "17:00"],
      };

      // Act: Send PUT request to update Tuesday schedule
      const response = await request(app)
        .put("/api/schedule/Tuesday")
        .set("Authorization", `Bearer ${doctorTokens.accessToken}`)
        .send(updateData)
        .expect(200);

      // Assert: Verify response structure
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Schedule updated successfully"
      );
      expect(response.body.data).toHaveProperty("schedule");

      const schedule = response.body.data.schedule;
      expect(schedule).toHaveProperty("Tuesday");
      expect(schedule.Tuesday).toHaveProperty("available", true);
      expect(schedule.Tuesday).toHaveProperty("startTime", "10:00");
      expect(schedule.Tuesday).toHaveProperty("endTime", "18:00");
      expect(schedule.Tuesday).toHaveProperty("slots");
      expect(schedule.Tuesday.slots).toEqual([
        "10:00",
        "11:00",
        "12:00",
        "15:00",
        "16:00",
        "17:00",
      ]);

      // Verify changes were saved to database
      const updatedSchedule = await Schedule.findById(testSchedule._id);
      expect(updatedSchedule.Tuesday.available).toBe(true);
      expect(updatedSchedule.Tuesday.startTime).toBe("10:00");
      expect(updatedSchedule.Tuesday.endTime).toBe("18:00");
    });

    /**
     * Test Case: Update schedule to make day unavailable
     *
     * This test verifies that a day can be set to unavailable,
     * effectively removing availability for that day.
     */
    it("should update schedule to make day unavailable", async () => {
      // Arrange: Set up update data to make Monday unavailable
      const updateData = {
        available: false,
      };

      // Act: Send PUT request to make Monday unavailable
      const response = await request(app)
        .put("/api/schedule/Monday")
        .set("Authorization", `Bearer ${doctorTokens.accessToken}`)
        .send(updateData)
        .expect(200);

      // Assert: Verify response
      expect(response.body).toHaveProperty("success", true);
      const schedule = response.body.data.schedule;
      expect(schedule.Monday).toHaveProperty("available", false);

      // Verify in database
      const updatedSchedule = await Schedule.findById(testSchedule._id);
      expect(updatedSchedule.Monday.available).toBe(false);
    });

    /**
     * Test Case: Test all valid day names for updates
     *
     * This test verifies that all valid day names are accepted
     * for schedule updates.
     */
    it("should accept all valid day names for updates", async () => {
      // Arrange: Define all valid days and update data
      const validDays = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];

      const updateData = {
        available: true,
        startTime: "09:00",
        endTime: "17:00",
        slots: ["09:00", "10:00", "11:00"],
      };

      // Act & Assert: Test each valid day
      for (const day of validDays) {
        const response = await request(app)
          .put(`/api/schedule/${day}`)
          .set("Authorization", `Bearer ${doctorTokens.accessToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body).toHaveProperty("success", true);
        expect(response.body.data.schedule).toHaveProperty(day);
      }
    });

    /**
     * Test Case: Validate day name for updates
     *
     * This test ensures that schedule updates reject invalid day names
     * and provide appropriate error messages.
     */
    it("should validate day name for updates", async () => {
      // Arrange: Use invalid day name
      const invalidDay = "InvalidDay";
      const updateData = {
        available: true,
        startTime: "09:00",
        endTime: "17:00",
      };

      // Act: Send PUT request with invalid day
      const response = await request(app)
        .put(`/api/schedule/${invalidDay}`)
        .set("Authorization", `Bearer ${doctorTokens.accessToken}`)
        .send(updateData)
        .expect(400);

      // Assert: Verify validation error
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "INVALID_DAY");
    });

    /**
     * Test Case: Handle schedule not found during update
     *
     * This test ensures that appropriate error handling occurs
     * when trying to update a non-existent schedule.
     */
    it("should handle schedule not found during update", async () => {
      // Arrange: Remove the test schedule
      await Schedule.deleteMany({});

      const updateData = {
        available: true,
        startTime: "09:00",
        endTime: "17:00",
      };

      // Act: Try to update non-existent schedule
      const response = await request(app)
        .put("/api/schedule/Monday")
        .set("Authorization", `Bearer ${doctorTokens.accessToken}`)
        .send(updateData)
        .expect(404);

      // Assert: Verify error response
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "SCHEDULE_NOT_FOUND");
    });

    /**
     * Test Case: Require doctor role for schedule updates
     *
     * This test ensures that only doctors can update schedules
     * and staff users are properly rejected.
     */
    it("should require doctor role for schedule updates", async () => {
      // Arrange: Set up update data
      const updateData = {
        available: true,
        startTime: "09:00",
        endTime: "17:00",
      };

      // Act: Try to update schedule with staff token
      const response = await request(app)
        .put("/api/schedule/Monday")
        .set("Authorization", `Bearer ${staffTokens.accessToken}`)
        .send(updateData)
        .expect(403);

      // Assert: Verify forbidden response
      expect(response.body).toHaveProperty("success", false);
    });
  });

  describe("Schedule Deletion Workflow", () => {
    /**
     * Setup: Create test schedule before deletion tests
     */
    beforeEach(async () => {
      testSchedule = await Schedule.create({
        doctor: "doctor123",
        Monday: { available: true, startTime: "09:00", endTime: "17:00" },
        Tuesday: { available: true, startTime: "10:00", endTime: "18:00" },
      });
    });

    /**
     * Test Case: Successfully delete schedule
     *
     * This test verifies that existing schedule can be deleted
     * completely by a doctor.
     */
    it("should delete schedule successfully", async () => {
      // Act: Send DELETE request to remove schedule
      const response = await request(app)
        .delete("/api/schedule")
        .set("Authorization", `Bearer ${doctorTokens.accessToken}`)
        .expect(200);

      // Assert: Verify response structure
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Schedule deleted successfully"
      );
      expect(response.body.data).toHaveProperty("deletedCount", 1);

      // Verify schedule was removed from database
      const deletedSchedule = await Schedule.findById(testSchedule._id);
      expect(deletedSchedule).toBeNull();

      // Verify no schedules exist
      const allSchedules = await Schedule.find({});
      expect(allSchedules).toHaveLength(0);
    });

    /**
     * Test Case: Handle no schedule to delete
     *
     * This test ensures that appropriate error handling occurs
     * when trying to delete non-existent schedule.
     */
    it("should handle no schedule to delete", async () => {
      // Arrange: Remove the test schedule first
      await Schedule.deleteMany({});

      // Act: Try to delete non-existent schedule
      const response = await request(app)
        .delete("/api/schedule")
        .set("Authorization", `Bearer ${doctorTokens.accessToken}`)
        .expect(404);

      // Assert: Verify error response
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "SCHEDULE_NOT_FOUND");
    });

    /**
     * Test Case: Require doctor role for schedule deletion
     *
     * This test ensures that only doctors can delete schedules
     * and staff users are properly rejected.
     */
    it("should require doctor role for schedule deletion", async () => {
      // Act: Try to delete schedule with staff token
      const response = await request(app)
        .delete("/api/schedule")
        .set("Authorization", `Bearer ${staffTokens.accessToken}`)
        .expect(403);

      // Assert: Verify forbidden response
      expect(response.body).toHaveProperty("success", false);

      // Verify schedule still exists
      const existingSchedule = await Schedule.findById(testSchedule._id);
      expect(existingSchedule).toBeTruthy();
    });

    /**
     * Test Case: Require authentication for schedule deletion
     *
     * This test ensures that schedule deletion requires proper authentication
     * and fails when no auth token is provided.
     */
    it("should require authentication for schedule deletion", async () => {
      // Act: Send DELETE request without authentication
      const response = await request(app).delete("/api/schedule").expect(401);

      // Assert: Verify unauthorized response
      expect(response.body).toHaveProperty("success", false);

      // Verify schedule still exists
      const existingSchedule = await Schedule.findById(testSchedule._id);
      expect(existingSchedule).toBeTruthy();
    });
  });
});
