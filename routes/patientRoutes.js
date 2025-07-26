const Router = require("express").Router();

const {
  GetAllPatientsForStaff,
  GetPatientByIdForStaff,
  CreatePatientProfile,
  GetPatientProfileForDoctor,
} = require("../controllers/patientController");
const verifyToken = require("../middlewares/verifyToken");
const { authorization } = require("../middlewares/authorization");

/**
 * @swagger
 * components:
 *   schemas:
 *     Patient:
 *       type: object
 *       required:
 *         - generalInfo
 *       properties:
 *         generalInfo:
 *           type: object
 *           required:
 *             - name
 *             - gender
 *             - phone
 *           properties:
 *             name:
 *               type: string
 *               description: Patient's full name
 *             age:
 *               type: number
 *               description: Patient's age
 *             dateOfBirth:
 *               type: string
 *               format: date
 *               description: Patient's date of birth
 *             gender:
 *               type: string
 *               enum: [male, female]
 *               description: Patient's gender
 *             phone:
 *               type: string
 *               description: Patient's phone number
 *             address:
 *               type: string
 *               description: Patient's address
 *         personalInfo:
 *           type: object
 *           properties:
 *             occupation:
 *               type: string
 *               description: Patient's occupation
 *             maritalStatus:
 *               type: string
 *               enum: [single, married, divorced, widowed]
 *               description: Patient's marital status
 *             children:
 *               type: number
 *               default: 0
 *               description: Number of children
 *             habits:
 *               type: array
 *               items:
 *                 type: string
 *               description: Patient's habits
 *             other:
 *               type: string
 *               description: Additional information
 *         visits:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of visit IDs
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Patient creation date
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */
/**
 * @swagger
 * /api/patients/staff:
 *   get:
 *     summary: Get all patients for staff
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all patients
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
 *                     $ref: '#/components/schemas/Patient'
 *       401:
 *         description: Unauthorized
 */
Router.get("/patients/staff", verifyToken, GetAllPatientsForStaff);

/**
 * @swagger
 * /api/patients/doctor/{patientId}:
 *   get:
 *     summary: Get patient profile for doctor
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient ID
 *     responses:
 *       200:
 *         description: Patient profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Patient'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Doctor role required
 *       404:
 *         description: Patient not found
 */
Router.get(
  "/patients/doctor/:patientId",
  verifyToken,
  authorization(["doctor"]),
  GetPatientProfileForDoctor
);

/**
 * @swagger
 * /api/patients/staff/{patientId}:
 *   get:
 *     summary: Get patient by ID for staff
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient ID
 *     responses:
 *       200:
 *         description: Patient retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Patient'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Patient not found
 */
Router.get("/patients/staff/:patientId", verifyToken, GetPatientByIdForStaff);

/**
 * @swagger
 * /api/patients:
 *   post:
 *     summary: Create a new patient profile
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Patient'
 *     responses:
 *       201:
 *         description: Patient created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Patient'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
Router.post("/patients", verifyToken, CreatePatientProfile);

module.exports = Router;
