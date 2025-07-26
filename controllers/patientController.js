const createError = require("../util/createError");
const sendSuccess = require("../util/sendSucess");
const Patient = require("../models/patient"); // Assuming you have a Patient model
const { patientSchema } = require("../util/validations/PatientValidation");
//  get patient  for the doctor or secartary -> one with the general info and the other with the visits for the doctor

const GetAllPatientsForStaff = async (req, res, next) => {
  try {
    const patients = await Patient.find({}, { generalInfo: 1 }).lean();

    if (!patients || patients.length === 0) {
      return next(
        createError("No patients found", 404, {
          code: "PATIENTS_NOT_FOUND",
          details: { message: "No patient data available" },
        })
      );
    }
    sendSuccess(res, 200, "Patients fetched successfully", {
      data: { patients },
    });
  } catch (error) {
    next(
      createError("Failed to fetch patients", 500, {
        code: "PATIENTS_FETCH_ERROR",
        details: { message: error.message },
      })
    );
  }
};

const GetPatientByIdForStaff = async (req, res, next) => {
  const { patientId } = req.params;
  try {
    const patient = await Patient.findById(patientId, {
      generalInfo: 1,
    }).lean();
    if (!patient) {
      return next(
        createError("Patient not found", 404, {
          code: "PATIENT_NOT_FOUND",
          details: { message: "No patient found with the given ID" },
        })
      );
    }
    sendSuccess(res, 200, "Patient fetched successfully", {
      data: { patient },
    });
  } catch (error) {
    next(
      createError("Failed to fetch patient", 500, {
        code: "PATIENT_FETCH_ERROR",
        details: { message: error.message },
      })
    );
  }
};
// create new patient profile by staff
const CreatePatientProfile = async (req, res, next) => {
  try {
    // Validate request body against the schema
    const { error } = patientSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return next(
        createError("Validation Error", 400, {
          code: "VALIDATION_FAILED",
          details: error.details.map((err) => err.message),
        })
      );
    }
    const { generalInfo } = req.body;

    const newPatient = await new Patient({
      generalInfo,
    });
    await newPatient.save();
    sendSuccess(res, 201, "Patient profile created successfully", {
      data: { patientId: newPatient._id, name: newPatient.name },
    });
  } catch (error) {
    next(
      createError("Failed to create patient profile", 500, {
        code: "PATIENT_CREATION_ERROR",
        details: { message: error.message },
      })
    );
  }
};

// get patient profile with filters for doctor

const GetPatientProfileForDoctor = async (req, res, next) => {
  // i am thinking to make a quey optional paramter and filters
  const { patientId } = req.params;
  try {
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return next(
        createError("Patient not found", 404, {
          code: "PATIENT_NOT_FOUND",
          details: { message: "No patient found with the given ID" },
        })
      );
    }
    sendSuccess(res, 200, "Patient profile fetched successfully", {
      data: { patient },
    });
  } catch (error) {
    next(
      createError("Failed to fetch patient profile", 500, {
        code: "PATIENT_PROFILE_FETCH_ERROR",
        details: { message: error.message },
      })
    );
  }
};

module.exports = {
  GetAllPatientsForStaff,
  GetPatientByIdForStaff,
  CreatePatientProfile,
  GetPatientProfileForDoctor,
};
