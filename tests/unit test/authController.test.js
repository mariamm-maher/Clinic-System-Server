/**
 * Unit Tests for Authentication Controller
 *
 * These tests verify that the authentication functions work correctly in isolation.
 * We test registration, login, token refresh, and Google OAuth functionality.
 *
 * Unit tests focus on testing individual functions without external dependencies.
 */

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const authController = require("../../controllers/authController");
const createError = require("../../util/createError");

// Mock external dependencies
jest.mock("../../util/sendSucess");
jest.mock("../../util/createError");
jest.mock("../../util/googleToken");

describe("Authentication Controller Unit Tests", () => {
  describe("Register Function", () => {
    /**
     * Test Case: Successful user registration
     *
     * This test verifies that a new user can be registered successfully
     * when all required fields are provided and valid.
     */
    it("should register a new user successfully", async () => {
      // Arrange: Set up test data and mocks
      const req = {
        body: {
          name: "Test Doctor",
          email: "doctor@test.com",
          password: "password123",
          role: "doctor",
        },
      };

      const res = {};
      const next = jest.fn();

      // Mock that no existing user is found
      jest.spyOn(User, "findOne").mockResolvedValue(null);

      // Mock successful user save
      const mockSave = jest.fn().mockResolvedValue({
        _id: "user123",
        name: "Test Doctor",
        email: "doctor@test.com",
      });

      jest.spyOn(User.prototype, "save").mockImplementation(mockSave);

      // Act: Call the register function
      await authController.Register(req, res, next);

      // Assert: Verify the results
      expect(User.findOne).toHaveBeenCalledWith({ email: "doctor@test.com" });
      expect(mockSave).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled(); // No errors should occur
    });

    /**
     * Test Case: Registration fails when user already exists
     *
     * This test ensures that registration is rejected when trying to
     * register with an email that already exists in the database.
     */
    it("should fail when user already exists", async () => {
      // Arrange: Set up test data
      const req = {
        body: {
          name: "Test Doctor",
          email: "existing@test.com",
          password: "password123",
          role: "doctor",
        },
      };

      const res = {};
      const next = jest.fn();

      // Mock that user already exists
      jest.spyOn(User, "findOne").mockResolvedValue({
        email: "existing@test.com",
      });

      // Act: Call the register function
      await authController.Register(req, res, next);

      // Assert: Verify error is handled
      expect(User.findOne).toHaveBeenCalledWith({ email: "existing@test.com" });
      expect(next).toHaveBeenCalled(); // Error should be passed to next()
      expect(createError).toHaveBeenCalledWith(
        "User already exists",
        400,
        expect.objectContaining({
          code: "USER_EXISTS",
        })
      );
    });

    /**
     * Test Case: Password should be hashed before saving
     *
     * This test ensures that passwords are properly hashed using bcrypt
     * before being stored in the database for security.
     */
    it("should hash password before saving", async () => {
      // Arrange: Set up test data
      const req = {
        body: {
          name: "Test User",
          email: "newuser@test.com",
          password: "plainPassword",
          role: "staff",
        },
      };

      const res = {};
      const next = jest.fn();

      // Mock bcrypt hash function
      const hashedPassword = "hashedPassword123";
      jest.spyOn(bcrypt, "hash").mockResolvedValue(hashedPassword);

      // Mock User operations
      jest.spyOn(User, "findOne").mockResolvedValue(null);
      jest.spyOn(User.prototype, "save").mockResolvedValue({});

      // Act: Call the register function
      await authController.Register(req, res, next);

      // Assert: Verify password was hashed
      expect(bcrypt.hash).toHaveBeenCalledWith("plainPassword", 10);
    });
  });

  describe("Login Function", () => {
    /**
     * Test Case: Successful user login
     *
     * This test verifies that a user can log in successfully with
     * correct email and password, and receive access tokens.
     */
    it("should login user successfully with correct credentials", async () => {
      // Arrange: Set up test data
      const hashedPassword = await bcrypt.hash("password123", 10);
      const mockUser = {
        _id: "user123",
        name: "Test User",
        email: "test@example.com",
        password: hashedPassword,
        role: "doctor",
      };

      const req = {
        body: {
          email: "test@example.com",
          password: "password123",
        },
      };

      const res = {
        cookie: jest.fn(),
      };
      const next = jest.fn();

      // Mock User.findOne to return the mock user
      jest.spyOn(User, "findOne").mockResolvedValue(mockUser);

      // Mock bcrypt.compare to return true (password match)
      jest.spyOn(bcrypt, "compare").mockResolvedValue(true);

      // Act: Call the login function
      await authController.login(req, res, next);

      // Assert: Verify login process
      expect(User.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "password123",
        hashedPassword
      );
      expect(res.cookie).toHaveBeenCalled(); // Refresh token cookie should be set
      expect(next).not.toHaveBeenCalled(); // No errors
    });

    /**
     * Test Case: Login fails with invalid email
     *
     * This test ensures that login is rejected when the email
     * doesn't exist in the database.
     */
    it("should fail login with invalid email", async () => {
      // Arrange: Set up test data
      const req = {
        body: {
          email: "nonexistent@example.com",
          password: "password123",
        },
      };

      const res = {};
      const next = jest.fn();

      // Mock User.findOne to return null (user not found)
      jest.spyOn(User, "findOne").mockResolvedValue(null);

      // Act: Call the login function
      await authController.login(req, res, next);

      // Assert: Verify error handling
      expect(User.findOne).toHaveBeenCalledWith({
        email: "nonexistent@example.com",
      });
      expect(next).toHaveBeenCalled();
      expect(createError).toHaveBeenCalledWith(
        "Invalid email or password",
        401,
        expect.objectContaining({
          code: "INVALID_CREDENTIALS",
        })
      );
    });

    /**
     * Test Case: Login fails with incorrect password
     *
     * This test ensures that login is rejected when the password
     * doesn't match the hashed password in the database.
     */
    it("should fail login with incorrect password", async () => {
      // Arrange: Set up test data
      const hashedPassword = await bcrypt.hash("correctPassword", 10);
      const mockUser = {
        _id: "user123",
        email: "test@example.com",
        password: hashedPassword,
        role: "doctor",
      };

      const req = {
        body: {
          email: "test@example.com",
          password: "wrongPassword",
        },
      };

      const res = {};
      const next = jest.fn();

      // Mock User.findOne to return the user
      jest.spyOn(User, "findOne").mockResolvedValue(mockUser);

      // Mock bcrypt.compare to return false (password mismatch)
      jest.spyOn(bcrypt, "compare").mockResolvedValue(false);

      // Act: Call the login function
      await authController.login(req, res, next);

      // Assert: Verify error handling
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "wrongPassword",
        hashedPassword
      );
      expect(next).toHaveBeenCalled();
      expect(createError).toHaveBeenCalledWith(
        "Invalid email or password",
        401,
        expect.objectContaining({
          code: "INVALID_CREDENTIALS",
        })
      );
    });
  });

  describe("Refresh Token Function", () => {
    /**
     * Test Case: Successful token refresh
     *
     * This test verifies that a valid refresh token can be used
     * to generate a new access token.
     */
    it("should refresh token successfully with valid refresh token", async () => {
      // Arrange: Set up test data
      const validToken = "valid.refresh.token";
      const decodedToken = {
        id: "user123",
        role: "doctor",
      };

      const req = {
        cookies: {
          refreshToken: validToken,
        },
      };

      const res = {};
      const next = jest.fn();

      // Mock jwt.verify to call the callback with decoded token
      jest
        .spyOn(jwt, "verify")
        .mockImplementation((token, secret, callback) => {
          callback(null, decodedToken); // No error, return decoded token
        });

      // Act: Call the refresh token function
      authController.refreshToken(req, res, next);

      // Assert: Verify token refresh
      expect(jwt.verify).toHaveBeenCalledWith(
        validToken,
        process.env.JWT_REFRESH_SECRET,
        expect.any(Function)
      );
      expect(next).not.toHaveBeenCalled(); // No errors
    });

    /**
     * Test Case: Refresh fails with missing token
     *
     * This test ensures that token refresh is rejected when
     * no refresh token is provided in the cookies.
     */
    it("should fail refresh when no token is provided", () => {
      // Arrange: Set up test data (no refresh token)
      const req = {
        cookies: {}, // No refreshToken in cookies
      };

      const res = {};
      const next = jest.fn();

      // Act: Call the refresh token function
      authController.refreshToken(req, res, next);

      // Assert: Verify error handling
      expect(next).toHaveBeenCalled();
      expect(createError).toHaveBeenCalledWith(
        "Refresh token is required",
        401
      );
    });

    /**
     * Test Case: Refresh fails with expired token
     *
     * This test ensures that token refresh is rejected when
     * the refresh token has expired or is invalid.
     */
    it("should fail refresh with expired token", () => {
      // Arrange: Set up test data
      const expiredToken = "expired.refresh.token";
      const req = {
        cookies: {
          refreshToken: expiredToken,
        },
      };

      const res = {};
      const next = jest.fn();

      // Mock jwt.verify to call the callback with an error
      jest
        .spyOn(jwt, "verify")
        .mockImplementation((token, secret, callback) => {
          const error = new Error("Token expired");
          callback(error, null);
        });

      // Act: Call the refresh token function
      authController.refreshToken(req, res, next);

      // Assert: Verify error handling
      expect(jwt.verify).toHaveBeenCalledWith(
        expiredToken,
        process.env.JWT_REFRESH_SECRET,
        expect.any(Function)
      );
      expect(next).toHaveBeenCalled();
      expect(createError).toHaveBeenCalledWith(
        "Refresh token is expired , your session is ended , login again !",
        403
      );
    });
  });

  // Clean up mocks after each test
  afterEach(() => {
    jest.clearAllMocks();
  });
});
