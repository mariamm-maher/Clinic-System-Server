/**
 * Integration Tests for Staff Management Workflow
 *
 * These tests verify that the complete staff management workflow works correctly
 * from end to end. We test the full HTTP request/response cycle including:
 * - Creating staff users with proper validation and authorization
 * - Retrieving staff data with appropriate filtering
 * - Managing staff users by ID with security checks
 * - Deleting staff users with proper authorization
 *
 * Integration tests use a real test database and test the complete flow
 * including middleware, controllers, and database operations.
 */

const request = require("supertest");
const app = require("../../index");
const User = require("../../models/User");
const bcrypt = require("bcryptjs");
const { generateTokens } = require("../setup");

describe("Staff Management Integration Tests", () => {
  let doctorTokens;
  let staffTokens;
  let testStaffUser;

  /**
   * Setup: Create test users before running tests
   *
   * This setup ensures we have authenticated users with different roles
   * required for staff management tests.
   */
  beforeEach(async () => {
    // Create authenticated doctor user (required for staff management)
    doctorTokens = await generateTokens({
      id: "doctor123",
      email: "doctor@clinic.com",
      role: "doctor",
    });

    // Create authenticated staff user (for testing authorization limits)
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
    // Only delete test staff users, preserve the main test users
    await User.deleteMany({
      email: { $nin: ["doctor@clinic.com", "staff@clinic.com"] },
    });
  });

  describe("Staff User Creation Workflow", () => {
    /**
     * Test Case: Successfully create new staff user
     *
     * This test verifies that a doctor can create a new staff user
     * with proper validation and password hashing.
     */
    it("should create new staff user successfully", async () => {
      // Arrange: Set up staff user data
      const staffData = {
        name: "Jane Smith",
        email: "jane.smith@clinic.com",
        password: "securePassword123",
        role: "staff",
      };

      // Act: Send POST request to create staff user
      const response = await request(app)
        .post("/api/doctor/staff")
        .set("Authorization", `Bearer ${doctorTokens.accessToken}`)
        .send(staffData)
        .expect(201);

      // Assert: Verify response structure
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Staff user created successfully"
      );

      // Verify user was saved to database
      const savedUser = await User.findOne({ email: "jane.smith@clinic.com" });
      expect(savedUser).toBeTruthy();
      expect(savedUser.name).toBe("Jane Smith");
      expect(savedUser.email).toBe("jane.smith@clinic.com");
      expect(savedUser.role).toBe("staff");

      // Verify password was hashed
      expect(savedUser.password).not.toBe("securePassword123");
      const passwordMatch = await bcrypt.compare(
        "securePassword123",
        savedUser.password
      );
      expect(passwordMatch).toBe(true);
    });

    /**
     * Test Case: Validate required fields for staff creation
     *
     * This test ensures that staff creation validates required fields
     * and provides appropriate error messages for missing data.
     */
    it("should validate required fields for staff creation", async () => {
      // Arrange: Set up invalid staff data (missing required fields)
      const invalidStaffData = {
        name: "Incomplete Staff",
        // Missing email and password
      };

      // Act: Send POST request with invalid data
      const response = await request(app)
        .post("/api/doctor/staff")
        .set("Authorization", `Bearer ${doctorTokens.accessToken}`)
        .send(invalidStaffData)
        .expect(400);

      // Assert: Verify validation error
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "VALIDATION_FAILED");
      expect(response.body.error).toHaveProperty("details");
      expect(Array.isArray(response.body.error.details)).toBe(true);
    });

    /**
     * Test Case: Prevent duplicate email registration
     *
     * This test ensures that staff creation fails when trying to create
     * a user with an email that already exists.
     */
    it("should prevent duplicate email registration", async () => {
      // Arrange: Create existing user
      await User.create({
        name: "Existing User",
        email: "existing@clinic.com",
        password: await bcrypt.hash("password123", 10),
        role: "staff",
      });

      // Try to create user with same email
      const duplicateStaffData = {
        name: "Duplicate User",
        email: "existing@clinic.com",
        password: "newPassword123",
        role: "staff",
      };

      // Act: Send POST request with duplicate email
      const response = await request(app)
        .post("/api/doctor/staff")
        .set("Authorization", `Bearer ${doctorTokens.accessToken}`)
        .send(duplicateStaffData)
        .expect(400);

      // Assert: Verify error response
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "USER_EXISTS");
    });

    /**
     * Test Case: Require doctor role for staff creation
     *
     * This test ensures that only users with doctor role can create staff users
     * and staff users cannot create other staff users.
     */
    it("should require doctor role for staff creation", async () => {
      // Arrange: Set up valid staff data
      const staffData = {
        name: "Test Staff",
        email: "test.staff@clinic.com",
        password: "password123",
        role: "staff",
      };

      // Act: Try to create staff with staff token
      const response = await request(app)
        .post("/api/doctor/staff")
        .set("Authorization", `Bearer ${staffTokens.accessToken}`)
        .send(staffData)
        .expect(403);

      // Assert: Verify forbidden response
      expect(response.body).toHaveProperty("success", false);

      // Verify user was not created
      const notCreatedUser = await User.findOne({
        email: "test.staff@clinic.com",
      });
      expect(notCreatedUser).toBeNull();
    });

    /**
     * Test Case: Require authentication for staff creation
     *
     * This test ensures that staff creation requires proper authentication
     * and fails when no auth token is provided.
     */
    it("should require authentication for staff creation", async () => {
      // Arrange: Set up valid staff data
      const staffData = {
        name: "Unauthenticated Staff",
        email: "unauth@clinic.com",
        password: "password123",
        role: "staff",
      };

      // Act: Send POST request without authentication
      const response = await request(app)
        .post("/api/doctor/staff")
        .send(staffData)
        .expect(401);

      // Assert: Verify unauthorized response
      expect(response.body).toHaveProperty("success", false);
    });
  });

  describe("Staff User Retrieval Workflow", () => {
    /**
     * Setup: Create test staff users before retrieval tests
     */
    beforeEach(async () => {
      // Create multiple staff users for testing
      const staffUsers = [
        {
          name: "Staff One",
          email: "staff1@clinic.com",
          password: await bcrypt.hash("password123", 10),
          role: "staff",
        },
        {
          name: "Staff Two",
          email: "staff2@clinic.com",
          password: await bcrypt.hash("password123", 10),
          role: "staff",
        },
        {
          name: "Staff Three",
          email: "staff3@clinic.com",
          password: await bcrypt.hash("password123", 10),
          role: "staff",
        },
      ];

      await User.insertMany(staffUsers);

      // Save reference to first staff user for individual tests
      testStaffUser = await User.findOne({ email: "staff1@clinic.com" });
    });

    /**
     * Test Case: Successfully retrieve all staff users
     *
     * This test verifies that all staff users can be retrieved
     * with proper data structure and password exclusion.
     */
    it("should retrieve all staff users successfully", async () => {
      // Act: Send GET request to retrieve all staff
      const response = await request(app)
        .get("/api/doctor/staff")
        .set("Authorization", `Bearer ${doctorTokens.accessToken}`)
        .expect(200);

      // Assert: Verify response structure
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Staff users retrieved successfully"
      );
      expect(response.body.data).toHaveProperty("staff");
      expect(response.body.data).toHaveProperty("count");

      const staff = response.body.data.staff;
      expect(Array.isArray(staff)).toBe(true);
      expect(staff.length).toBeGreaterThanOrEqual(3); // At least our test users

      // Verify staff data structure and password exclusion
      staff.forEach((staffMember) => {
        expect(staffMember).toHaveProperty("_id");
        expect(staffMember).toHaveProperty("name");
        expect(staffMember).toHaveProperty("email");
        expect(staffMember).toHaveProperty("role", "staff");
        expect(staffMember).toHaveProperty("createdAt");
        expect(staffMember).not.toHaveProperty("password"); // Password should be excluded
      });

      // Verify specific test users are included
      const emailList = staff.map((s) => s.email);
      expect(emailList).toContain("staff1@clinic.com");
      expect(emailList).toContain("staff2@clinic.com");
      expect(emailList).toContain("staff3@clinic.com");
    });

    /**
     * Test Case: Successfully retrieve staff user by ID
     *
     * This test verifies that a specific staff user can be retrieved
     * by their ID with complete information.
     */
    it("should retrieve staff user by ID successfully", async () => {
      // Act: Send GET request to retrieve specific staff user
      const response = await request(app)
        .get(`/api/doctor/staff/${testStaffUser._id}`)
        .set("Authorization", `Bearer ${doctorTokens.accessToken}`)
        .expect(200);

      // Assert: Verify response structure and data
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Staff user retrieved successfully"
      );
      expect(response.body.data).toHaveProperty("user");

      const user = response.body.data.user;
      expect(user).toHaveProperty("_id", testStaffUser._id.toString());
      expect(user).toHaveProperty("name", "Staff One");
      expect(user).toHaveProperty("email", "staff1@clinic.com");
      expect(user).toHaveProperty("role", "staff");
      expect(user).toHaveProperty("createdAt");
      expect(user).not.toHaveProperty("password"); // Password should be excluded
    });

    /**
     * Test Case: Handle staff user not found
     *
     * This test ensures that appropriate error handling occurs
     * when trying to retrieve a non-existent staff user.
     */
    it("should handle staff user not found", async () => {
      // Arrange: Use non-existent user ID
      const nonExistentUserId = "507f1f77bcf86cd799439011";

      // Act: Send GET request with non-existent user ID
      const response = await request(app)
        .get(`/api/doctor/staff/${nonExistentUserId}`)
        .set("Authorization", `Bearer ${doctorTokens.accessToken}`)
        .expect(404);

      // Assert: Verify error response
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "STAFF_NOT_FOUND");
    });

    /**
     * Test Case: Validate user ID format
     *
     * This test ensures that the endpoint validates user ID format
     * and handles invalid ID formats appropriately.
     */
    it("should validate user ID format", async () => {
      // Arrange: Use invalid user ID format
      const invalidUserId = "invalid-id-format";

      // Act: Send GET request with invalid user ID
      const response = await request(app)
        .get(`/api/doctor/staff/${invalidUserId}`)
        .set("Authorization", `Bearer ${doctorTokens.accessToken}`)
        .expect(500); // MongoDB will throw error for invalid ObjectId

      // Assert: Verify error response
      expect(response.body).toHaveProperty("success", false);
    });

    /**
     * Test Case: Require doctor role for staff retrieval
     *
     * This test ensures that only doctors can access staff user information
     * and staff users cannot access other staff data.
     */
    it("should require doctor role for staff retrieval", async () => {
      // Act: Try to retrieve staff list with staff token
      const response = await request(app)
        .get("/api/doctor/staff")
        .set("Authorization", `Bearer ${staffTokens.accessToken}`)
        .expect(403);

      // Assert: Verify forbidden response
      expect(response.body).toHaveProperty("success", false);
    });
  });

  describe("Staff User Deletion Workflow", () => {
    /**
     * Setup: Create test staff user before deletion tests
     */
    beforeEach(async () => {
      testStaffUser = await User.create({
        name: "Staff To Delete",
        email: "delete.staff@clinic.com",
        password: await bcrypt.hash("password123", 10),
        role: "staff",
      });
    });

    /**
     * Test Case: Successfully delete staff user
     *
     * This test verifies that a staff user can be deleted
     * successfully by a doctor.
     */
    it("should delete staff user successfully", async () => {
      // Act: Send DELETE request to remove staff user
      const response = await request(app)
        .delete(`/api/doctor/staff/${testStaffUser._id}`)
        .set("Authorization", `Bearer ${doctorTokens.accessToken}`)
        .expect(200);

      // Assert: Verify response structure
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "User deleted successfully"
      );

      // Verify user was removed from database
      const deletedUser = await User.findById(testStaffUser._id);
      expect(deletedUser).toBeNull();
    });

    /**
     * Test Case: Handle deletion of non-existent staff user
     *
     * This test ensures that appropriate error handling occurs
     * when trying to delete a non-existent staff user.
     */
    it("should handle deletion of non-existent staff user", async () => {
      // Arrange: Use non-existent user ID
      const nonExistentUserId = "507f1f77bcf86cd799439011";

      // Act: Send DELETE request with non-existent user ID
      const response = await request(app)
        .delete(`/api/doctor/staff/${nonExistentUserId}`)
        .set("Authorization", `Bearer ${doctorTokens.accessToken}`)
        .expect(404);

      // Assert: Verify error response
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "USER_NOT_FOUND");
    });

    /**
     * Test Case: Require doctor role for staff deletion
     *
     * This test ensures that only doctors can delete staff users
     * and staff users cannot delete other staff users.
     */
    it("should require doctor role for staff deletion", async () => {
      // Act: Try to delete staff user with staff token
      const response = await request(app)
        .delete(`/api/doctor/staff/${testStaffUser._id}`)
        .set("Authorization", `Bearer ${staffTokens.accessToken}`)
        .expect(403);

      // Assert: Verify forbidden response
      expect(response.body).toHaveProperty("success", false);

      // Verify user still exists
      const existingUser = await User.findById(testStaffUser._id);
      expect(existingUser).toBeTruthy();
    });

    /**
     * Test Case: Require authentication for staff deletion
     *
     * This test ensures that staff deletion requires proper authentication
     * and fails when no auth token is provided.
     */
    it("should require authentication for staff deletion", async () => {
      // Act: Send DELETE request without authentication
      const response = await request(app)
        .delete(`/api/doctor/staff/${testStaffUser._id}`)
        .expect(401);

      // Assert: Verify unauthorized response
      expect(response.body).toHaveProperty("success", false);

      // Verify user still exists
      const existingUser = await User.findById(testStaffUser._id);
      expect(existingUser).toBeTruthy();
    });

    /**
     * Test Case: Validate user ID for deletion
     *
     * This test ensures that the deletion endpoint validates
     * that a user ID is provided.
     */
    it("should validate user ID for deletion", async () => {
      // Act: Send DELETE request without user ID (will hit different route)
      const response = await request(app)
        .delete("/api/doctor/staff/")
        .set("Authorization", `Bearer ${doctorTokens.accessToken}`)
        .expect(404); // Route not found

      // Note: This tests the route structure itself
    });
  });

  describe("Staff Management Authorization Workflow", () => {
    /**
     * Test Case: Verify complete authorization chain
     *
     * This test verifies that the complete authorization chain works
     * from token verification to role-based access control.
     */
    it("should verify complete authorization chain", async () => {
      // Test 1: No token - should fail with 401
      let response = await request(app).get("/api/doctor/staff").expect(401);

      expect(response.body).toHaveProperty("success", false);

      // Test 2: Invalid token - should fail with 401
      response = await request(app)
        .get("/api/doctor/staff")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);

      expect(response.body).toHaveProperty("success", false);

      // Test 3: Valid token but wrong role - should fail with 403
      response = await request(app)
        .get("/api/doctor/staff")
        .set("Authorization", `Bearer ${staffTokens.accessToken}`)
        .expect(403);

      expect(response.body).toHaveProperty("success", false);

      // Test 4: Valid token with correct role - should succeed
      response = await request(app)
        .get("/api/doctor/staff")
        .set("Authorization", `Bearer ${doctorTokens.accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
    });

    /**
     * Test Case: Verify role-specific access patterns
     *
     * This test verifies that different roles have appropriate
     * access patterns for staff management operations.
     */
    it("should verify role-specific access patterns", async () => {
      // Create test staff user for operations
      const testUser = await User.create({
        name: "Role Test Staff",
        email: "roletest@clinic.com",
        password: await bcrypt.hash("password123", 10),
        role: "staff",
      });

      const operations = [
        {
          method: "post",
          path: "/api/doctor/staff",
          data: { name: "Test", email: "test@test.com", password: "test123" },
        },
        { method: "get", path: "/api/doctor/staff" },
        { method: "get", path: `/api/doctor/staff/${testUser._id}` },
        { method: "delete", path: `/api/doctor/staff/${testUser._id}` },
      ];

      // Test each operation with staff token (should all fail with 403)
      for (const operation of operations) {
        const response = await request(app)
          [operation.method](operation.path)
          .set("Authorization", `Bearer ${staffTokens.accessToken}`)
          .send(operation.data || {})
          .expect(403);

        expect(response.body).toHaveProperty("success", false);
      }

      // Test each operation with doctor token (should all succeed or have expected behavior)
      for (const operation of operations) {
        if (operation.method === "delete") {
          // Skip delete in loop, test separately
          continue;
        }

        const response = await request(app)
          [operation.method](operation.path)
          .set("Authorization", `Bearer ${doctorTokens.accessToken}`)
          .send(operation.data || {});

        // Most operations should succeed, create might fail due to validation
        expect([200, 201, 400]).toContain(response.status);
      }

      // Clean up test user
      await User.findByIdAndDelete(testUser._id);
    });
  });
});
