/**
 * Integration Tests for Authentication Routes
 *
 * These tests verify that the complete authentication flow works correctly
 * from HTTP request to database operations. Integration tests test the
 * interaction between multiple components working together.
 *
 * We test the actual HTTP endpoints with real database operations
 * (using test database) to ensure the entire flow works as expected.
 */

const request = require("supertest");
const User = require("../../models/User");

describe("Authentication Integration Tests", () => {
  let app;

  /**
   * Setup Express app for testing
   *
   * This uses our configured app.js which doesn't call app.listen(),
   * making it safe for testing without open handles.
   */
  beforeAll(() => {
    app = testUtils.getApp();
  });

  describe("POST /api/auth/register - User Registration", () => {
    /**
     * Test Case: Complete registration flow
     *
     * This test verifies that a user can successfully register
     * through the HTTP endpoint, with data being saved to the database.
     */
    it("should register a new user successfully", async () => {
      // Arrange: Prepare user registration data
      const newUser = {
        name: "Integration Test Doctor",
        email: "integration.doctor@test.com",
        password: "testPassword123",
        role: "doctor",
      };

      // Act: Send registration request
      const response = await request(app)
        .post("/api/auth/register")
        .send(newUser)
        .expect(201);

      // Assert: Verify response and database state
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("User registered successfully");
      expect(response.body.data).toHaveProperty("userId");
      expect(response.body.data.name).toBe(newUser.name);
      expect(response.body.data.email).toBe(newUser.email);

      // Verify user was actually saved to database
      const savedUser = await User.findById(response.body.data.userId);
      expect(savedUser).toBeTruthy();
      expect(savedUser.name).toBe(newUser.name);
      expect(savedUser.email).toBe(newUser.email);
      expect(savedUser.role).toBe(newUser.role);

      // Verify password was hashed (not stored as plain text)
      expect(savedUser.password).not.toBe(newUser.password);
      expect(savedUser.password.length).toBeGreaterThan(20); // Hashed passwords are longer
    });

    /**
     * Test Case: Registration with duplicate email
     *
     * This test verifies that registration fails when trying to
     * register with an email that already exists.
     */
    it("should reject registration with duplicate email", async () => {
      // Arrange: Create a user first
      const existingUser = await testUtils.createTestUser("staff", {
        email: "duplicate@test.com",
      });

      const duplicateUser = {
        name: "Another User",
        email: "duplicate@test.com", // Same email
        password: "password123",
        role: "doctor",
      };

      // Act: Try to register with duplicate email
      const response = await request(app)
        .post("/api/auth/register")
        .send(duplicateUser)
        .expect(400);

      // Assert: Verify error response
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("User already exists");
      expect(response.body.code).toBe("USER_EXISTS");
    });

    /**
     * Test Case: Registration with invalid data
     *
     * This test verifies that validation works correctly
     * and rejects invalid registration data.
     */
    it("should reject registration with invalid data", async () => {
      // Arrange: Prepare invalid user data (missing required fields)
      const invalidUser = {
        name: "Test User",
        // Missing email, password, and role
      };

      // Act: Send registration request with invalid data
      const response = await request(app)
        .post("/api/auth/register")
        .send(invalidUser)
        .expect(400);

      // Assert: Verify validation error
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation Error");
      expect(response.body.code).toBe("VALIDATION_FAILED");
      expect(response.body.details).toBeInstanceOf(Array);
    });
  });

  describe("POST /api/auth/login - User Login", () => {
    /**
     * Test Case: Complete login flow
     *
     * This test verifies the entire login process including
     * token generation and cookie setting.
     */
    it("should login user successfully with correct credentials", async () => {
      // Arrange: Create a test user first
      const testUser = await testUtils.createTestUser("doctor", {
        email: "login.test@example.com",
      });

      const loginData = {
        email: "login.test@example.com",
        password: "password123", // Default password from createTestUser
      };

      // Act: Send login request
      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(200);

      // Assert: Verify response structure
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Login successful");
      expect(response.body.data).toHaveProperty("accessToken");
      expect(response.body.data).toHaveProperty("userId");
      expect(response.body.data).toHaveProperty("name");
      expect(response.body.data).toHaveProperty("role");

      // Verify access token format (JWT)
      const accessToken = response.body.data.accessToken;
      expect(accessToken).toMatch(
        /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/
      );

      // Verify refresh token cookie was set
      const cookies = response.headers["set-cookie"];
      expect(cookies).toBeDefined();
      const refreshTokenCookie = cookies.find((cookie) =>
        cookie.startsWith("refreshToken=")
      );
      expect(refreshTokenCookie).toBeDefined();
      expect(refreshTokenCookie).toContain("HttpOnly");
      expect(refreshTokenCookie).toContain("SameSite=Strict");
    });

    /**
     * Test Case: Login with invalid credentials
     *
     * This test verifies that login fails appropriately
     * with incorrect email or password.
     */
    it("should reject login with invalid credentials", async () => {
      // Arrange: Use non-existent user credentials
      const invalidLoginData = {
        email: "nonexistent@example.com",
        password: "wrongpassword",
      };

      // Act: Send login request with invalid credentials
      const response = await request(app)
        .post("/api/auth/login")
        .send(invalidLoginData)
        .expect(401);

      // Assert: Verify error response
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Invalid email or password");
      expect(response.body.code).toBe("INVALID_CREDENTIALS");

      // Verify no cookies were set
      const cookies = response.headers["set-cookie"];
      expect(cookies).toBeUndefined();
    });

    /**
     * Test Case: Login with correct email but wrong password
     *
     * This test specifically verifies password validation
     * when the user exists but password is incorrect.
     */
    it("should reject login with wrong password", async () => {
      // Arrange: Create a test user
      const testUser = await testUtils.createTestUser("staff", {
        email: "password.test@example.com",
      });

      const wrongPasswordData = {
        email: "password.test@example.com",
        password: "wrongpassword123",
      };

      // Act: Send login request with wrong password
      const response = await request(app)
        .post("/api/auth/login")
        .send(wrongPasswordData)
        .expect(401);

      // Assert: Verify error response
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Invalid email or password");
      expect(response.body.code).toBe("INVALID_CREDENTIALS");
    });
  });

  describe("GET /api/auth/refresh-token - Token Refresh", () => {
    /**
     * Test Case: Complete token refresh flow
     *
     * This test verifies that refresh tokens work correctly
     * to generate new access tokens.
     */
    it("should refresh token successfully with valid refresh token", async () => {
      // Arrange: Login first to get refresh token
      const testUser = await testUtils.createTestUser("admin");
      const tokens = testUtils.generateTestTokens(testUser);

      // Act: Send refresh token request with cookie
      const response = await request(app)
        .get("/api/auth/refresh-token")
        .set("Cookie", [`refreshToken=${tokens.refreshToken}`])
        .expect(200);

      // Assert: Verify new access token is returned
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Token refreshed successfully");
      expect(response.body.data).toHaveProperty("accessToken");

      // Verify new token is different from original
      expect(response.body.data.accessToken).not.toBe(tokens.accessToken);

      // Verify new token format
      const newAccessToken = response.body.data.accessToken;
      expect(newAccessToken).toMatch(
        /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/
      );
    });

    /**
     * Test Case: Refresh token fails without cookie
     *
     * This test verifies that refresh token endpoint requires
     * the HTTP-only cookie to be present.
     */
    it("should reject refresh request without refresh token cookie", async () => {
      // Act: Send refresh request without cookie
      const response = await request(app)
        .get("/api/auth/refresh-token")
        .expect(401);

      // Assert: Verify error response
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Refresh token is required");
    });

    /**
     * Test Case: Refresh token fails with invalid token
     *
     * This test verifies that invalid or expired refresh tokens
     * are properly rejected.
     */
    it("should reject refresh request with invalid token", async () => {
      // Arrange: Use an invalid refresh token
      const invalidToken = "invalid.token.here";

      // Act: Send refresh request with invalid token
      const response = await request(app)
        .get("/api/auth/refresh-token")
        .set("Cookie", [`refreshToken=${invalidToken}`])
        .expect(403);

      // Assert: Verify error response
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("expired");
    });
  });

  describe("Complete Authentication Flow", () => {
    /**
     * Test Case: End-to-end authentication workflow
     *
     * This test verifies the complete authentication flow:
     * Register → Login → Use Access Token → Refresh Token
     */
    it("should complete full authentication workflow", async () => {
      // Step 1: Register a new user
      const userData = {
        name: "Workflow Test User",
        email: "workflow@test.com",
        password: "workflowPassword123",
        role: "doctor",
      };

      const registerResponse = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);

      // Step 2: Login with the registered user
      const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      const accessToken = loginResponse.body.data.accessToken;
      const refreshTokenCookie = loginResponse.headers["set-cookie"].find(
        (cookie) => cookie.startsWith("refreshToken=")
      );

      // Step 3: Use access token (this would be tested in protected route tests)
      expect(accessToken).toBeDefined();
      expect(accessToken).toMatch(
        /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/
      );

      // Step 4: Refresh the token
      const refreshResponse = await request(app)
        .get("/api/auth/refresh-token")
        .set("Cookie", [refreshTokenCookie])
        .expect(200);

      expect(refreshResponse.body.success).toBe(true);
      expect(refreshResponse.body.data.accessToken).toBeDefined();
      expect(refreshResponse.body.data.accessToken).not.toBe(accessToken);

      console.log("✅ Complete authentication workflow test passed");
    });
  });
});
