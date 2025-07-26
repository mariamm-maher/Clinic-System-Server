/**
 * Integration Tests for Booking Management Workflow
 *
 * These tests verify that the complete booking management workflow works correctly
 * from end to end. We test the full HTTP request/response cycle including:
 * - Creating bookings with validation
 * - Retrieving booking data with filtering
 * - Updating booking information and status
 * - Error handling for invalid requests
 *
 * Integration tests use a real test database and test the complete flow
 * including middleware, controllers, and database operations.
 */

const request = require("supertest");
const app = require("../../index");
const Booking = require("../../models/booking");
const { generateTokens } = require("../setup");

describe("Booking Management Integration Tests", () => {
  let authTokens;
  let testBooking;

  /**
   * Setup: Create test user before running tests
   *
   * This setup ensures we have authenticated users required for
   * booking management tests.
   */
  beforeEach(async () => {
    // Create authenticated test user (staff role for booking management)
    authTokens = await generateTokens({
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
    await Booking.deleteMany({});
  });

  describe("Booking Creation Workflow", () => {
    /**
     * Test Case: Successfully create a new booking
     *
     * This test verifies the complete workflow of creating a new booking
     * with proper validation and data persistence.
     */
    it("should create new booking successfully", async () => {
      // Arrange: Set up booking data
      const bookingData = {
        patientName: "John Smith",
        patientPhone: "1234567890",
        day: "Monday",
        time: "10:00",
        createdFrom: "clinic",
        status: "pending",
        notes: "Regular checkup appointment",
      };

      // Act: Send POST request to create booking
      const response = await request(app)
        .post("/api/booking")
        .set("Authorization", `Bearer ${authTokens.accessToken}`)
        .send(bookingData)
        .expect(201);

      // Assert: Verify response structure
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Booking created successfully"
      );
      expect(response.body.data).toHaveProperty("booking");

      const booking = response.body.data.booking;
      expect(booking).toHaveProperty("patientName", "John Smith");
      expect(booking).toHaveProperty("patientPhone", "1234567890");
      expect(booking).toHaveProperty("day", "Monday");
      expect(booking).toHaveProperty("time", "10:00");
      expect(booking).toHaveProperty("createdFrom", "clinic");
      expect(booking).toHaveProperty("status", "pending");
      expect(booking).toHaveProperty("notes", "Regular checkup appointment");

      // Verify booking was saved to database
      const savedBooking = await Booking.findById(booking._id);
      expect(savedBooking).toBeTruthy();
      expect(savedBooking.patientName).toBe("John Smith");
      expect(savedBooking.status).toBe("pending");
    });

    /**
     * Test Case: Create booking with minimal required fields
     *
     * This test verifies that booking can be created with only
     * the required fields, and optional fields get default values.
     */
    it("should create booking with minimal required fields", async () => {
      // Arrange: Set up minimal booking data
      const minimalBookingData = {
        patientName: "Jane Doe",
        patientPhone: "9876543210",
        day: "Tuesday",
        time: "14:30",
        createdFrom: "phone",
      };

      // Act: Send POST request with minimal data
      const response = await request(app)
        .post("/api/booking")
        .set("Authorization", `Bearer ${authTokens.accessToken}`)
        .send(minimalBookingData)
        .expect(201);

      // Assert: Verify response and default values
      expect(response.body).toHaveProperty("success", true);
      const booking = response.body.data.booking;
      expect(booking).toHaveProperty("patientName", "Jane Doe");
      expect(booking).toHaveProperty("status", "pending"); // Default status
      expect(booking).toHaveProperty("notes", ""); // Default empty notes
    });

    /**
     * Test Case: Validate required fields for booking creation
     *
     * This test ensures that booking creation validates required fields
     * and provides appropriate error messages for missing data.
     */
    it("should validate required fields for booking creation", async () => {
      // Arrange: Set up invalid booking data (missing required fields)
      const invalidBookingData = {
        patientName: "Test Patient",
        // Missing patientPhone, day, time, and createdFrom
        notes: "Incomplete booking data",
      };

      // Act: Send POST request with invalid data
      const response = await request(app)
        .post("/api/booking")
        .set("Authorization", `Bearer ${authTokens.accessToken}`)
        .send(invalidBookingData)
        .expect(400);

      // Assert: Verify validation error
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "VALIDATION_FAILED");
      expect(response.body.error).toHaveProperty("details");
      expect(Array.isArray(response.body.error.details)).toBe(true);
    });

    /**
     * Test Case: Validate enum values for booking fields
     *
     * This test ensures that booking creation validates enum values
     * for fields like status, createdFrom, and day.
     */
    it("should validate enum values for booking fields", async () => {
      // Arrange: Set up booking data with invalid enum values
      const invalidEnumData = {
        patientName: "Test Patient",
        patientPhone: "1111111111",
        day: "InvalidDay", // Invalid day
        time: "10:00",
        createdFrom: "invalid_source", // Invalid createdFrom
        status: "invalid_status", // Invalid status
      };

      // Act: Send POST request with invalid enum values
      const response = await request(app)
        .post("/api/booking")
        .set("Authorization", `Bearer ${authTokens.accessToken}`)
        .send(invalidEnumData)
        .expect(400);

      // Assert: Verify validation error for enum values
      expect(response.body).toHaveProperty("success", false);
      expect(response.body.error).toHaveProperty("code", "VALIDATION_FAILED");
      expect(
        response.body.error.details.some((detail) =>
          detail.includes("Day must be one of")
        )
      ).toBe(true);
    });

    /**
     * Test Case: Require authentication for booking creation
     *
     * This test ensures that booking creation requires proper authentication
     * and fails when no auth token is provided.
     */
    it("should require authentication for booking creation", async () => {
      // Arrange: Set up valid booking data
      const bookingData = {
        patientName: "Test Patient",
        patientPhone: "1234567890",
        day: "Wednesday",
        time: "15:00",
        createdFrom: "website",
      };

      // Act: Send POST request without authentication
      const response = await request(app)
        .post("/api/booking")
        .send(bookingData)
        .expect(401);

      // Assert: Verify unauthorized response
      expect(response.body).toHaveProperty("success", false);
    });
  });

  describe("Booking Retrieval Workflow", () => {
    /**
     * Setup: Create test bookings before retrieval tests
     */
    beforeEach(async () => {
      // Create multiple test bookings
      const bookings = [
        {
          patientName: "Patient One",
          patientPhone: "1111111111",
          day: "Monday",
          time: "09:00",
          createdFrom: "clinic",
          status: "confirmed",
          notes: "First appointment",
        },
        {
          patientName: "Patient Two",
          patientPhone: "2222222222",
          day: "Tuesday",
          time: "10:00",
          createdFrom: "phone",
          status: "pending",
          notes: "Follow-up appointment",
        },
        {
          patientName: "Patient Three",
          patientPhone: "3333333333",
          day: "Wednesday",
          time: "11:00",
          createdFrom: "website",
          status: "canceled",
          notes: "Canceled by patient",
        },
      ];

      await Booking.insertMany(bookings);

      // Save reference to first booking for individual tests
      testBooking = await Booking.findOne({ patientName: "Patient One" });
    });

    /**
     * Test Case: Successfully retrieve all bookings
     *
     * This test verifies that all bookings can be retrieved
     * with proper data structure and completeness.
     */
    it("should retrieve all bookings successfully", async () => {
      // Act: Send GET request to retrieve all bookings
      const response = await request(app)
        .get("/api/booking")
        .set("Authorization", `Bearer ${authTokens.accessToken}`)
        .expect(200);

      // Assert: Verify response structure
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Bookings fetched successfully"
      );
      expect(response.body.data).toHaveProperty("bookings");

      const bookings = response.body.data.bookings;
      expect(Array.isArray(bookings)).toBe(true);
      expect(bookings).toHaveLength(3);

      // Verify booking data structure
      bookings.forEach((booking) => {
        expect(booking).toHaveProperty("patientName");
        expect(booking).toHaveProperty("patientPhone");
        expect(booking).toHaveProperty("day");
        expect(booking).toHaveProperty("time");
        expect(booking).toHaveProperty("createdFrom");
        expect(booking).toHaveProperty("status");
        expect(booking).toHaveProperty("createdAt");
        expect(booking).toHaveProperty("updatedAt");
      });

      // Verify different statuses are included
      const statuses = bookings.map((booking) => booking.status);
      expect(statuses).toContain("confirmed");
      expect(statuses).toContain("pending");
      expect(statuses).toContain("canceled");
    });

    /**
     * Test Case: Successfully retrieve booking by ID
     *
     * This test verifies that a specific booking can be retrieved
     * by its ID with complete information.
     */
    it("should retrieve booking by ID successfully", async () => {
      // Act: Send GET request to retrieve specific booking
      const response = await request(app)
        .get(`/api/booking/${testBooking._id}`)
        .set("Authorization", `Bearer ${authTokens.accessToken}`)
        .expect(200);

      // Assert: Verify response structure and data
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Booking fetched successfully"
      );
      expect(response.body.data).toHaveProperty("booking");

      const booking = response.body.data.booking;
      expect(booking).toHaveProperty("_id", testBooking._id.toString());
      expect(booking).toHaveProperty("patientName", "Patient One");
      expect(booking).toHaveProperty("patientPhone", "1111111111");
      expect(booking).toHaveProperty("day", "Monday");
      expect(booking).toHaveProperty("time", "09:00");
      expect(booking).toHaveProperty("status", "confirmed");
    });

    /**
     * Test Case: Handle booking not found
     *
     * This test ensures that appropriate error handling occurs
     * when trying to retrieve a non-existent booking.
     */
    it("should handle booking not found", async () => {
      // Arrange: Use non-existent booking ID
      const nonExistentBookingId = "507f1f77bcf86cd799439011";

      // Act: Send GET request with non-existent booking ID
      const response = await request(app)
        .get(`/api/booking/${nonExistentBookingId}`)
        .set("Authorization", `Bearer ${authTokens.accessToken}`)
        .expect(404);

      // Assert: Verify error response
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "BOOKING_NOT_FOUND");
    });

    /**
     * Test Case: Require authentication for booking retrieval
     *
     * This test ensures that booking retrieval requires proper authentication
     * and fails when no auth token is provided.
     */
    it("should require authentication for booking retrieval", async () => {
      // Act: Send GET request without authentication
      const response = await request(app).get("/api/booking").expect(401);

      // Assert: Verify unauthorized response
      expect(response.body).toHaveProperty("success", false);
    });
  });

  describe("Booking Update Workflow", () => {
    /**
     * Setup: Create test booking before update tests
     */
    beforeEach(async () => {
      testBooking = await Booking.create({
        patientName: "Update Test Patient",
        patientPhone: "5555555555",
        day: "Thursday",
        time: "14:00",
        createdFrom: "clinic",
        status: "pending",
        notes: "Initial appointment",
      });
    });

    /**
     * Test Case: Successfully update booking information
     *
     * This test verifies that booking information can be updated
     * with proper validation and data persistence.
     */
    it("should update booking information successfully", async () => {
      // Arrange: Set up update data
      const updateData = {
        status: "confirmed",
        notes: "Updated: Patient confirmed attendance",
        time: "15:00",
      };

      // Act: Send PUT request to update booking
      const response = await request(app)
        .put(`/api/booking/${testBooking._id}`)
        .set("Authorization", `Bearer ${authTokens.accessToken}`)
        .send(updateData)
        .expect(200);

      // Assert: Verify response structure
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Booking updated successfully"
      );
      expect(response.body.data).toHaveProperty("booking");

      const updatedBooking = response.body.data.booking;
      expect(updatedBooking).toHaveProperty("status", "confirmed");
      expect(updatedBooking).toHaveProperty(
        "notes",
        "Updated: Patient confirmed attendance"
      );
      expect(updatedBooking).toHaveProperty("time", "15:00");

      // Verify changes were saved to database
      const dbBooking = await Booking.findById(testBooking._id);
      expect(dbBooking.status).toBe("confirmed");
      expect(dbBooking.notes).toBe("Updated: Patient confirmed attendance");
      expect(dbBooking.time).toBe("15:00");
    });

    /**
     * Test Case: Update booking status workflow
     *
     * This test verifies the common workflow of updating booking status
     * from pending to confirmed to done.
     */
    it("should support booking status workflow", async () => {
      // Step 1: Update to confirmed
      const confirmUpdate = { status: "confirmed" };

      let response = await request(app)
        .put(`/api/booking/${testBooking._id}`)
        .set("Authorization", `Bearer ${authTokens.accessToken}`)
        .send(confirmUpdate)
        .expect(200);

      expect(response.body.data.booking.status).toBe("confirmed");

      // Step 2: Update to done
      const doneUpdate = { status: "done" };

      response = await request(app)
        .put(`/api/booking/${testBooking._id}`)
        .set("Authorization", `Bearer ${authTokens.accessToken}`)
        .send(doneUpdate)
        .expect(200);

      expect(response.body.data.booking.status).toBe("done");

      // Verify final status in database
      const finalBooking = await Booking.findById(testBooking._id);
      expect(finalBooking.status).toBe("done");
    });

    /**
     * Test Case: Validate update data
     *
     * This test ensures that booking updates validate data
     * and reject invalid enum values.
     */
    it("should validate update data", async () => {
      // Arrange: Set up invalid update data
      const invalidUpdateData = {
        status: "invalid_status",
        day: "InvalidDay",
        createdFrom: "invalid_source",
      };

      // Act: Send PUT request with invalid data
      const response = await request(app)
        .put(`/api/booking/${testBooking._id}`)
        .set("Authorization", `Bearer ${authTokens.accessToken}`)
        .send(invalidUpdateData)
        .expect(400);

      // Assert: Verify validation error
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "VALIDATION_FAILED");
    });

    /**
     * Test Case: Handle update of non-existent booking
     *
     * This test ensures that appropriate error handling occurs
     * when trying to update a non-existent booking.
     */
    it("should handle update of non-existent booking", async () => {
      // Arrange: Use non-existent booking ID
      const nonExistentBookingId = "507f1f77bcf86cd799439011";
      const updateData = { status: "confirmed" };

      // Act: Send PUT request with non-existent booking ID
      const response = await request(app)
        .put(`/api/booking/${nonExistentBookingId}`)
        .set("Authorization", `Bearer ${authTokens.accessToken}`)
        .send(updateData)
        .expect(404);

      // Assert: Verify error response
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "BOOKING_NOT_FOUND");
    });

    /**
     * Test Case: Require at least one field for update
     *
     * This test ensures that booking updates require at least
     * one field to be updated.
     */
    it("should require at least one field for update", async () => {
      // Arrange: Send empty update data
      const emptyUpdateData = {};

      // Act: Send PUT request with empty data
      const response = await request(app)
        .put(`/api/booking/${testBooking._id}`)
        .set("Authorization", `Bearer ${authTokens.accessToken}`)
        .send(emptyUpdateData)
        .expect(400);

      // Assert: Verify validation error
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "VALIDATION_FAILED");
    });

    /**
     * Test Case: Require authentication for booking updates
     *
     * This test ensures that booking updates require proper authentication
     * and fail when no auth token is provided.
     */
    it("should require authentication for booking updates", async () => {
      // Arrange: Set up update data
      const updateData = { status: "confirmed" };

      // Act: Send PUT request without authentication
      const response = await request(app)
        .put(`/api/booking/${testBooking._id}`)
        .send(updateData)
        .expect(401);

      // Assert: Verify unauthorized response
      expect(response.body).toHaveProperty("success", false);
    });
  });
});
