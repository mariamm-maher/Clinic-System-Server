const Visit = require("../models/visit");
const createError = require("../util/createError");
const sendSuccess = require("../util/sendSucess");
const Patient = require("../models/patient");
const Checks = require("../models/checks");
const Examination = require("../models/examination");
const Investigation = require("../models/investigation");
const Prescription = require("../models/prescription");

//thses all without  validations just for now

// new visit  create new vist for this patient

const CreateVisit = async (req, res, next) => {
  const { patientId } = req.params;
  const { type } = req.body;
  try {
    if (!patientId || !type) {
      return next(
        createError("Patient ID and visit type are required", 400, {
          code: "MISSING_FIELDS",
          details: { message: "Patient ID and visit type must be provided" },
        })
      );
    }
    const FoundPatient = await Patient.findById(patientId);

    if (!FoundPatient) {
      return next(
        createError("Patient not found", 404, {
          code: "PATIENT_NOT_FOUND",
          details: { message: "No patient found with the given ID" },
        })
      );
    }
    const newVisit = await Visit({
      patient: patientId,
      type,
    });
    await newVisit.save();
    FoundPatient.visits.push(newVisit._id);
    await FoundPatient.save();
    sendSuccess(res, 201, "Visit created successfully", {
      data: { visit: newVisit },
    });
  } catch (error) {
    next(
      createError("Failed to create visit", 500, {
        code: "VISIT_CREATION_ERROR",
        details: { message: error.message },
      })
    );
  }
};
//update past history of the visit
const updatePastHistory = async (req, res, next) => {
  const { visitId } = req.params;
  const { pastHistory } = req.body; // { pastHistory, currentSymptoms, diagnosis, treatmentPlan }
  try {
    // Check if pastHistory data is provided
    if (!pastHistory || Object.keys(pastHistory).length === 0) {
      return next(
        createError("Past history data is required", 400, {
          code: "MISSING_PAST_HISTORY_DATA",
          details: {
            message:
              "Past history object must be provided with at least one field",
          },
        })
      );
    }

    // Convert pastHistory fields to dot notation paths:
    const updateData = {};
    for (const key in pastHistory) {
      updateData[`pastHistory.${key}`] = pastHistory[key];
    }

    const updatedVisit = await Visit.findByIdAndUpdate(
      visitId,
      { $set: updateData },
      { new: true }
    );

    if (!updatedVisit) {
      return next(
        createError("Visit not found", 404, {
          code: "VISIT_NOT_FOUND",
          details: { visitId },
        })
      );
    }
    sendSuccess(res, 200, "Visit updated successfully", {
      data: { visit: updatedVisit },
    });
  } catch (error) {
    next(
      createError("Failed to update visit", 500, {
        code: "VISIT_UPDATE_ERROR",
        details: { message: error.message },
      })
    );
  }
};

// update main complaint of the visit
const updateMainComplaint = async (req, res, next) => {
  const { visitId } = req.params;
  const { mainComplaint } = req.body;
  try {
    // Check if mainComplaint data is provided
    if (!mainComplaint || Object.keys(mainComplaint).length === 0) {
      return next(
        createError("Main complaint data is required", 400, {
          code: "MISSING_MAIN_COMPLAINT_DATA",
          details: {
            message:
              "Main complaint object must be provided with at least one field",
          },
        })
      );
    }

    // Convert mainComplaint fields to dot notation paths:
    const updateData = {};
    for (const key in mainComplaint) {
      updateData[`mainComplaint.${key}`] = mainComplaint[key];
    }

    const updatedVisit = await Visit.findByIdAndUpdate(
      visitId,
      { $set: updateData },
      { new: true }
    );

    if (!updatedVisit) {
      return next(
        createError("Visit not found", 404, {
          code: "VISIT_NOT_FOUND",
          details: { visitId },
        })
      );
    }
    sendSuccess(res, 200, "Main complaint updated successfully", {
      data: { visit: updatedVisit },
    });
  } catch (error) {
    next(
      createError("Failed to update main complaint", 500, {
        code: "MAIN_COMPLAINT_UPDATE_ERROR",
        details: { message: error.message },
      })
    );
  }
};

