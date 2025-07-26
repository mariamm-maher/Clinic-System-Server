/**
 * Unit Tests for Booking Controller
 *
 * These tests verify that the booking management functions work correctly.
 * We test creating bookings, retrieving booking data, updating bookings,
 * and validation of booking information.
 *
 * Unit tests focus on testing controller logic in isolation.
 */

const Booking = require("../../models/booking");
const bookingController = require("../../controllers/BookingController");
const createError = require("../../util/createError");

// Mock external dependencies
jest.mock("../../util/sendSucess");
jest.mock("../../util/createError");
jest.mock("../../models/booking");

describe("Booking Controller Unit Tests", () => {
  describe("CreateBooking Function", () => {
    /**
     * Test Case: Successfully create a new booking
     *
     * This test verifies that a booking can be created with valid data
     * and proper validation passes.
     */
    it("should create booking successfully with valid data", async () => {
      // Arrange: Set up test data
      const validBookingData = {
        patientName: "John Doe",
        patientPhone: "1234567890",
        day: "Monday",
        time: "10:00 AM",
        createdFrom: "clinic",
        status: "pending",
        notes: "Regular checkup",
      };

      const req = {
        body: validBookingData,
        user: {
          id: "staff123",
          role: "staff",
        },
      };

      const res = {};
      const next = jest.fn();

      // Mock successful booking save
      const mockBooking = {
        _id: "booking123",
        ...validBookingData,
        createdBy: "staff123",
        createdAt: new Date(),
      };

      Booking.prototype.save = jest.fn().mockResolvedValue(mockBooking);

      // Act: Call the create booking function
      await bookingController.CreateBooking(req, res, next);

      // Assert: Verify booking creation
      expect(Booking.prototype.save).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled(); // No errors should occur
    });

    /**
     * Test Case: Validation fails with missing required fields
     *
     * This test ensures that booking creation is rejected when
     * required fields are missing or invalid.
     */
    it("should fail validation with missing required fields", async () => {
      // Arrange: Set up invalid test data (missing required fields)
      const invalidBookingData = {
        patientName: "John Doe",
        // Missing patientPhone, day, time, and createdFrom (required fields)
        notes: "Incomplete booking",
      };

      const req = {
        body: invalidBookingData,
        user: { id: "staff123", role: "staff" },
      };

      const res = {};
      const next = jest.fn();

      // Act: Call the create booking function
      await bookingController.CreateBooking(req, res, next);

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
     * Test Case: Validate booking status enum
     *
     * This test ensures that only valid status values are accepted.
     */
    it("should validate booking status enum values", async () => {
      // Arrange: Set up test data with invalid status
      const invalidStatusData = {
        patientName: "Jane Doe",
        patientPhone: "0987654321",
        day: "Tuesday",
        time: "2:00 PM",
        createdFrom: "phone",
        status: "invalid_status", // Invalid status
        notes: "Test booking",
      };

      const req = {
        body: invalidStatusData,
        user: { id: "staff123", role: "staff" },
      };

      const res = {};
      const next = jest.fn();

      // Act: Call the create booking function
      await bookingController.CreateBooking(req, res, next);

      // Assert: Verify validation error for invalid status
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
     * Test Case: Validate createdFrom enum
     *
     * This test ensures that only valid createdFrom values are accepted.
     */
    it("should validate createdFrom enum values", async () => {
      // Arrange: Set up test data with invalid createdFrom
      const invalidCreatedFromData = {
        patientName: "Test Patient",
        patientPhone: "1111111111",
        day: "Wednesday",
        time: "3:00 PM",
        createdFrom: "invalid_source", // Invalid source
        status: "pending",
      };

      const req = {
        body: invalidCreatedFromData,
        user: { id: "staff123", role: "staff" },
      };

      const res = {};
      const next = jest.fn();

      // Act: Call the create booking function
      await bookingController.CreateBooking(req, res, next);

      // Assert: Verify validation error for invalid createdFrom
      expect(next).toHaveBeenCalled();
      expect(createError).toHaveBeenCalledWith(
        "Validation Error",
        400,
        expect.objectContaining({
          code: "VALIDATION_FAILED",
        })
      );
    });
  });

  describe("GetAllBookings Function", () => {
    /**
     * Test Case: Successfully retrieve all bookings
     *
     * This test verifies that all bookings can be retrieved
     * with appropriate data fields.
     */
    it("should return all bookings successfully", async () => {
      // Arrange: Set up test data
      const mockBookings = [
        {
          _id: "booking1",
          patientName: "Patient One",
          patientPhone: "1111111111",
          day: "Monday",
          time: "9:00 AM",
          status: "confirmed",
          createdFrom: "clinic",
        },
        {
          _id: "booking2",
          patientName: "Patient Two",
          patientPhone: "2222222222",
          day: "Tuesday",
          time: "10:00 AM",
          status: "pending",
          createdFrom: "phone",
        },
      ];

      const req = {};
      const res = {};
      const next = jest.fn();

      // Mock Booking.find to return mock bookings
      Booking.find = jest.fn().mockResolvedValue(mockBookings);

      // Act: Call the get all bookings function
      await bookingController.GetAllBookings(req, res, next);

      // Assert: Verify bookings retrieval
      expect(Booking.find).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled(); // No errors
    });

    /**
     * Test Case: Handle empty booking list
     *
     * This test ensures that the function handles the case where
     * no bookings exist in the database.
     */
    it("should handle empty booking list gracefully", async () => {
      // Arrange: Set up empty data
      const req = {};
      const res = {};
      const next = jest.fn();

      // Mock Booking.find to return empty array
      Booking.find = jest.fn().mockResolvedValue([]);

      // Act: Call the get all bookings function
      await bookingController.GetAllBookings(req, res, next);

      // Assert: Verify empty list handling
      expect(Booking.find).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled(); // No errors, empty list is valid
    });
  });

  describe("GetBookingById Function", () => {
    /**
     * Test Case: Successfully retrieve booking by ID
     *
     * This test verifies that a specific booking can be retrieved
     * by its ID with all necessary information.
     */
    it("should return booking by ID successfully", async () => {
      // Arrange: Set up test data
      const bookingId = "booking123";
      const mockBooking = {
        _id: bookingId,
        patientName: "John Smith",
        patientPhone: "5555555555",
        day: "Friday",
        time: "11:00 AM",
        status: "confirmed",
        createdFrom: "website",
        notes: "Annual checkup",
      };

      const req = {
        params: { bookingId },
      };

      const res = {};
      const next = jest.fn();

      // Mock Booking.findById to return mock booking
      Booking.findById = jest.fn().mockResolvedValue(mockBooking);

      // Act: Call the get booking by ID function
      await bookingController.GetBookingById(req, res, next);

      // Assert: Verify booking retrieval
      expect(Booking.findById).toHaveBeenCalledWith(bookingId);
      expect(next).not.toHaveBeenCalled(); // No errors
    });

    /**
     * Test Case: Handle booking not found
     *
     * This test ensures that appropriate error handling occurs
     * when a booking with the given ID doesn't exist.
     */
    it("should handle booking not found error", async () => {
      // Arrange: Set up test data
      const nonExistentId = "nonexistent123";

      const req = {
        params: { bookingId: nonExistentId },
      };

      const res = {};
      const next = jest.fn();

      // Mock Booking.findById to return null (not found)
      Booking.findById = jest.fn().mockResolvedValue(null);

      // Act: Call the get booking by ID function
      await bookingController.GetBookingById(req, res, next);

      // Assert: Verify error handling
      expect(Booking.findById).toHaveBeenCalledWith(nonExistentId);
      expect(next).toHaveBeenCalled();
      expect(createError).toHaveBeenCalledWith(
        "Booking not found",
        404,
        expect.objectContaining({
          code: "BOOKING_NOT_FOUND",
        })
      );
    });
  });

  describe("UpdateBooking Function", () => {
    /**
     * Test Case: Successfully update booking
     *
     * This test verifies that booking information can be updated
     * with valid data and proper validation.
     */
    it("should update booking successfully with valid data", async () => {
      // Arrange: Set up test data
      const bookingId = "booking123";
      const updateData = {
        status: "confirmed",
        notes: "Updated booking notes",
        time: "2:00 PM",
      };

      const existingBooking = {
        _id: bookingId,
        patientName: "Existing Patient",
        patientPhone: "1234567890",
        day: "Monday",
        time: "10:00 AM",
        status: "pending",
        createdFrom: "clinic",
      };

      const updatedBooking = {
        ...existingBooking,
        ...updateData,
      };

      const req = {
        params: { bookingId },
        body: updateData,
      };

      const res = {};
      const next = jest.fn();

      // Mock Booking operations
      Booking.findById = jest.fn().mockResolvedValue(existingBooking);
      Booking.findByIdAndUpdate = jest.fn().mockResolvedValue(updatedBooking);

      // Act: Call the update booking function
      await bookingController.UpdateBooking(req, res, next);

      // Assert: Verify booking update
      expect(Booking.findById).toHaveBeenCalledWith(bookingId);
      expect(Booking.findByIdAndUpdate).toHaveBeenCalledWith(
        bookingId,
        updateData,
        expect.objectContaining({ new: true })
      );
      expect(next).not.toHaveBeenCalled(); // No errors
    });

    /**
     * Test Case: Handle update of non-existent booking
     *
     * This test ensures that updating a non-existent booking
     * returns appropriate error.
     */
    it("should handle update of non-existent booking", async () => {
      // Arrange: Set up test data
      const nonExistentId = "nonexistent123";
      const updateData = {
        status: "confirmed",
      };

      const req = {
        params: { bookingId: nonExistentId },
        body: updateData,
      };

      const res = {};
      const next = jest.fn();

      // Mock Booking.findById to return null (not found)
      Booking.findById = jest.fn().mockResolvedValue(null);

      // Act: Call the update booking function
      await bookingController.UpdateBooking(req, res, next);

      // Assert: Verify error handling
      expect(next).toHaveBeenCalled();
      expect(createError).toHaveBeenCalledWith(
        "Booking not found",
        404,
        expect.objectContaining({
          code: "BOOKING_NOT_FOUND",
        })
      );
    });

    /**
     * Test Case: Validate update data
     *
     * This test ensures that invalid update data is rejected.
     */
    it("should validate update data", async () => {
      // Arrange: Set up test data with invalid status
      const bookingId = "booking123";
      const invalidUpdateData = {
        status: "invalid_status", // Invalid status value
        notes: "Updated notes",
      };

      const existingBooking = {
        _id: bookingId,
        patientName: "Test Patient",
        status: "pending",
      };

      const req = {
        params: { bookingId },
        body: invalidUpdateData,
      };

      const res = {};
      const next = jest.fn();

      // Mock Booking.findById to return existing booking
      Booking.findById = jest.fn().mockResolvedValue(existingBooking);

      // Act: Call the update booking function
      await bookingController.UpdateBooking(req, res, next);

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
  });

  // Clean up mocks after each test
  afterEach(() => {
    jest.clearAllMocks();
  });
});
