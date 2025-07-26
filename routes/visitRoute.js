const Router = require("express").Router();
const {
  CreateVisit,
  updatePastHistory,
  updateMainComplaint,
  updateChecks,
  updateExamination,
  updateInvestigations,
  updatePrescription,
  GetVisitById,
  GetAllVisitsOfPatient,
} = require("../controllers/visitController");
const verifyToken = require("../middlewares/verifyToken");
const { authorization } = require("../middlewares/authorization");

/**
 * @swagger
 * components:
 *   schemas:
 *     Visit:
 *       type: object
 *       required:
 *         - patient
 *         - type
 *       properties:
 *         patient:
 *           type: string
 *           description: Patient ID
 *         type:
 *           type: string
 *           enum: [consultation, follow-up]
 *           description: Type of visit
 *         date:
 *           type: string
 *           format: date-time
 *           description: Visit date
 *         pastHistory:
 *           type: object
 *           properties:
 *             medicalHistory:
 *               type: string
 *             medications:
 *               type: string
 *             surgicalHistory:
 *               type: string
 *             hospitalizations:
 *               type: string
 *             allergies:
 *               type: string
 *         mainComplaint:
 *           type: object
 *           properties:
 *             description:
 *               type: string
 *               description: Main reason for visit
 *             onset:
 *               type: string
 *               description: When did it start?
 *             duration:
 *               type: string
 *               description: How long has it been there?
 *             location:
 *               type: string
 *               description: Where exactly is the symptom?
 *             character:
 *               type: string
 *               description: e.g., sharp, dull, throbbing
 *             course:
 *               type: string
 *               description: Has it been continuous, intermittent?
 *             severity:
 *               type: string
 *               description: Mild, moderate, severe (or 0-10 scale)
 *             radiation:
 *               type: string
 *               description: Does it spread anywhere?
 *             associatedSymptoms:
 *               type: string
 *               description: e.g., nausea, fever, vomiting
 *             aggravatingFactors:
 *               type: string
 *               description: What makes it worse?
 *             relievingFactors:
 *               type: string
 *               description: What makes it better?
 *             previousEpisodes:
 *               type: string
 *               description: Has it happened before?
 *             impactOnLife:
 *               type: string
 *               description: Does it affect sleep, appetite, etc.?
 *             patientThoughts:
 *               type: string
 *               description: What does the patient think it is?
 *             otherNotes:
 *               type: string
 *               description: Any other relevant detail
 *         checks:
 *           type: string
 *           description: Reference to Checks document
 *         examination:
 *           type: string
 *           description: Reference to Examination document
 *         investigations:
 *           type: string
 *           description: Reference to Investigation document
 *         prescription:
 *           type: string
 *           description: Reference to Prescription document
 *     PastHistory:
 *       type: object
 *       properties:
 *         medicalHistory:
 *           type: string
 *         medications:
 *           type: string
 *         surgicalHistory:
 *           type: string
 *         hospitalizations:
 *           type: string
 *         allergies:
 *           type: string
 *     MainComplaint:
 *       type: object
 *       properties:
 *         description:
 *           type: string
 *         onset:
 *           type: string
 *         duration:
 *           type: string
 *         location:
 *           type: string
 *         character:
 *           type: string
 *         course:
 *           type: string
 *         severity:
 *           type: string
 *         radiation:
 *           type: string
 *         associatedSymptoms:
 *           type: string
 *         aggravatingFactors:
 *           type: string
 *         relievingFactors:
 *           type: string
 *         previousEpisodes:
 *           type: string
 *         impactOnLife:
 *           type: string
 *         patientThoughts:
 *           type: string
 *         otherNotes:
 *           type: string
 *     Checks:
 *       type: object
 *       properties:
 *         general:
 *           type: object
 *           properties:
 *             fever:
 *               type: boolean
 *             weightLoss:
 *               type: boolean
 *             fatigue:
 *               type: boolean
 *             nightSweats:
 *               type: boolean
 *             appetiteChange:
 *               type: boolean
 *             weakness:
 *               type: boolean
 *         cardiovascular:
 *           type: object
 *           properties:
 *             chestPain:
 *               type: boolean
 *             palpitations:
 *               type: boolean
 *             shortnessOfBreath:
 *               type: boolean
 *             orthopnea:
 *               type: boolean
 *             paroxysmalNocturnalDyspnea:
 *               type: boolean
 *             legSwelling:
 *               type: boolean
 *         respiratory:
 *           type: object
 *           properties:
 *             cough:
 *               type: boolean
 *             sputum:
 *               type: boolean
 *             hemoptysis:
 *               type: boolean
 *             wheezing:
 *               type: boolean
 *             shortnessOfBreath:
 *               type: boolean
 *             chestTightness:
 *               type: boolean
 *         gastrointestinal:
 *           type: object
 *           properties:
 *             nausea:
 *               type: boolean
 *             vomiting:
 *               type: boolean
 *             diarrhea:
 *               type: boolean
 *             constipation:
 *               type: boolean
 *             abdominalPain:
 *               type: boolean
 *             bloating:
 *               type: boolean
 *             heartburn:
 *               type: boolean
 *             difficultySwallowing:
 *               type: boolean
 *             rectalBleeding:
 *               type: boolean
 *         genitourinary:
 *           type: object
 *           properties:
 *             dysuria:
 *               type: boolean
 *             urinaryFrequency:
 *               type: boolean
 *             urgency:
 *               type: boolean
 *             incontinence:
 *               type: boolean
 *             hematuria:
 *               type: boolean
 *             flankPain:
 *               type: boolean
 *     Examination:
 *       type: object
 *       properties:
 *         generalLook:
 *           type: string
 *         build:
 *           type: string
 *           enum: [normal, thin, obese, cachectic, muscular]
 *         levelOfConsciousness:
 *           type: string
 *           enum: [alert, drowsy, stuporous, unconscious]
 *         orientation:
 *           type: object
 *           properties:
 *             time:
 *               type: boolean
 *             person:
 *               type: boolean
 *             place:
 *               type: boolean
 *         attachment:
 *           type: string
 *           description: e.g., IV lines, oxygen mask
 *         pallor:
 *           type: boolean
 *         cyanosis:
 *           type: boolean
 *         jaundice:
 *           type: boolean
 *         clubbing:
 *           type: boolean
 *         edema:
 *           type: boolean
 *         lymphadenopathy:
 *           type: boolean
 *         dehydration:
 *           type: boolean
 *         weight:
 *           type: number
 *           description: Weight in kg
 *         height:
 *           type: number
 *           description: Height in cm
 *         bmi:
 *           type: number
 *           description: Body Mass Index
 *         bloodPressure:
 *           type: object
 *           properties:
 *             systolic:
 *               type: number
 *             diastolic:
 *               type: number
 *         heartRate:
 *           type: number
 *           description: Heart rate in bpm
 *         respiratoryRate:
 *           type: number
 *           description: Respiratory rate in breaths/min
 *         temperature:
 *           type: number
 *           description: Temperature in Celsius
 *         oxygenSaturation:
 *           type: number
 *           description: Oxygen saturation in %
 *         randomBloodSugar:
 *           type: number
 *           description: Blood sugar in mg/dL or mmol/L
 *         systemicExamination:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               system:
 *                 type: string
 *                 enum: [Cardiovascular, Respiratory, GIT, CNS, Musculoskeletal, Genitourinary, Endocrine]
 *               findings:
 *                 type: string
 *     Investigation:
 *       type: object
 *       properties:
 *         laboratoryTests:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               testName:
 *                 type: string
 *               result:
 *                 type: string
 *               normalRange:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [normal, abnormal, pending]
 *         imagingStudies:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               studyType:
 *                 type: string
 *               findings:
 *                 type: string
 *               impression:
 *                 type: string
 *         procedures:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               procedureName:
 *                 type: string
 *               findings:
 *                 type: string
 *               complications:
 *                 type: string
 *     Prescription:
 *       type: object
 *       properties:
 *         medications:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               drugName:
 *                 type: string
 *               dosage:
 *                 type: string
 *               frequency:
 *                 type: string
 *               duration:
 *                 type: string
 *               instructions:
 *                 type: string
 *         advice:
 *           type: string
 *           description: General medical advice
 *         followUp:
 *           type: string
 *           description: Follow-up instructions
 */

