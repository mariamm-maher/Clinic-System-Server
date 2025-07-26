/**
 * Unit Tests for Authorization Middleware
 *
 * These tests verify that the authorization middleware correctly enforces
 * role-based access control throughout the application.
 *
 * The authorization middleware ensures that only users with appropriate
 * roles can access specific endpoints.
 */

const { authorization } = require("../../middlewares/authorization");
const createError = require("../../util/createError");

// Mock external dependencies
jest.mock("../../util/createError");

describe("Authorization Middleware Unit Tests", () => {
  /**
   * Test Case: Allow access for users with correct role
   *
   * This test verifies that users with the required role
   * are granted access to protected endpoints.
   */
  it("should allow access for users with correct role", () => {
    // Arrange: Set up test data
    const allowedRoles = ["doctor", "admin"];
    const middleware = authorization(allowedRoles);

    const req = {
      user: {
        id: "user123",
        role: "doctor", // User has doctor role, which is allowed
      },
    };

    const res = {};
    const next = jest.fn();

    // Act: Call the authorization middleware
    middleware(req, res, next);

    // Assert: Verify access is granted
    expect(next).toHaveBeenCalledWith(); // Called without error
    expect(createError).not.toHaveBeenCalled();
  });

  /**
   * Test Case: Deny access for users with incorrect role
   *
   * This test ensures that users without the required role
   * are denied access to protected endpoints.
   */
  it("should deny access for users with incorrect role", () => {
    // Arrange: Set up test data
    const allowedRoles = ["admin"]; // Only admin allowed
    const middleware = authorization(allowedRoles);

    const req = {
      user: {
        id: "user123",
        role: "staff", // User is staff, but only admin is allowed
      },
    };

    const res = {};
    const next = jest.fn();

    // Act: Call the authorization middleware
    middleware(req, res, next);

    // Assert: Verify access is denied
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(createError).toHaveBeenCalledWith(
      "Access denied. Insufficient permissions.",
      403,
      expect.objectContaining({
        code: "INSUFFICIENT_PERMISSIONS",
      })
    );
  });

  /**
   * Test Case: Allow access for multiple valid roles
   *
   * This test verifies that the middleware correctly handles
   * endpoints that allow multiple roles.
   */
  it("should allow access for any of multiple valid roles", () => {
    // Arrange: Set up test data
    const allowedRoles = ["doctor", "staff", "admin"];
    const middleware = authorization(allowedRoles);

    const testCases = [
      { role: "doctor", description: "doctor role" },
      { role: "staff", description: "staff role" },
      { role: "admin", description: "admin role" },
    ];

    testCases.forEach(({ role, description }) => {
      const req = {
        user: {
          id: "user123",
          role: role,
        },
      };

      const res = {};
      const next = jest.fn();

      // Act: Call the authorization middleware
      middleware(req, res, next);

      // Assert: Verify access is granted for each role
      expect(next).toHaveBeenCalledWith(); // Called without error

      // Clear mocks for next iteration
      jest.clearAllMocks();
    });
  });

  /**
   * Test Case: Handle missing user object
   *
   * This test ensures that the middleware handles cases where
   * the user object is missing from the request (authentication failure).
   */
  it("should deny access when user object is missing", () => {
    // Arrange: Set up test data
    const allowedRoles = ["doctor"];
    const middleware = authorization(allowedRoles);

    const req = {
      // No user object (authentication failed or missing)
    };

    const res = {};
    const next = jest.fn();

    // Act: Call the authorization middleware
    middleware(req, res, next);

    // Assert: Verify access is denied
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(createError).toHaveBeenCalledWith(
      "Access denied. User not authenticated.",
      401,
      expect.objectContaining({
        code: "USER_NOT_AUTHENTICATED",
      })
    );
  });

  /**
   * Test Case: Handle missing user role
   *
   * This test ensures that the middleware handles cases where
   * the user object exists but doesn't have a role property.
   */
  it("should deny access when user role is missing", () => {
    // Arrange: Set up test data
    const allowedRoles = ["doctor"];
    const middleware = authorization(allowedRoles);

    const req = {
      user: {
        id: "user123",
        // Missing role property
      },
    };

    const res = {};
    const next = jest.fn();

    // Act: Call the authorization middleware
    middleware(req, res, next);

    // Assert: Verify access is denied
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(createError).toHaveBeenCalledWith(
      "Access denied. User role not found.",
      403,
      expect.objectContaining({
        code: "USER_ROLE_NOT_FOUND",
      })
    );
  });

  /**
   * Test Case: Handle empty allowed roles array
   *
   * This test ensures that the middleware handles the edge case
   * where no roles are specified as allowed.
   */
  it("should deny access when no roles are allowed", () => {
    // Arrange: Set up test data
    const allowedRoles = []; // Empty array - no roles allowed
    const middleware = authorization(allowedRoles);

    const req = {
      user: {
        id: "user123",
        role: "admin", // Even admin should be denied
      },
    };

    const res = {};
    const next = jest.fn();

    // Act: Call the authorization middleware
    middleware(req, res, next);

    // Assert: Verify access is denied
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(createError).toHaveBeenCalledWith(
      "Access denied. Insufficient permissions.",
      403,
      expect.objectContaining({
        code: "INSUFFICIENT_PERMISSIONS",
      })
    );
  });

  /**
   * Test Case: Case-sensitive role checking
   *
   * This test ensures that role checking is case-sensitive
   * to prevent security bypasses through case manipulation.
   */
  it("should be case-sensitive for role checking", () => {
    // Arrange: Set up test data
    const allowedRoles = ["doctor"]; // Lowercase
    const middleware = authorization(allowedRoles);

    const req = {
      user: {
        id: "user123",
        role: "Doctor", // Uppercase - should not match
      },
    };

    const res = {};
    const next = jest.fn();

    // Act: Call the authorization middleware
    middleware(req, res, next);

    // Assert: Verify access is denied due to case mismatch
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(createError).toHaveBeenCalledWith(
      "Access denied. Insufficient permissions.",
      403,
      expect.objectContaining({
        code: "INSUFFICIENT_PERMISSIONS",
      })
    );
  });

  /**
   * Test Case: Verify middleware is a function
   *
   * This test ensures that the authorization function
   * returns a proper middleware function.
   */
  it("should return a middleware function", () => {
    // Arrange & Act: Create middleware
    const allowedRoles = ["admin"];
    const middleware = authorization(allowedRoles);

    // Assert: Verify it's a function
    expect(typeof middleware).toBe("function");
    expect(middleware.length).toBe(3); // Should accept (req, res, next)
  });

  // Clean up mocks after each test
  afterEach(() => {
    jest.clearAllMocks();
  });
});
