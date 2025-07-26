const Router = require("express").Router();
const {
  CreateBooking,
  GetAllBookings,
  GetBookingById,
  UpdateBooking,
} = require("../controllers/BookingController");
const verifyToken = require("../middlewares/verifyToken");

/**
 * @swagger
 * components:
 *   schemas:
 *     Booking:
 *       type: object
 *       required:
 *         - patientName
 *         - patientPhone
 *         - day
 *         - time
 *         - createdFrom
 *       properties:
 *         patientId:
 *           type: string
 *           description: Patient ID (optional)
 *         patientName:
 *           type: string
 *           description: Patient's name
 *         patientPhone:
 *           type: string
 *           description: Patient's phone number
 *         day:
 *           type: string
 *           description: Booking day
 *         time:
 *           type: string
 *           description: Booking time
 *         createdFrom:
 *           type: string
 *           enum: [clinic, phone, website]
 *           description: Source of booking
 *         status:
 *           type: string
 *           enum: [pending, confirmed, canceled, done]
 *           default: pending
 *           description: Booking status
 *         notes:
 *           type: string
 *           description: Additional notes
 *         createdBy:
 *           type: string
 *           description: User ID who created the booking
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Booking creation date
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Booking last update date
 */
/**
 * @swagger
 * /api/booking:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Booking'
 *     responses:
 *       201:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
Router.post("/booking", verifyToken, CreateBooking);

/**
 * @swagger
 * /api/booking:
 *   get:
 *     summary: Get all bookings
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all bookings
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
 *                     $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Unauthorized
 */
Router.get("/booking", verifyToken, GetAllBookings);

/**
 * @swagger
 * /api/booking/{bookingId}:
 *   get:
 *     summary: Get booking by ID
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Booking not found
 */
Router.get("/booking/:bookingId", verifyToken, GetBookingById);

/**
 * @swagger
 * /api/booking/{bookingId}:
 *   put:
 *     summary: Update booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Booking'
 *     responses:
 *       200:
 *         description: Booking updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Booking not found
 */
Router.put("/booking/:bookingId", verifyToken, UpdateBooking);

module.exports = Router;