/**
 * @swagger
 * /api/visit/patient/{patientId}:
 *   get:
 *     summary: Get all visits for a patient
 *     tags: [Visits]
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
 *         description: List of patient visits
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
 *                     $ref: '#/components/schemas/Visit'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Doctor role required
 */
Router.get(
  "/visit/patient/:patientId",
  verifyToken,
  authorization(["doctor"]),
  GetAllVisitsOfPatient
);

/**
 * @swagger
 * /api/visit/{patientId}:
 *   post:
 *     summary: Create a new visit for a patient
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [consultation, follow-up]
 *     responses:
 *       201:
 *         description: Visit created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Visit'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Doctor role required
 */
Router.post(
  "/visit/:patientId",
  verifyToken,
  authorization(["doctor"]),
  CreateVisit
);

/**
 * @swagger
 * /api/visit/{visitId}/past-history:
 *   put:
 *     summary: Update past history of a visit
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: visitId
 *         required: true
 *         schema:
 *           type: string
 *         description: Visit ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PastHistory'
 *     responses:
 *       200:
 *         description: Past history updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Doctor role required
 *       404:
 *         description: Visit not found
 */
Router.put(
  "/visit/:visitId/past-history",
  verifyToken,
  authorization(["doctor"]),
  updatePastHistory
);

