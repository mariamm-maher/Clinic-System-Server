const mongoose = require("mongoose");

const PrescriptionSchema = new mongoose.Schema({
  lifestyle: String,
  medications: [String],
  orderedInvestigations: [String],
  referrals: [String], // e.g., to specialists
  followUp: {
    date: Date,
    notes: String,
  },
});

module.exports = mongoose.model("Prescription", PrescriptionSchema);
