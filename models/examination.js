const mongoose = require("mongoose");

const ExaminationSchema = new mongoose.Schema({
  generalLook: String,
  build: {
    type: String,
    enum: ["normal", "thin", "obese", "cachectic", "muscular"],
  },
  levelOfConsciousness: {
    type: String,
    enum: ["alert", "drowsy", "stuporous", "unconscious"],
  },
  orientation: {
    time: Boolean,
    person: Boolean,
    place: Boolean,
  },
  attachment: String, // e.g., IV lines, oxygen mask
  pallor: Boolean,
  cyanosis: Boolean,
  jaundice: Boolean,
  clubbing: Boolean,
  edema: Boolean,
  lymphadenopathy: Boolean,
  dehydration: Boolean,

  weight: Number, // in kg
  height: Number, // in cm
  bmi: Number, // auto-calculated in logic layer from weight & height

  bloodPressure: {
    systolic: Number,
    diastolic: Number,
  },
  heartRate: Number, // bpm
  respiratoryRate: Number, // breaths/min
  temperature: Number, // in Celsius
  oxygenSaturation: Number, // in %
  randomBloodSugar: Number, // mg/dL or mmol/L
  systemicExamination: [
    {
      system: {
        type: String,
        enum: [
          "Cardiovascular",
          "Respiratory",
          "GIT",
          "CNS",
          "Musculoskeletal",
          "Genitourinary",
          "Endocrine",
          "Others",
        ],
      },
      inspection: String,
      palpation: String,
      percussion: String,
      auscultation: String,
      otherNotes: String,
    },
  ],
  otherFindings: String, // optional field for any extra notes
});

module.exports = mongoose.model("Examination", ExaminationSchema);
