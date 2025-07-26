const Router = require("express").Router();

const {
  createStaffUser,
  deleteUser,
  getAllStaff,
  getStaffById,
} = require("../controllers/staff");
const verifyToken = require("../middlewares/verifyToken");
const { authorization } = require("../middlewares/authorization");

/**
 * @swagger
 * components:
 *   schemas:
 *     Staff:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *         - role
 *       properties:
 *         _id:
 *           type: string
 *           description: User ID
 *         name:
 *           type: string
 *           description: Staff member's name
 *         email:
 *           type: string
 *           description: Staff member's email
 *         role:
 *           type: string
 *           enum: [admin, doctor, staff]
 *           description: Staff member's role
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Account creation date
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Account last update date
 *     CreateStaffRequest:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *         - role
 *       properties:
 *         name:
 *           type: string
 *           description: Staff member's name
 *         email:
 *           type: string
 *           description: Staff member's email
 *         password:
 *           type: string
 *           description: Staff member's password
 *         role:
 *           type: string
 *           enum: [admin, doctor, staff]
 *           description: Staff member's role
 */

/**
 * @swagger
 * /api/doctor/staff:
 *   post:
 *     summary: Create a new staff user
 *     tags: [Staff Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateStaffRequest'
 *     responses:
 *       201:
 *         description: Staff user created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Staff'
 *       400:
 *         description: Validation error or user already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Doctor role required
 */
// Create new staff user - Only admins can create staff
Router.post(
  "/doctor/staff",
  verifyToken,
  authorization(["doctor"]),
  createStaffUser
);

/**
 * @swagger
 * /api/doctor/staff:
 *   get:
 *     summary: Get all staff users
 *     tags: [Staff Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all staff users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Staff'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Doctor role required
 */
// Get all staff users - Admins and staff can view staff list
Router.get(
  "/doctor/staff",
  verifyToken,
  authorization(["doctor"]),
  getAllStaff
);

/**
 * @swagger
 * /api/doctor/staff/{userId}:
 *   get:
 *     summary: Get staff user by ID
 *     tags: [Staff Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Staff user ID
 *     responses:
 *       200:
 *         description: Staff user retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Staff'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Doctor role required
 *       404:
 *         description: Staff user not found
 */
// Get staff user by ID - Admins and staff can view staff details
Router.get(
  "/doctor/staff/:userId",
  verifyToken,
  authorization(["doctor"]),
  getStaffById
);

/**
 * @swagger
 * /api/doctor/staff/{userId}:
 *   delete:
 *     summary: Delete a staff user
 *     tags: [Staff Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Staff user ID
 *     responses:
 *       200:
 *         description: Staff user deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Doctor role required
 *       404:
 *         description: Staff user not found
 */
// Delete user - Only admins can delete users
Router.delete(
  "/doctor/staff/:userId",
  verifyToken,
  authorization(["doctor"]),
  deleteUser
);

module.exports = Router;
