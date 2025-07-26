const Router = require("express").Router();
const {
  GetSchedule,
  UpdateSchedule,
  AddSchedule,
  DropSchedule,
} = require("../controllers/scheduleController");
const verifyToken = require("../middlewares/verifyToken");
const { authorization } = require("../middlewares/authorization");

/**
 * @swagger
 * components:
 *   schemas:
 *     Schedule:
 *       type: object
 *       properties:
 *         doctor:
 *           type: string
 *           description: Doctor ID
 *         days:
 *           type: object
 *           properties:
 *             sunday:
 *               type: object
 *               properties:
 *                 available:
 *                   type: boolean
 *                 startTime:
 *                   type: string
 *                 endTime:
 *                   type: string
 *                 slots:
 *                   type: array
 *                   items:
 *                     type: string
 *             monday:
 *               type: object
 *               properties:
 *                 available:
 *                   type: boolean
 *                 startTime:
 *                   type: string
 *                 endTime:
 *                   type: string
 *                 slots:
 *                   type: array
 *                   items:
 *                     type: string
 *             tuesday:
 *               type: object
 *               properties:
 *                 available:
 *                   type: boolean
 *                 startTime:
 *                   type: string
 *                 endTime:
 *                   type: string
 *                 slots:
 *                   type: array
 *                   items:
 *                     type: string
 *             wednesday:
 *               type: object
 *               properties:
 *                 available:
 *                   type: boolean
 *                 startTime:
 *                   type: string
 *                 endTime:
 *                   type: string
 *                 slots:
 *                   type: array
 *                   items:
 *                     type: string
 *             thursday:
 *               type: object
 *               properties:
 *                 available:
 *                   type: boolean
 *                 startTime:
 *                   type: string
 *                 endTime:
 *                   type: string
 *                 slots:
 *                   type: array
 *                   items:
 *                     type: string
 *             friday:
 *               type: object
 *               properties:
 *                 available:
 *                   type: boolean
 *                 startTime:
 *                   type: string
 *                 endTime:
 *                   type: string
 *                 slots:
 *                   type: array
 *                   items:
 *                     type: string
 *             saturday:
 *               type: object
 *               properties:
 *                 available:
 *                   type: boolean
 *                 startTime:
 *                   type: string
 *                 endTime:
 *                   type: string
 *                 slots:
 *                   type: array
 *                   items:
 *                     type: string
 *     DaySchedule:
 *       type: object
 *       properties:
 *         available:
 *           type: boolean
 *           description: Whether the doctor is available on this day
 *         startTime:
 *           type: string
 *           description: Start time for the day
 *         endTime:
 *           type: string
 *           description: End time for the day
 *         slots:
 *           type: array
 *           items:
 *             type: string
 *           description: Available time slots
 */

/**
 * @swagger
 * /api/schedule:
 *   get:
 *     summary: Get doctor's schedule
 *     tags: [Schedule]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Schedule retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Schedule'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Schedule not found
 */
Router.get("/schedule", verifyToken, GetSchedule);

/**
 * @swagger
 * /api/schedule:
 *   post:
 *     summary: Add new schedule for doctor
 *     tags: [Schedule]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               days:
 *                 type: object
 *                 description: Schedule for each day of the week
 *     responses:
 *       201:
 *         description: Schedule created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Schedule'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Doctor role required
 */
Router.post("/schedule", verifyToken, authorization(["doctor"]), AddSchedule);

/**
 * @swagger
 * /api/schedule/{day}:
 *   put:
 *     summary: Update schedule for a specific day
 *     tags: [Schedule]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: day
 *         required: true
 *         schema:
 *           type: string
 *           enum: [sunday, monday, tuesday, wednesday, thursday, friday, saturday]
 *         description: Day of the week
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DaySchedule'
 *     responses:
 *       200:
 *         description: Schedule updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Schedule'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Doctor role required
 *       404:
 *         description: Schedule not found
 */
Router.put(
  "/schedule/:day",
  verifyToken,
  authorization(["doctor"]),
  UpdateSchedule
);

/**
 * @swagger
 * /api/schedule:
 *   delete:
 *     summary: Delete doctor's schedule
 *     tags: [Schedule]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Schedule deleted successfully
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
 *         description: Schedule not found
 */
Router.delete(
  "/schedule",
  verifyToken,
  authorization(["doctor"]),
  DropSchedule
);

module.exports = Router;