/**
 * @swagger
 * /api/visit/{visitId}/main-complaint:
 *   put:
 *     summary: Update main complaint of a visit
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: visitId
 *         required: true
 *         schema:
 *           type: string
 *         description: Visit ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MainComplaint'
 *     responses:
 *       200:
 *         description: Main complaint updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Doctor role required
 *       404:
 *         description: Visit not found
 */
Router.put(
  "/visit/:visitId/main-complaint",
  verifyToken,
  authorization(["doctor"]),
  updateMainComplaint
);

/**
 * @swagger
 * /api/visit/{visitId}/checks:
 *   put:
 *     summary: Update checks of a visit
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: visitId
 *         required: true
 *         schema:
 *           type: string
 *         description: Visit ID *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Checks'
 *     responses:
 *       200:
 *         description: Checks updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Doctor role required
 *       404:
 *         description: Visit not found
 */
Router.put(
  "/visit/:visitId/checks",
  verifyToken,
  authorization(["doctor"]),
  updateChecks
);

/**
 * @swagger
 * /api/visit/{visitId}/examination:
 *   put:
 *     summary: Update examination of a visit
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: visitId
 *         required: true
 *         schema:
 *           type: string
 *         description: Visit ID *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Examination'
 *     responses:
 *       200:
 *         description: Examination updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Doctor role required
 *       404:
 *         description: Visit not found
 */
Router.put(
  "/visit/:visitId/examination",
  verifyToken,
  authorization(["doctor"]),
  updateExamination
);

/**
 * @swagger
 * /api/visit/{visitId}/investigations:
 *   put:
 *     summary: Update investigations of a visit
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: visitId
 *         required: true
 *         schema:
 *           type: string
 *         description: Visit ID *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Investigation'
 *     responses:
 *       200:
 *         description: Investigations updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Doctor role required
 *       404:
 *         description: Visit not found
 */
Router.put(
  "/visit/:visitId/investigations",
  verifyToken,
  authorization(["doctor"]),
  updateInvestigations
);

/**
 * @swagger
 * /api/visit/{visitId}/prescription:
 *   put:
 *     summary: Update prescription of a visit
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: visitId
 *         required: true
 *         schema:
 *           type: string
 *         description: Visit ID *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Prescription'
 *     responses:
 *       200:
 *         description: Prescription updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Doctor role required
 *       404:
 *         description: Visit not found
 */
Router.put(
  "/visit/:visitId/prescription",
  verifyToken,
  authorization(["doctor"]),
  updatePrescription
);

/**
 * @swagger
 * /api/visit/{visitId}:
 *   get:
 *     summary: Get visit by ID
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: visitId
 *         required: true
 *         schema:
 *           type: string
 *         description: Visit ID
 *     responses:
 *       200:
 *         description: Visit retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Visit'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Doctor role required
 *       404:
 *         description: Visit not found
 */
Router.get(
  "/visit/:visitId",
  verifyToken,
  authorization(["doctor"]),
  GetVisitById
);

module.exports = Router;
