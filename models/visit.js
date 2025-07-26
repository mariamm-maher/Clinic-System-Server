const mongoose = require("mongoose");

const VisitSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
  type: { type: String, enum: ["consultation", "follow-up"], required: true },
  date: { type: Date, default: Date.now },

  pastHistory: {
    medicalHistory: String,
    medications: String,
    surgicalHistory: String,
    hospitalizations: String,
    allergies: String,
  },

  mainComplaint: {
    description: { type: String }, // main reason for visit
    onset: String, // When did it start?
    duration: String, // How long has it been there?
    location: String, // Where exactly is the symptom?
    character: String, // e.g., sharp, dull, throbbing
    course: String, // Has it been continuous, intermittent?
    severity: String, // Mild, moderate, severe (or 0-10 scale)
    radiation: String, // Does it spread anywhere?
    associatedSymptoms: String, // e.g., nausea, fever, vomiting
    aggravatingFactors: String, // What makes it worse?
    relievingFactors: String, // What makes it better?
    previousEpisodes: String, // Has it happened before?
    impactOnLife: String, // Does it affect sleep, appetite, etc.?
    patientThoughts: String, // What does the patient think it is?
    otherNotes: String, // Any other relevant detail
  },

  // Reference to separate Checks model
  checks: { type: mongoose.Schema.Types.ObjectId, ref: "Checks" },

  // Reference to separate Examination model
  examination: { type: mongoose.Schema.Types.ObjectId, ref: "Examination" },

  // Reference to separate Investigation model
  investigations: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Investigation",
  },

  // Reference to separate Prescription model
  prescription: { type: mongoose.Schema.Types.ObjectId, ref: "Prescription" },
});

module.exports = mongoose.model("Visit", VisitSchema);
