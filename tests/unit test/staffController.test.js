/**
 * Unit Tests for Staff Controller
 *
 * These tests verify that the staff management functions work correctly.
 * We test creating staff users, retrieving staff data, deleting staff users,
 * and validation of staff information with proper authorization.
 *
 * Unit tests focus on testing controller logic in isolation by mocking dependencies.
 */

const User = require("../../models/User");
const bcrypt = require("bcryptjs");
const staffController = require("../../controllers/staff");
const createError = require("../../util/createError");

// Mock external dependencies
jest.mock("../../util/sendSucess");
jest.mock("../../util/createError");
jest.mock("../../models/User");
jest.mock("bcryptjs");

describe("Staff Controller Unit Tests", () => {
  describe("CreateStaffUser Function", () => {
    /**
     * Test Case: Successfully create new staff user
     *
     * This test verifies that a new staff user can be created
     * with valid data and proper validation.
     */
    it("should create staff user successfully with valid data", async () => {
      // Arrange: Set up test data
      const validStaffData = {
        name: "Jane Smith",
        email: "jane.smith@clinic.com",
        password: "securePassword123",
      };

      const req = {
        body: validStaffData,
      };

      const res = {};
      const next = jest.fn();

      // Mock validation success (no existing user)
      User.findOne = jest.fn().mockResolvedValue(null);

      // Mock password hashing
      const hashedPassword = "hashedPassword123";
      bcrypt.hash = jest.fn().mockResolvedValue(hashedPassword);

      // Mock new user creation
      const mockStaffUser = {
        _id: "staff123",
        name: validStaffData.name,
        email: validStaffData.email,
        password: hashedPassword,
        role: "staff",
        save: jest.fn().mockResolvedValue(true),
      };

      User.mockImplementation(() => mockStaffUser);

      // Act: Call the create staff user function
      await staffController.createStaffUser(req, res, next);

      // Assert: Verify staff user creation
      expect(User.findOne).toHaveBeenCalledWith({
        email: validStaffData.email,
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(validStaffData.password, 10);
      expect(mockStaffUser.save).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled(); // No errors
    });

    /**
     * Test Case: Prevent duplicate email registration
     *
     * This test ensures that staff creation fails when
     * a user with the same email already exists.
     */
    it("should prevent duplicate email registration", async () => {
      // Arrange: Set up test data with existing email
      const duplicateEmailData = {
        name: "John Doe",
        email: "existing@clinic.com",
        password: "password123",
      };

      const req = {
        body: duplicateEmailData,
      };

      const res = {};
      const next = jest.fn();

      // Mock existing user found
      const existingUser = {
        _id: "existingUser123",
        email: duplicateEmailData.email,
      };

      User.findOne = jest.fn().mockResolvedValue(existingUser);

      // Act: Call the create staff user function
      await staffController.createStaffUser(req, res, next);

      // Assert: Verify error handling
      expect(User.findOne).toHaveBeenCalledWith({
        email: duplicateEmailData.email,
      });
      expect(next).toHaveBeenCalled();
      expect(createError).toHaveBeenCalledWith(
        "User already exists",
        400,
        expect.objectContaining({
          code: "USER_EXISTS",
        })
      );
    });

    /**
     * Test Case: Validate required fields
     *
     * This test ensures that staff creation fails when
     * required fields are missing or invalid.
     */
    it("should validate required fields", async () => {
      // Arrange: Set up invalid test data (missing required fields)
      const invalidStaffData = {
        name: "Staff Member",
        // Missing email and password
      };

      const req = {
        body: invalidStaffData,
      };

      const res = {};
      const next = jest.fn();

      // Act: Call the create staff user function
      await staffController.createStaffUser(req, res, next);

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
     * Test Case: Handle database error during creation
     *
     * This test ensures that database errors are handled
     * appropriately during staff user creation.
     */
    it("should handle database error during creation", async () => {
      // Arrange: Set up test data
      const validStaffData = {
        name: "Test Staff",
        email: "test@clinic.com",
        password: "password123",
      };

      const req = {
        body: validStaffData,
      };

      const res = {};
      const next = jest.fn();

      // Mock database error
      const dbError = new Error("Database connection failed");
      User.findOne = jest.fn().mockRejectedValue(dbError);

      // Act: Call the create staff user function
      await staffController.createStaffUser(req, res, next);

      // Assert: Verify error handling
      expect(next).toHaveBeenCalled();
      expect(createError).toHaveBeenCalledWith(
        "Failed to create staff user",
        500,
        expect.objectContaining({
          code: "STAFF_CREATION_ERROR",
        })
      );
    });
  });

  describe("GetAllStaff Function", () => {
    /**
     * Test Case: Successfully retrieve all staff users
     *
     * This test verifies that all staff users can be retrieved
     * with appropriate data fields (excluding passwords).
     */
    it("should return all staff users successfully", async () => {
      // Arrange: Set up test data
      const req = {};
      const res = {};
      const next = jest.fn();

      // Mock staff users
      const mockStaffUsers = [
        {
          _id: "staff1",
          name: "Staff One",
          email: "staff1@clinic.com",
          role: "staff",
          createdAt: new Date(),
        },
        {
          _id: "staff2",
          name: "Staff Two",
          email: "staff2@clinic.com",
          role: "staff",
          createdAt: new Date(),
        },
      ];

      // Mock the chained methods
      const mockSelect = jest.fn().mockResolvedValue(mockStaffUsers);
      User.find = jest.fn().mockReturnValue({ select: mockSelect });

      // Act: Call the get all staff function
      await staffController.getAllStaff(req, res, next);

      // Assert: Verify staff users retrieval
      expect(User.find).toHaveBeenCalledWith({ role: "staff" });
      expect(mockSelect).toHaveBeenCalledWith("-password");
      expect(next).not.toHaveBeenCalled(); // No errors
    });

    /**
     * Test Case: Handle database error during retrieval
     *
     * This test ensures that database errors are handled
     * appropriately during staff users retrieval.
     */
    it("should handle database error during retrieval", async () => {
      // Arrange: Set up test data
      const req = {};
      const res = {};
      const next = jest.fn();

      // Mock database error
      const dbError = new Error("Database connection failed");
      const mockSelect = jest.fn().mockRejectedValue(dbError);
      User.find = jest.fn().mockReturnValue({ select: mockSelect });

      // Act: Call the get all staff function
      await staffController.getAllStaff(req, res, next);

      // Assert: Verify error handling
      expect(next).toHaveBeenCalled();
      expect(createError).toHaveBeenCalledWith(
        "Failed to retrieve staff users",
        500,
        expect.objectContaining({
          code: "STAFF_RETRIEVAL_ERROR",
        })
      );
    });
  });

  describe("GetStaffById Function", () => {
    /**
     * Test Case: Successfully retrieve staff user by ID
     *
     * This test verifies that a specific staff user can be retrieved
     * by their ID with all necessary information.
     */
    it("should return staff user by ID successfully", async () => {
      // Arrange: Set up test data
      const staffId = "staff123";

      const req = {
        params: { userId: staffId },
      };

      const res = {};
      const next = jest.fn();

      // Mock staff user
      const mockStaffUser = {
        _id: staffId,
        name: "John Staff",
        email: "john.staff@clinic.com",
        role: "staff",
        createdAt: new Date(),
      };

      // Mock the chained methods
      const mockSelect = jest.fn().mockResolvedValue(mockStaffUser);
      User.findOne = jest.fn().mockReturnValue({ select: mockSelect });

      // Act: Call the get staff by ID function
      await staffController.getStaffById(req, res, next);

      // Assert: Verify staff user retrieval
      expect(User.findOne).toHaveBeenCalledWith({
        _id: staffId,
        role: "staff",
      });
      expect(mockSelect).toHaveBeenCalledWith("-password");
      expect(next).not.toHaveBeenCalled(); // No errors
    });

    /**
     * Test Case: Handle staff user not found
     *
     * This test ensures that appropriate error handling occurs
     * when a staff user with the given ID doesn't exist.
     */
    it("should handle staff user not found", async () => {
      // Arrange: Set up test data
      const nonExistentId = "nonexistent123";

      const req = {
        params: { userId: nonExistentId },
      };

      const res = {};
      const next = jest.fn();

      // Mock staff user not found
      const mockSelect = jest.fn().mockResolvedValue(null);
      User.findOne = jest.fn().mockReturnValue({ select: mockSelect });

      // Act: Call the get staff by ID function
      await staffController.getStaffById(req, res, next);

      // Assert: Verify error handling
      expect(User.findOne).toHaveBeenCalledWith({
        _id: nonExistentId,
        role: "staff",
      });
      expect(next).toHaveBeenCalled();
      expect(createError).toHaveBeenCalledWith(
        "Staff user not found",
        404,
        expect.objectContaining({
          code: "STAFF_NOT_FOUND",
        })
      );
    });

    /**
     * Test Case: Validate user ID is provided
     *
     * This test ensures that the function validates that
     * a user ID is provided in the request.
     */
    it("should validate user ID is provided", async () => {
      // Arrange: Set up test data without user ID
      const req = {
        params: {}, // Missing userId
      };

      const res = {};
      const next = jest.fn();

      // Act: Call the get staff by ID function
      await staffController.getStaffById(req, res, next);

      // Assert: Verify validation error
      expect(next).toHaveBeenCalled();
      expect(createError).toHaveBeenCalledWith(
        "User ID is required",
        400,
        expect.objectContaining({
          code: "MISSING_USER_ID",
        })
      );
    });
  });

  describe("DeleteUser Function", () => {
    /**
     * Test Case: Successfully delete staff user
     *
     * This test verifies that a staff user can be deleted
     * successfully by their ID.
     */
    it("should delete staff user successfully", async () => {
      // Arrange: Set up test data
      const staffId = "staff123";

      const req = {
        params: { userId: staffId },
      };

      const res = {};
      const next = jest.fn();

      // Mock successful deletion
      const deletedUser = {
        _id: staffId,
        name: "Deleted Staff",
        email: "deleted@clinic.com",
      };

      User.findByIdAndDelete = jest.fn().mockResolvedValue(deletedUser);

      // Act: Call the delete user function
      await staffController.deleteUser(req, res, next);

      // Assert: Verify user deletion
      expect(User.findByIdAndDelete).toHaveBeenCalledWith(staffId);
      expect(next).not.toHaveBeenCalled(); // No errors
    });

    /**
     * Test Case: Handle user not found during deletion
     *
     * This test ensures that appropriate error handling occurs
     * when trying to delete a non-existent user.
     */
    it("should handle user not found during deletion", async () => {
      // Arrange: Set up test data
      const nonExistentId = "nonexistent123";

      const req = {
        params: { userId: nonExistentId },
      };

      const res = {};
      const next = jest.fn();

      // Mock user not found
      User.findByIdAndDelete = jest.fn().mockResolvedValue(null);

      // Act: Call the delete user function
      await staffController.deleteUser(req, res, next);

      // Assert: Verify error handling
      expect(User.findByIdAndDelete).toHaveBeenCalledWith(nonExistentId);
      expect(next).toHaveBeenCalled();
      expect(createError).toHaveBeenCalledWith(
        "User not found",
        404,
        expect.objectContaining({
          code: "USER_NOT_FOUND",
        })
      );
    });

    /**
     * Test Case: Validate user ID is provided for deletion
     *
     * This test ensures that the function validates that
     * a user ID is provided in the deletion request.
     */
    it("should validate user ID is provided for deletion", async () => {
      // Arrange: Set up test data without user ID
      const req = {
        params: {}, // Missing userId
      };

      const res = {};
      const next = jest.fn();

      // Act: Call the delete user function
      await staffController.deleteUser(req, res, next);

      // Assert: Verify validation error
      expect(next).toHaveBeenCalled();
      expect(createError).toHaveBeenCalledWith(
        "User ID is required",
        400,
        expect.objectContaining({
          code: "MISSING_USER_ID",
        })
      );
    });

    /**
     * Test Case: Handle database error during deletion
     *
     * This test ensures that database errors are handled
     * appropriately during user deletion.
     */
    it("should handle database error during deletion", async () => {
      // Arrange: Set up test data
      const staffId = "staff123";

      const req = {
        params: { userId: staffId },
      };

      const res = {};
      const next = jest.fn();

      // Mock database error
      const dbError = new Error("Database error during deletion");
      User.findByIdAndDelete = jest.fn().mockRejectedValue(dbError);

      // Act: Call the delete user function
      await staffController.deleteUser(req, res, next);

      // Assert: Verify error handling
      expect(User.findByIdAndDelete).toHaveBeenCalledWith(staffId);
      expect(next).toHaveBeenCalled();
      expect(createError).toHaveBeenCalledWith(
        "Failed to delete user",
        500,
        expect.objectContaining({
          code: "USER_DELETION_ERROR",
        })
      );
    });
  });

  // Clean up mocks after each test
  afterEach(() => {
    jest.clearAllMocks();
  });
});