//update checks
const updateChecks = async (req, res, next) => {
  const { visitId } = req.params;
  const { checks } = req.body;
  try {
    if (!checks || Object.keys(checks).length === 0) {
      return next(
        createError("Checks data is required", 400, {
          code: "MISSING_CHECKS_DATA",
          details: {
            message: "Checks object must be provided with at least one field",
          },
        })
      );
    }

    const visit = await Visit.findById(visitId);
    if (!visit) {
      return next(
        createError("Visit not found", 404, {
          code: "VISIT_NOT_FOUND",
          details: { visitId },
        })
      );
    }

    if (!visit.checks) {
      const newChecks = new Checks();
      await newChecks.save();
      visit.checks = newChecks._id;
      await visit.save();
    }

    // Flatten the nested checks object to dot notation keys
    const updateData = {};
    const flattenObj = (obj, parentKey = "") => {
      for (const key in obj) {
        const value = obj[key];
        const fullKey = parentKey ? `${parentKey}.${key}` : key;
        if (
          value !== null &&
          typeof value === "object" &&
          !Array.isArray(value)
        ) {
          flattenObj(value, fullKey);
        } else {
          updateData[fullKey] = value;
        }
      }
    };
    flattenObj(checks);

    await Checks.findByIdAndUpdate(
      visit.checks,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    const updatedVisit = await Visit.findById(visitId).populate("checks");

    sendSuccess(res, 200, "Checks updated successfully", {
      data: { visit: updatedVisit },
    });
  } catch (error) {
    next(
      createError("Failed to update checks", 500, {
        code: "CHECKS_UPDATE_ERROR",
        details: { message: error.message },
      })
    );
  }
};

//update examination
const updateExamination = async (req, res, next) => {
  const { visitId } = req.params;
  const { examination } = req.body;
  try {
    // Check if examination data is provided
    if (!examination || Object.keys(examination).length === 0) {
      return next(
        createError("Examination data is required", 400, {
          code: "MISSING_EXAMINATION_DATA",
          details: {
            message:
              "Examination object must be provided with at least one field",
          },
        })
      );
    }

    // Find the visit first
    const visit = await Visit.findById(visitId);
    if (!visit) {
      return next(
        createError("Visit not found", 404, {
          code: "VISIT_NOT_FOUND",
          details: { visitId },
        })
      );
    }

    let examinationDocument;

    // If visit already has an examination reference, update the existing examination document
    if (visit.examination) {
      examinationDocument = await Examination.findByIdAndUpdate(
        visit.examination,
        examination,
        { new: true, runValidators: true }
      );

      if (!examinationDocument) {
        // If the referenced examination document doesn't exist, create a new one
        examinationDocument = new Examination(examination);
        await examinationDocument.save();

        // Update the visit with the new examination reference
        visit.examination = examinationDocument._id;
        await visit.save();
      }
    } else {
      // Create a new examination document
      examinationDocument = new Examination(examination);
      await examinationDocument.save();

      // Update the visit with the examination reference
      visit.examination = examinationDocument._id;
      await visit.save();
    }

    // Populate the visit with the updated examination
    const updatedVisit = await Visit.findById(visitId).populate("examination");

    sendSuccess(res, 200, "Examination updated successfully", {
      data: { visit: updatedVisit },
    });
  } catch (error) {
    next(
      createError("Failed to update examination", 500, {
        code: "EXAMINATION_UPDATE_ERROR",
        details: { message: error.message },
      })
    );
  }
};

//update investigations
const updateInvestigations = async (req, res, next) => {
  const { visitId } = req.params;
  const { investigations } = req.body;
  try {
    // Check if investigations data is provided
    if (!investigations || Object.keys(investigations).length === 0) {
      return next(
        createError("Investigations data is required", 400, {
          code: "MISSING_INVESTIGATIONS_DATA",
          details: {
            message:
              "Investigations object must be provided with at least one field",
          },
        })
      );
    }

    // Find the visit first
    const visit = await Visit.findById(visitId);
    if (!visit) {
      return next(
        createError("Visit not found", 404, {
          code: "VISIT_NOT_FOUND",
          details: { visitId },
        })
      );
    }

    let investigationsDocument;

    // If visit already has an investigations reference, update the existing investigations document
    if (visit.investigations) {
      investigationsDocument = await Investigation.findByIdAndUpdate(
        visit.investigations,
        investigations,
        { new: true, runValidators: true }
      );

      if (!investigationsDocument) {
        // If the referenced investigations document doesn't exist, create a new one
        investigationsDocument = new Investigation(investigations);
        await investigationsDocument.save();

        // Update the visit with the new investigations reference
        visit.investigations = investigationsDocument._id;
        await visit.save();
      }
    } else {
      // Create a new investigations document
      investigationsDocument = new Investigation(investigations);
      await investigationsDocument.save();

      // Update the visit with the investigations reference
      visit.investigations = investigationsDocument._id;
      await visit.save();
    }

    // Populate the visit with the updated investigations
    const updatedVisit = await Visit.findById(visitId).populate(
      "investigations"
    );

    sendSuccess(res, 200, "Investigations updated successfully", {
      data: { visit: updatedVisit },
    });
  } catch (error) {
    next(
      createError("Failed to update investigations", 500, {
        code: "INVESTIGATIONS_UPDATE_ERROR",
        details: { message: error.message },
      })
    );
  }
};

//update prescription
const updatePrescription = async (req, res, next) => {
  const { visitId } = req.params;
  const { prescription } = req.body;
  try {
    // Check if prescription data is provided
    if (!prescription || Object.keys(prescription).length === 0) {
      return next(
        createError("Prescription data is required", 400, {
          code: "MISSING_PRESCRIPTION_DATA",
          details: {
            message:
              "Prescription object must be provided with at least one field",
          },
        })
      );
    }

    // Find the visit first
    const visit = await Visit.findById(visitId);
    if (!visit) {
      return next(
        createError("Visit not found", 404, {
          code: "VISIT_NOT_FOUND",
          details: { visitId },
        })
      );
    }

    let prescriptionDocument;

    // If visit already has a prescription reference, update the existing prescription document
    if (visit.prescription) {
      prescriptionDocument = await Prescription.findByIdAndUpdate(
        visit.prescription,
        prescription,
        { new: true, runValidators: true }
      );

      if (!prescriptionDocument) {
        // If the referenced prescription document doesn't exist, create a new one
        prescriptionDocument = new Prescription(prescription);
        await prescriptionDocument.save();

        // Update the visit with the new prescription reference
        visit.prescription = prescriptionDocument._id;
        await visit.save();
      }
    } else {
      // Create a new prescription document
      prescriptionDocument = new Prescription(prescription);
      await prescriptionDocument.save();

      // Update the visit with the prescription reference
      visit.prescription = prescriptionDocument._id;
      await visit.save();
    }

    // Populate the visit with the updated prescription
    const updatedVisit = await Visit.findById(visitId).populate("prescription");

    sendSuccess(res, 200, "Prescription updated successfully", {
      data: { visit: updatedVisit },
    });
  } catch (error) {
    next(
      createError("Failed to update prescription", 500, {
        code: "PRESCRIPTION_UPDATE_ERROR",
        details: { message: error.message },
      })
    );
  }
};

// get all visits for a patient
const GetAllVisitsOfPatient = async (req, res, next) => {
  const { patientId } = req.params;
  try {
    if (!patientId) {
      return next(
        createError("Patient ID is required", 400, {
          code: "MISSING_PATIENT_ID",
          details: { message: "Patient ID must be provided" },
        })
      );
    }
    const visits = await Visit.find({ patient: patientId }).populate([
      "checks",
      "examination",
      "investigations",
      "prescription",
    ]);
    sendSuccess(res, 200, "Visits retrieved successfully", {
      data: { visits },
    });
  } catch (error) {
    next(
      createError("Failed to retrieve visits", 500, {
        code: "VISIT_RETRIEVAL_ERROR",
        details: { message: error.message },
      })
    );
  }
};
// get visit  by id

const GetVisitById = async (req, res, next) => {
  const { visitId } = req.params;
  try {
    if (!visitId) {
      return next(
        createError("Visit ID is required", 400, {
          code: "MISSING_VISIT_ID",
          details: { message: "Visit ID must be provided" },
        })
      );
    }
    const visit = await Visit.findById(visitId).populate([
      "checks",
      "examination",
      "investigations",
      "prescription",
    ]);
    if (!visit) {
      return next(
        createError("Visit not found", 404, {
          code: "VISIT_NOT_FOUND",
          details: { visitId },
        })
      );
    }
    sendSuccess(res, 200, "Visit retrieved successfully", {
      data: { visit },
    });
  } catch (error) {
    next(
      createError("Failed to retrieve visit", 500, {
        code: "VISIT_RETRIEVAL_ERROR",
        details: { message: error.message },
      })
    );
  }
};

module.exports = {
  CreateVisit,
  updatePastHistory,
  updateMainComplaint,
  updateChecks,
  updateExamination,
  updateInvestigations,
  updatePrescription,
  GetVisitById,
  GetAllVisitsOfPatient,
};
