const Router = require("express").Router();
const {
  Register,
  login,
  refreshToken,
  googleCallback,
} = require("../controllers/authController");

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *         - role
 *       properties:
 *         name:
 *           type: string
 *           description: The user's name
 *         email:
 *           type: string
 *           description: The user's email
 *         password:
 *           type: string
 *           description: The user's password
 *         role:
 *           type: string
 *           enum: [admin, doctor, staff]
 *           description: The user's role
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *         password:
 *           type: string
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error or user already exists
 */
Router.post("/register", Register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         headers:
 *           Set-Cookie:
 *             description: HTTP-only refresh token cookie
 *             schema:
 *               type: string
 *               example: refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000; Path=/
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       description: JWT access token for API authorization
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3NGI5ZjA4MWE5MjNlYzQwZjE0YjEzNSIsInJvbGUiOiJkb2N0b3IiLCJpYXQiOjE3Mzc5MTQ4ODgsImV4cCI6MTczNzkxODQ4OH0.abc123
 *                     userId:
 *                       type: string
 *                       description: User's unique identifier
 *                       example: 674b9f081a923ec40f14b135
 *                     name:
 *                       type: string
 *                       description: User's full name
 *                       example: Dr. John Smith
 *                     role:
 *                       type: string
 *                       description: User's role in the system
 *                       example: doctor
 *                       enum: [admin, doctor, staff]
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Invalid email or password
 *                 code:
 *                   type: string
 *                   example: INVALID_CREDENTIALS
 */
Router.post("/login", login);

/**
 * @swagger
 * /api/auth/refresh-token:
 *   get:
 *     summary: Refresh access token using HTTP-only cookie
 *     tags: [Authentication]
 *     description: |
 *       This endpoint uses an HTTP-only cookie containing the refresh token.
 *
 *       **Important Notes:**
 *       - The refresh token is automatically sent via HTTP-only cookie
 *       - You cannot test this endpoint directly in Swagger UI due to HTTP-only cookie restrictions
 *       - For testing, use a tool like Postman or curl that supports cookies
 *       - The cookie is set automatically when you login successfully
 *
 *       **Testing with curl:**
 *       ```bash
 *       # First login to get the cookie
 *       curl -c cookies.txt -X POST http://localhost:4000/api/auth/login \
 *         -H "Content-Type: application/json" \
 *         -d '{"email":"user@example.com","password":"password"}'
 *
 *       # Then use the cookie to refresh token
 *       curl -b cookies.txt -X GET http://localhost:4000/api/auth/refresh-token
 *       ```
 *     parameters:
 *       - in: cookie
 *         name: refreshToken
 *         required: true
 *         schema:
 *           type: string
 *         description: HTTP-only refresh token cookie (automatically sent by browser)
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Token refreshed successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       description: New JWT access token
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.newtoken.signature
 *       401:
 *         description: Refresh token required or missing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Refresh token is required
 *       403:
 *         description: Refresh token expired or invalid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Refresh token is expired, your session is ended, login again!
 */
Router.get("/refresh-token", refreshToken);

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirect to frontend with tokens
 */
Router.get("/google/callback", googleCallback);

module.exports = Router;
